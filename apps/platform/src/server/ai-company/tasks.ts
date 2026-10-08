import type { AiTask, Prisma } from '@prisma/client';
import { tenantDb } from '@/lib/db';
import { AppError, LimitExceededError, NotFoundError } from '@/lib/errors';
import { logActivity } from './activity';
import { resolveLimits } from './policy';
import type { ToolRunContext } from './tools/types';

const FAR_FUTURE = new Date('2999-01-01T00:00:00Z');

export interface PlaybookStep {
  tool: string;
  args: Record<string, unknown>;
}

/** Entrada de uma tarefa: modo LLM (o agente decide) ou roteiro determinístico (playbook). */
export interface TaskInput {
  mode?: 'llm' | 'playbook' | 'review' | 'briefing';
  playbook?: string;
  params?: Record<string, unknown>;
  steps?: PlaybookStep[];
  command?: string;
  /** Dia do briefing (AAAA-MM-DD, fuso da empresa). */
  day?: string;
  /** Histórico de passos executados (persistido entre execuções; retomado após aprovação ou n8n). */
  history?: HistoryEntry[];
}

export interface HistoryEntry {
  kind: 'tool' | 'note' | 'error';
  tool?: string;
  args?: Record<string, unknown>;
  toolCallId?: string;
  status?: string;
  summary?: string;
  output?: unknown;
  text?: string;
  /** Índice do passo no roteiro (modo playbook). */
  step?: number;
  at: string;
}

export function readInput(task: Pick<AiTask, 'input'>): TaskInput {
  return (task.input && typeof task.input === 'object' ? task.input : {}) as TaskInput;
}

export interface NewTaskInput {
  orgId: string;
  agentId: string;
  title: string;
  instructions: string;
  kind?: 'plan' | 'work' | 'review' | 'briefing';
  objectiveId?: string | null;
  parentTaskId?: string | null;
  depth?: number;
  priority?: number;
  input?: TaskInput;
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
  /** Dependência: a tarefa só entra na fila quando a tarefa indicada terminar. */
  dependsOnTaskId?: string | null;
}

/** Cria tarefa aplicando os limites contra loops (por objetivo e por agente/dia). */
export async function createAiTask(t: NewTaskInput): Promise<AiTask> {
  const db = tenantDb(t.orgId);
  const [company, agent] = await Promise.all([db.aiCompany.findFirst({}), db.aiAgent.findFirst({ where: { id: t.agentId } })]);
  if (!company || !agent) throw new NotFoundError('Agente não encontrado.');
  const limits = resolveLimits(company.limits, agent.limits);
  if (t.objectiveId) {
    const count = await db.aiTask.count({ where: { objectiveId: t.objectiveId } });
    if (count >= limits.maxTasksPerObjective) {
      throw new LimitExceededError(`Limite de ${limits.maxTasksPerObjective} tarefas por objetivo atingido (proteção contra loops).`);
    }
  }
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const today = await db.aiTask.count({ where: { agentId: agent.id, createdAt: { gte: dayStart } } });
  if (today >= limits.maxTasksPerAgentPerDay) {
    throw new LimitExceededError(`O agente ${agent.name} atingiu o limite de ${limits.maxTasksPerAgentPerDay} tarefas por dia.`);
  }
  let waitingFor: string | null = null;
  if (t.dependsOnTaskId) {
    const dep = await db.aiTask.findFirst({ where: { id: t.dependsOnTaskId }, select: { status: true } });
    if (dep && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(dep.status)) waitingFor = `task:${t.dependsOnTaskId}`;
  }
  const task = await db.aiTask.create({
    data: {
      organizationId: t.orgId,
      agentId: agent.id,
      title: t.title.slice(0, 200),
      instructions: t.instructions.slice(0, 8000),
      kind: t.kind ?? 'work',
      objectiveId: t.objectiveId ?? null,
      parentTaskId: t.parentTaskId ?? null,
      depth: t.depth ?? 0,
      priority: Math.min(Math.max(t.priority ?? 5, 1), 9),
      input: (t.input ?? {}) as Prisma.InputJsonValue,
      maxAttempts: limits.maxAttempts,
      createdByUserId: t.createdByUserId ?? null,
      createdByAgentId: t.createdByAgentId ?? null,
      waitingFor,
      nextRunAt: waitingFor ? FAR_FUTURE : new Date(),
    },
  });
  await logActivity({
    orgId: t.orgId,
    agentId: agent.id,
    objectiveId: task.objectiveId,
    taskId: task.id,
    type: 'task.created',
    message: `${agent.name}: nova tarefa "${task.title}"${waitingFor ? ' (aguardando a etapa anterior)' : ''}.`,
  });
  return task;
}

/** Delegação (ferramenta agents.delegate): cria subtarefa para outro agente, com limites de profundidade e quantidade. */
export async function delegateTask(
  tc: Pick<ToolRunContext, 'orgId' | 'agent' | 'task' | 'company'>,
  args: { agentKey: string; title: string; instructions: string; priority?: number; afterPrevious?: boolean; input?: TaskInput },
): Promise<AiTask> {
  const db = tenantDb(tc.orgId);
  const limits = resolveLimits(tc.company.limits, tc.agent.limits);
  const depth = tc.task.depth + 1;
  if (depth > limits.maxDelegationDepth) throw new AppError(`Profundidade máxima de delegação (${limits.maxDelegationDepth}) atingida.`);
  if (args.agentKey === tc.agent.key) throw new AppError('Um agente não pode delegar tarefas para si mesmo.');
  const target = await db.aiAgent.findFirst({ where: { key: args.agentKey } });
  if (!target || target.status === 'DISABLED') throw new AppError(`Agente "${args.agentKey}" não está disponível.`);
  if (target.isCeo) throw new AppError('Tarefas não podem ser delegadas ao CEO Agent.');
  // Mesma delegação repetida (ex.: execução retomada depois de interrupção): reaproveita a subtarefa existente.
  const same = await db.aiTask.findFirst({ where: { parentTaskId: tc.task.id, agentId: target.id, title: args.title.slice(0, 200), status: { notIn: ['FAILED', 'CANCELLED'] } } });
  if (same) return same;
  const siblings = await db.aiTask.count({ where: { parentTaskId: tc.task.id } });
  if (siblings >= limits.maxSubtasksPerTask) throw new LimitExceededError(`Limite de ${limits.maxSubtasksPerTask} subtarefas por tarefa atingido.`);
  let dependsOnTaskId: string | null = null;
  if (args.afterPrevious) {
    const prev = await db.aiTask.findFirst({ where: { parentTaskId: tc.task.id }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    dependsOnTaskId = prev?.id ?? null;
  }
  const child = await createAiTask({
    orgId: tc.orgId,
    agentId: target.id,
    title: args.title,
    instructions: args.instructions,
    kind: 'work',
    objectiveId: tc.task.objectiveId,
    parentTaskId: tc.task.id,
    depth,
    priority: args.priority,
    input: args.input ?? { mode: 'llm' },
    createdByAgentId: tc.agent.id,
    dependsOnTaskId,
  });
  await logActivity({
    orgId: tc.orgId,
    agentId: tc.agent.id,
    objectiveId: tc.task.objectiveId,
    taskId: child.id,
    type: 'task.delegated',
    message: `${tc.agent.name} delegou "${child.title}" para ${target.name}.`,
  });
  return child;
}

/** Libera (ou cancela, em cadeia) tarefas que dependiam de uma tarefa recém-finalizada. */
export async function releaseDependents(orgId: string, taskId: string, ok: boolean, depth = 0): Promise<void> {
  const db = tenantDb(orgId);
  if (ok) {
    await db.aiTask.updateMany({ where: { waitingFor: `task:${taskId}`, status: 'QUEUED' }, data: { waitingFor: null, nextRunAt: new Date() } });
    return;
  }
  const dependents = await db.aiTask.findMany({ where: { waitingFor: `task:${taskId}`, status: 'QUEUED' }, select: { id: true } });
  if (!dependents.length) return;
  await db.aiTask.updateMany({
    where: { id: { in: dependents.map((d) => d.id) } },
    data: { status: 'CANCELLED', waitingFor: null, error: 'Cancelada porque a etapa anterior não foi concluída.', completedAt: new Date() },
  });
  if (depth < 10) for (const d of dependents) await releaseDependents(orgId, d.id, false, depth + 1);
}
