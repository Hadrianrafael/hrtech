/**
 * Worker da Equipe IA: reivindica tarefas da fila (FOR UPDATE SKIP LOCKED — vários workers em paralelo nunca
 * pegam a mesma tarefa), executa dentro de um orçamento de tempo, processa a fila do n8n, recupera execuções
 * interrompidas e expira aprovações antigas. Disparado pelo cron (/api/cron/ai — Vercel Cron, agendador do n8n ou
 * cron externo) e logo após ações na tela (novo objetivo, aprovação, nova tentativa).
 */
import { Prisma } from '@prisma/client';
import { withSystem, systemDb, tenantDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logActivity } from './activity';
import { scheduleDueBriefings } from './briefing';
import { executeTask } from './engine';
import { processDueDispatches } from './n8n';
import { syncObjective } from './objectives';

const LEASE_MINUTES = 10;

/** Reivindica atomicamente a próxima tarefa executável (empresa ativa, Equipe IA ligada e não pausada, agente ativo). */
export async function claimNextTask(orgId?: string): Promise<{ id: string; organizationId: string } | null> {
  const rows = await withSystem((tx) =>
    tx.$queryRaw<{ id: string; organizationId: string }[]>`
      WITH next AS (
        SELECT t.id FROM "AiTask" t
        JOIN "AiAgent" a ON a.id = t."agentId"
        JOIN "AiCompany" c ON c."organizationId" = t."organizationId"
        JOIN "Organization" o ON o.id = t."organizationId"
        WHERE t.status = 'QUEUED' AND t."waitingFor" IS NULL AND t."nextRunAt" <= now()
          AND a.status = 'ACTIVE' AND c.enabled AND NOT c.paused AND o.status = 'ACTIVE'
          ${orgId ? Prisma.sql`AND t."organizationId" = ${orgId}` : Prisma.empty}
        ORDER BY t.priority DESC, t."nextRunAt" ASC
        LIMIT 1
        FOR UPDATE OF t SKIP LOCKED
      )
      UPDATE "AiTask" SET status = 'RUNNING', "lockedUntil" = now() + make_interval(mins => ${LEASE_MINUTES}::int),
        attempts = attempts + 1, "startedAt" = COALESCE("startedAt", now()), "blockedReason" = NULL, "updatedAt" = now()
      FROM next WHERE "AiTask".id = next.id
      RETURNING "AiTask".id, "AiTask"."organizationId"`,
  );
  return rows[0] ?? null;
}

/** Tarefas RUNNING com lease vencido (processo interrompido) voltam para a fila ou falham após o limite. */
export async function recoverStaleTasks(now = new Date(), orgId?: string) {
  const stale = await systemDb.aiTask.findMany({ where: { status: 'RUNNING', waitingFor: null, lockedUntil: { lt: now }, ...(orgId ? { organizationId: orgId } : {}) }, take: 100 });
  for (const t of stale) {
    const exhausted = t.attempts >= t.maxAttempts;
    const r = await systemDb.aiTask.updateMany({
      where: { id: t.id, status: 'RUNNING', lockedUntil: { lt: now } },
      data: exhausted
        ? { status: 'FAILED', error: 'Execução interrompida repetidamente.', completedAt: now, lockedUntil: null }
        : { status: 'QUEUED', lockedUntil: null, nextRunAt: now },
    });
    if (r.count) {
      await logActivity({ orgId: t.organizationId, agentId: t.agentId, objectiveId: t.objectiveId, taskId: t.id, type: 'task.recovered', level: 'warning', message: exhausted ? `"${t.title}" falhou após interrupções repetidas.` : `"${t.title}" foi interrompida e voltou para a fila.` });
      if (exhausted && t.objectiveId) await syncObjective(t.organizationId, t.objectiveId);
    }
  }
  return stale.length;
}

/** Aprovações vencidas viram rejeição; a tarefa volta para a fila e o agente segue sem a ação. */
export async function expireApprovals(now = new Date(), orgId?: string) {
  const expired = await systemDb.aiApproval.findMany({ where: { status: 'PENDING', expiresAt: { lt: now }, ...(orgId ? { organizationId: orgId } : {}) }, take: 100 });
  for (const a of expired) {
    const r = await systemDb.aiApproval.updateMany({ where: { id: a.id, status: 'PENDING' }, data: { status: 'EXPIRED', decidedAt: now, decisionNote: 'Prazo de aprovação expirado.' } });
    if (!r.count) continue;
    const db = tenantDb(a.organizationId);
    await db.aiToolCall.updateMany({ where: { id: a.toolCallId, status: 'PENDING_APPROVAL' }, data: { status: 'REJECTED', error: 'Prazo de aprovação expirado.' } });
    await db.aiTask.updateMany({ where: { id: a.taskId, status: 'WAITING_APPROVAL' }, data: { status: 'QUEUED', waitingFor: null, nextRunAt: now } });
    await logActivity({ orgId: a.organizationId, agentId: a.agentId, taskId: a.taskId, type: 'approval.expired', level: 'warning', message: `Aprovação expirada: ${a.summary}` });
  }
  return expired.length;
}

export interface WorkerSummary {
  tasks: number;
  outcomes: Record<string, number>;
  recovered: number;
  approvalsExpired: number;
  briefingsQueued: number;
  dispatches: { processed: number; outcomes: Record<string, number> };
  deferred: boolean;
}

/** Ciclo do worker com orçamento de tempo (as funções serverless têm duração máxima). */
export async function runAiWorker(opts: { orgId?: string; maxTasks?: number; budgetMs?: number; housekeeping?: boolean } = {}): Promise<WorkerSummary> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 40_000;
  const summary: WorkerSummary = { tasks: 0, outcomes: {}, recovered: 0, approvalsExpired: 0, briefingsQueued: 0, dispatches: { processed: 0, outcomes: {} }, deferred: false };
  if (opts.housekeeping !== false) {
    try {
      // Com orgId (ex.: botão "processar agora" de uma empresa), a manutenção fica restrita a essa empresa.
      summary.recovered = await recoverStaleTasks(new Date(), opts.orgId);
      summary.approvalsExpired = await expireApprovals(new Date(), opts.orgId);
      summary.briefingsQueued = opts.orgId ? 0 : await scheduleDueBriefings();
      summary.dispatches = await processDueDispatches(25, new Date(), opts.orgId);
    } catch (err) {
      logger.error('ai_worker.housekeeping_failed', { err });
    }
  }
  const max = opts.maxTasks ?? 20;
  while (summary.tasks < max) {
    if (Date.now() - started > budget) {
      summary.deferred = true;
      break;
    }
    const next = await claimNextTask(opts.orgId);
    if (!next) break;
    const outcome = await executeTask(next.organizationId, next.id);
    summary.tasks++;
    const key = outcome?.type ?? 'skipped';
    summary.outcomes[key] = (summary.outcomes[key] ?? 0) + 1;
  }
  return summary;
}
