import type { AiObjectiveStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { withTenant } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/errors';
import { assertRateLimit } from '@/lib/rate-limit';
import { logActivity } from './activity';
import { detectPlaybook, PLAYBOOK_LABELS } from './playbooks';
import { createAiTask } from './tasks';

const TERMINAL = ['COMPLETED', 'FAILED', 'CANCELLED'] as const;

export const objectiveSchema = z.object({ command: z.string().trim().min(3, 'Descreva o objetivo.').max(2000) });

/**
 * Cria um objetivo e a tarefa de planejamento do CEO Agent.
 * O comando vem de uma pessoa autorizada (permissão ai_team.command) ou do n8n (assinado), nunca de dados externos.
 */
export async function createObjective(
  ctx: ServiceCtx,
  input: z.input<typeof objectiveSchema>,
  opts: { source?: 'USER' | 'N8N' | 'SYSTEM'; createdById?: string | null } = {},
) {
  if ((opts.source ?? 'USER') === 'USER') {
    assertCan(ctx, 'ai_team.command');
    // Os agentes leem os dados de toda a empresa em nome de quem pediu.
    assertCan(ctx, 'records.view_all');
  }
  const { command } = objectiveSchema.parse(input);
  const company = await ctx.db.aiCompany.findFirst({});
  if (!company?.enabled) throw new AppError('A Equipe IA não está ativada para esta empresa. Ative em Equipe IA → Configurações.');
  const ceo = await ctx.db.aiAgent.findFirst({ where: { isCeo: true } });
  if (!ceo || ceo.status === 'DISABLED') throw new AppError('O CEO Agent está desativado.');
  assertRateLimit(`ai-objective:${ctx.orgId}:${opts.createdById ?? ctx.userId ?? 'system'}`, 30, 60 * 60_000, 'Muitos objetivos em pouco tempo. Aguarde alguns minutos.');

  const detected = detectPlaybook(command);
  const title = command.length > 90 ? `${command.slice(0, 87)}…` : command;
  const objective = await ctx.db.aiObjective.create({
    data: {
      organizationId: ctx.orgId,
      title,
      command,
      playbook: detected.key,
      plan: { playbook: detected.key, label: PLAYBOOK_LABELS[detected.key], params: detected.params } as Prisma.InputJsonValue,
      source: opts.source ?? 'USER',
      createdById: opts.createdById ?? ctx.userId,
      status: 'OPEN',
    },
  });
  await createAiTask({
    orgId: ctx.orgId,
    agentId: ceo.id,
    title: `Planejar: ${title}`,
    instructions: command,
    kind: 'plan',
    objectiveId: objective.id,
    priority: 8,
    input: { mode: 'llm', command, playbook: detected.key, params: detected.params },
    createdByUserId: opts.createdById ?? ctx.userId,
  });
  await logActivity({ orgId: ctx.orgId, agentId: ceo.id, objectiveId: objective.id, type: 'objective.created', message: `Novo objetivo para o CEO Agent: "${title}".` });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, actorType: ctx.actorType, action: 'ai_team.objective_created', entityType: 'AiObjective', entityId: objective.id, metadata: { source: opts.source ?? 'USER' } });
  return objective;
}

/**
 * Recalcula o status do objetivo. Quando todas as tarefas de trabalho terminam, cria (uma única vez, sob
 * advisory lock) a tarefa de revisão do CEO; quando a revisão termina, conclui o objetivo com o relatório final.
 */
export async function syncObjective(orgId: string, objectiveId: string) {
  return withTenant(orgId, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ai-objective:${objectiveId}`}))`;
    const objective = await tx.aiObjective.findFirst({ where: { id: objectiveId, organizationId: orgId } });
    if (!objective || objective.status === 'CANCELLED') return objective;
    const tasks = await tx.aiTask.findMany({ where: { objectiveId, organizationId: orgId }, orderBy: { createdAt: 'asc' } });
    const cost = tasks.reduce((s, t) => s + t.costMicroUsd, 0);
    const plan = tasks.find((t) => t.kind === 'plan');
    const reviews = tasks.filter((t) => t.kind === 'review');
    const work = tasks.filter((t) => t.kind === 'work');
    // Uma revisão anterior à conclusão de alguma tarefa (ex.: tarefa reprocessada) está desatualizada: faz outra.
    const lastWorkDone = Math.max(0, ...work.map((t) => t.completedAt?.getTime() ?? 0));
    const latestReview = reviews.at(-1);
    const review = latestReview && latestReview.createdAt.getTime() >= lastWorkDone ? latestReview : undefined;
    const allTerminal = tasks.every((t) => (TERMINAL as readonly string[]).includes(t.status));

    let status: AiObjectiveStatus = objective.status;
    let result = objective.result;
    let completedAt = objective.completedAt;
    if (tasks.some((t) => t.status === 'WAITING_APPROVAL')) status = 'WAITING_APPROVAL';
    else if (!allTerminal) status = 'IN_PROGRESS';
    else if (review) {
      status = review.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
      result = review.result ?? review.error ?? result;
      completedAt = new Date();
    } else if (work.length && plan) {
      // Todas as tarefas delegadas terminaram: o CEO revisa e consolida o resultado.
      await tx.aiTask.create({
        data: {
          organizationId: orgId,
          agentId: plan.agentId,
          objectiveId,
          parentTaskId: plan.id,
          title: `Revisar resultados: ${objective.title}`.slice(0, 200),
          instructions: objective.command,
          kind: 'review',
          priority: 8,
          input: { mode: 'review', command: objective.command, playbook: objective.playbook ?? undefined } as Prisma.InputJsonValue,
        },
      });
      status = 'IN_PROGRESS';
    } else if (plan) {
      status = plan.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
      result = plan.result ?? plan.error ?? result;
      completedAt = new Date();
    }
    return tx.aiObjective.update({ where: { id: objectiveId }, data: { status, result, completedAt, costMicroUsd: cost } });
  });
}

export async function cancelObjective(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.command');
  const objective = await ctx.db.aiObjective.findFirst({ where: { id } });
  if (!objective) throw new NotFoundError('Objetivo não encontrado.');
  if ((TERMINAL as readonly string[]).includes(objective.status)) throw new AppError('Este objetivo já foi encerrado.');
  const now = new Date();
  const open = await ctx.db.aiTask.findMany({ where: { objectiveId: id, status: { notIn: [...TERMINAL] } }, select: { id: true } });
  const ids = open.map((t) => t.id);
  await ctx.db.aiTask.updateMany({ where: { id: { in: ids } }, data: { status: 'CANCELLED', completedAt: now, waitingFor: null, lockedUntil: null, error: 'Cancelada pela equipe.' } });
  await ctx.db.aiApproval.updateMany({ where: { taskId: { in: ids }, status: 'PENDING' }, data: { status: 'REJECTED', decidedById: ctx.userId, decidedAt: now, decisionNote: 'Objetivo cancelado.' } });
  await ctx.db.aiToolCall.updateMany({ where: { taskId: { in: ids }, status: { in: ['PENDING_APPROVAL', 'APPROVED'] } }, data: { status: 'REJECTED', error: 'Objetivo cancelado.' } });
  await ctx.db.n8nDispatch.updateMany({ where: { taskId: { in: ids }, status: 'PENDING' }, data: { status: 'CANCELLED', lastError: 'Objetivo cancelado.' } });
  await ctx.db.aiObjective.update({ where: { id }, data: { status: 'CANCELLED', completedAt: now } });
  await logActivity({ orgId: ctx.orgId, objectiveId: id, type: 'objective.cancelled', level: 'warning', message: `Objetivo cancelado: "${objective.title}".` });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.objective_cancelled', entityType: 'AiObjective', entityId: id });
}

export async function listObjectives(ctx: ServiceCtx, opts: { take?: number } = {}) {
  assertCan(ctx, 'ai_team.view');
  return ctx.db.aiObjective.findMany({
    orderBy: { createdAt: 'desc' },
    take: opts.take ?? 30,
    include: { tasks: { select: { id: true, status: true, kind: true, agentId: true } } },
  });
}

export async function getObjective(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.view');
  const objective = await ctx.db.aiObjective.findFirst({
    where: { id },
    include: { tasks: { orderBy: { createdAt: 'asc' }, include: { agent: { select: { id: true, name: true, key: true } } } } },
  });
  if (!objective) throw new NotFoundError('Objetivo não encontrado.');
  const taskIds = objective.tasks.map((t) => t.id);
  const [activities, approvals, toolCalls] = await Promise.all([
    ctx.db.aiActivity.findMany({ where: { objectiveId: id }, orderBy: { createdAt: 'asc' }, take: 300 }),
    ctx.db.aiApproval.findMany({ where: { taskId: { in: taskIds } }, orderBy: { createdAt: 'desc' } }),
    ctx.db.aiToolCall.findMany({ where: { taskId: { in: taskIds } }, orderBy: { createdAt: 'asc' }, take: 300 }),
  ]);
  return { objective, activities, approvals, toolCalls };
}
