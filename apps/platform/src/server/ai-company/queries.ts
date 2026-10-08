/** Consultas (somente leitura) para as telas da Equipe IA, e ações de manutenção de tarefas. */
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { AppError, NotFoundError } from '@/lib/errors';
import { providerStatus } from '../ai/provider';
import { logActivity } from './activity';
import { readBriefingConfig } from './briefing';
import { n8nConfig } from './n8n';
import { syncObjective } from './objectives';
import { resolveLimits } from './policy';
import { releaseDependents } from './tasks';
import { roleToolCatalog } from './tools';

const ACTIVE_STATUSES = ['QUEUED', 'RUNNING', 'WAITING_APPROVAL'] as const;

function monthStart() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1);
}
function dayStart() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

export async function getTeamOverview(ctx: ServiceCtx) {
  assertCan(ctx, 'ai_team.view');
  const company = await ctx.db.aiCompany.findFirst({});
  if (!company) return null;
  const since7 = new Date(Date.now() - 7 * 86_400_000);
  const [agents, taskGroups, monthRuns, todayRuns, errors, lastRuns, pendingApprovals, activities, completed7] = await Promise.all([
    ctx.db.aiAgent.findMany({ orderBy: [{ isCeo: 'desc' }, { createdAt: 'asc' }] }),
    ctx.db.aiTask.groupBy({ by: ['agentId', 'status'], _count: { _all: true } }),
    ctx.db.aiTaskRun.groupBy({ by: ['agentId'], where: { startedAt: { gte: monthStart() } }, _sum: { costMicroUsd: true, tokensIn: true, tokensOut: true }, _count: { _all: true } }),
    ctx.db.aiTaskRun.aggregate({ where: { startedAt: { gte: dayStart() } }, _sum: { costMicroUsd: true } }),
    ctx.db.aiTaskRun.groupBy({ by: ['agentId'], where: { status: 'FAILED', startedAt: { gte: since7 } }, _count: { _all: true } }),
    ctx.db.aiTaskRun.findMany({ where: { startedAt: { gte: since7 } }, orderBy: { startedAt: 'desc' }, take: 200, select: { agentId: true, startedAt: true, status: true } }),
    ctx.db.aiApproval.count({ where: { status: 'PENDING' } }),
    ctx.db.aiActivity.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }),
    ctx.db.aiTask.groupBy({ by: ['agentId'], where: { status: 'COMPLETED', completedAt: { gte: since7 } }, _count: { _all: true } }),
  ]);
  const monthCost = monthRuns.reduce((s, r) => s + (r._sum.costMicroUsd ?? 0), 0);
  return {
    company,
    briefing: readBriefingConfig(company),
    limits: resolveLimits(company.limits),
    providers: providerStatus(),
    n8n: n8nConfig(),
    pendingApprovals,
    activities,
    cost: { todayMicro: todayRuns._sum.costMicroUsd ?? 0, monthMicro: monthCost },
    agents: agents.map((a) => {
      const byStatus = Object.fromEntries(taskGroups.filter((g) => g.agentId === a.id).map((g) => [g.status, g._count._all])) as Record<string, number>;
      const runs = monthRuns.find((r) => r.agentId === a.id);
      return {
        ...a,
        tasks: byStatus,
        active: ACTIVE_STATUSES.reduce((s, k) => s + (byStatus[k] ?? 0), 0),
        monthCostMicro: runs?._sum.costMicroUsd ?? 0,
        monthTokens: (runs?._sum.tokensIn ?? 0) + (runs?._sum.tokensOut ?? 0),
        monthRuns: runs?._count._all ?? 0,
        errors7d: errors.find((e) => e.agentId === a.id)?._count._all ?? 0,
        completed7d: completed7.find((c) => c.agentId === a.id)?._count._all ?? 0,
        lastRunAt: lastRuns.find((r) => r.agentId === a.id)?.startedAt ?? null,
      };
    }),
  };
}

export async function getAgentDetail(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.view');
  const agent = await ctx.db.aiAgent.findFirst({ where: { id } });
  if (!agent) throw new NotFoundError('Agente não encontrado.');
  const [prompts, tasks, runs, memories, toolCalls] = await Promise.all([
    ctx.db.aiPromptVersion.findMany({ where: { agentId: id }, orderBy: { version: 'desc' } }),
    ctx.db.aiTask.findMany({ where: { agentId: id }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ctx.db.aiTaskRun.findMany({ where: { agentId: id }, orderBy: { startedAt: 'desc' }, take: 30 }),
    ctx.db.aiMemory.findMany({ where: { agentId: id }, orderBy: { updatedAt: 'desc' }, take: 50 }),
    ctx.db.aiToolCall.findMany({ where: { agentId: id }, orderBy: { createdAt: 'desc' }, take: 40 }),
  ]);
  return { agent, prompts, tasks, runs, memories, toolCalls, catalog: roleToolCatalog(agent.key), providers: providerStatus() };
}

export async function listAiTasks(ctx: ServiceCtx, f: { status?: string; agentId?: string; take?: number } = {}) {
  assertCan(ctx, 'ai_team.view');
  const statuses = ['QUEUED', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED'];
  return ctx.db.aiTask.findMany({
    where: { ...(f.status && statuses.includes(f.status) ? { status: f.status as never } : {}), ...(f.agentId ? { agentId: f.agentId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: f.take ?? 60,
    include: { agent: { select: { id: true, name: true, key: true } }, objective: { select: { id: true, title: true } } },
  });
}

export async function getAiTaskDetail(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.view');
  const task = await ctx.db.aiTask.findFirst({ where: { id }, include: { agent: true, objective: { select: { id: true, title: true } } } });
  if (!task) throw new NotFoundError('Tarefa não encontrada.');
  const [runs, toolCalls, approvals, activities, children, dispatches] = await Promise.all([
    ctx.db.aiTaskRun.findMany({ where: { taskId: id }, orderBy: { startedAt: 'desc' } }),
    ctx.db.aiToolCall.findMany({ where: { taskId: id }, orderBy: { createdAt: 'asc' } }),
    ctx.db.aiApproval.findMany({ where: { taskId: id }, orderBy: { createdAt: 'desc' } }),
    ctx.db.aiActivity.findMany({ where: { taskId: id }, orderBy: { createdAt: 'asc' }, take: 100 }),
    ctx.db.aiTask.findMany({ where: { parentTaskId: id }, orderBy: { createdAt: 'asc' }, include: { agent: { select: { name: true } } } }),
    ctx.db.n8nDispatch.findMany({ where: { taskId: id }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { task, runs, toolCalls, approvals, activities, children, dispatches };
}

export async function retryAiTask(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.command');
  const task = await ctx.db.aiTask.findFirst({ where: { id } });
  if (!task) throw new NotFoundError('Tarefa não encontrada.');
  if (task.status !== 'FAILED' && task.status !== 'CANCELLED') throw new AppError('Somente tarefas com falha ou canceladas podem ser reprocessadas.');
  if (task.objectiveId) {
    const obj = await ctx.db.aiObjective.findFirst({ where: { id: task.objectiveId }, select: { status: true } });
    if (obj?.status === 'CANCELLED') throw new AppError('O objetivo desta tarefa foi cancelado.');
  }
  await ctx.db.aiTask.update({ where: { id }, data: { status: 'QUEUED', attempts: 0, error: null, completedAt: null, nextRunAt: new Date(), waitingFor: null, blockedReason: null, lockedUntil: null } });
  if (task.objectiveId) {
    // Reabre o objetivo e descarta uma revisão já feita sem esta tarefa.
    await ctx.db.aiTask.deleteMany({ where: { objectiveId: task.objectiveId, kind: 'review', status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] } } });
    await ctx.db.aiObjective.updateMany({ where: { id: task.objectiveId, status: { in: ['COMPLETED', 'FAILED'] } }, data: { status: 'IN_PROGRESS', completedAt: null } });
    await syncObjective(ctx.orgId, task.objectiveId);
  }
  await logActivity({ orgId: ctx.orgId, agentId: task.agentId, objectiveId: task.objectiveId, taskId: id, type: 'task.retry', message: `Reprocessamento solicitado: "${task.title}".` });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.task_retried', entityType: 'AiTask', entityId: id });
}

export async function cancelAiTask(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'ai_team.command');
  const task = await ctx.db.aiTask.findFirst({ where: { id } });
  if (!task) throw new NotFoundError('Tarefa não encontrada.');
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status)) throw new AppError('Esta tarefa já foi encerrada.');
  const now = new Date();
  await ctx.db.aiTask.update({ where: { id }, data: { status: 'CANCELLED', completedAt: now, waitingFor: null, lockedUntil: null, error: 'Cancelada pela equipe.' } });
  await ctx.db.aiApproval.updateMany({ where: { taskId: id, status: 'PENDING' }, data: { status: 'REJECTED', decidedById: ctx.userId, decidedAt: now, decisionNote: 'Tarefa cancelada.' } });
  await ctx.db.aiToolCall.updateMany({ where: { taskId: id, status: { in: ['PENDING_APPROVAL', 'APPROVED'] } }, data: { status: 'REJECTED', error: 'Tarefa cancelada.' } });
  await ctx.db.n8nDispatch.updateMany({ where: { taskId: id, status: 'PENDING' }, data: { status: 'CANCELLED', lastError: 'Tarefa cancelada.' } });
  await releaseDependents(ctx.orgId, id, false);
  await logActivity({ orgId: ctx.orgId, agentId: task.agentId, objectiveId: task.objectiveId, taskId: id, type: 'task.cancelled', level: 'warning', message: `Tarefa cancelada: "${task.title}".` });
  if (task.objectiveId) await syncObjective(ctx.orgId, task.objectiveId);
}

/** Custos estimados: últimos 30 dias por dia, por agente e por modelo. */
export async function getCosts(ctx: ServiceCtx) {
  assertCan(ctx, 'ai_team.view');
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [runs, agents] = await Promise.all([
    ctx.db.aiTaskRun.findMany({ where: { startedAt: { gte: since } }, select: { agentId: true, provider: true, model: true, costMicroUsd: true, tokensIn: true, tokensOut: true, startedAt: true, status: true } }),
    ctx.db.aiAgent.findMany({ select: { id: true, name: true } }),
  ]);
  const byDay = new Map<string, number>();
  const byAgent = new Map<string, { micro: number; tokens: number; runs: number; failed: number }>();
  const byModel = new Map<string, { micro: number; tokens: number }>();
  for (const r of runs) {
    const day = r.startedAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + r.costMicroUsd);
    const a = byAgent.get(r.agentId) ?? { micro: 0, tokens: 0, runs: 0, failed: 0 };
    a.micro += r.costMicroUsd;
    a.tokens += r.tokensIn + r.tokensOut;
    a.runs += 1;
    if (r.status === 'FAILED') a.failed += 1;
    byAgent.set(r.agentId, a);
    if (r.model) {
      const key = `${r.provider ?? '?'} · ${r.model}`;
      const m = byModel.get(key) ?? { micro: 0, tokens: 0 };
      m.micro += r.costMicroUsd;
      m.tokens += r.tokensIn + r.tokensOut;
      byModel.set(key, m);
    }
  }
  return {
    days: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, micro]) => ({ day, micro })),
    agents: agents.map((a) => ({ id: a.id, name: a.name, ...(byAgent.get(a.id) ?? { micro: 0, tokens: 0, runs: 0, failed: 0 }) })),
    models: [...byModel.entries()].map(([model, v]) => ({ model, ...v })).sort((a, b) => b.micro - a.micro),
    totalMicro: runs.reduce((s, r) => s + r.costMicroUsd, 0),
  };
}

export async function listActivities(ctx: ServiceCtx, take = 100) {
  assertCan(ctx, 'ai_team.view');
  return ctx.db.aiActivity.findMany({ orderBy: { createdAt: 'desc' }, take });
}

export async function listDispatches(ctx: ServiceCtx, take = 50) {
  assertCan(ctx, 'ai_team.view');
  return ctx.db.n8nDispatch.findMany({ orderBy: { createdAt: 'desc' }, take, select: { id: true, workflow: true, status: true, attempts: true, maxAttempts: true, nextAttemptAt: true, lastError: true, responseStatus: true, taskId: true, createdAt: true, sentAt: true, completedAt: true } });
}
