import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ActivityItem } from '@/components/ai-team/task-activity';
import { jsonPreview, jsonRecord, jsonString, jsonStringArray } from '@/components/ai-team/task-helpers';
import { TaskView, type TaskHistoryStep, type TaskViewProps } from '@/components/ai-team/task-view';
import { requirePageContext } from '@/lib/auth/context';
import { NotFoundError } from '@/lib/errors';
import { SENSITIVE_CATEGORIES, type SensitiveCategory } from '@/server/ai-company/constants';
import { N8N_WORKFLOWS, type N8nWorkflow } from '@/server/ai-company/n8n';
import { getAiTaskDetail } from '@/server/ai-company/queries';

export const metadata: Metadata = { title: 'Tarefa da Equipe IA' };

const MAX_HISTORY = 60;
/** Tarefas que aguardam outra etapa ficam com nextRunAt no futuro distante: não é uma "próxima tentativa" real. */
const FAR_FUTURE_YEAR = 2900;

function validIso(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** input.history (JSON do Prisma) → passos seguros para exibição: textos limitados e JSON pré-formatado. */
function readHistory(input: unknown): { steps: TaskHistoryStep[]; total: number } {
  const raw = jsonRecord(input).history;
  const list = Array.isArray(raw) ? raw : [];
  const steps = list.slice(-MAX_HISTORY).map((entry): TaskHistoryStep => {
    const e = jsonRecord(entry);
    const kind = e.kind === 'tool' || e.kind === 'error' || e.kind === 'note' ? e.kind : 'note';
    const args = jsonRecord(e.args);
    return {
      kind,
      tool: jsonString(e.tool, 80),
      status: jsonString(e.status, 40),
      summary: jsonString(e.summary, 1500) ?? jsonString(e.text, 1500),
      at: validIso(e.at),
      args: Object.keys(args).length ? jsonPreview(args, 1500) : null,
      output: jsonPreview(e.output, 3000),
    };
  });
  return { steps, total: list.length };
}

export default async function AiTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageContext('ai_team.view');
  const { id } = await params;
  let data;
  try {
    data = await getAiTaskDetail(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const { task, runs, toolCalls, approvals, activities, children, dispatches } = data;
  const input = jsonRecord(task.input);
  const resultData = jsonRecord(task.resultData);
  const history = readHistory(task.input);
  const nextRunAt = task.nextRunAt.getFullYear() < FAR_FUTURE_YEAR ? task.nextRunAt.toISOString() : null;

  const view: TaskViewProps['task'] = {
    id: task.id,
    title: task.title,
    kind: task.kind,
    status: task.status,
    mode: jsonString(input.mode, 20),
    priority: task.priority,
    depth: task.depth,
    attempts: task.attempts,
    maxAttempts: task.maxAttempts,
    steps: task.steps,
    tokensIn: task.tokensIn,
    tokensOut: task.tokensOut,
    costMicroUsd: task.costMicroUsd,
    instructions: task.instructions,
    result: task.result,
    error: task.error,
    highlights: jsonStringArray(resultData.highlights, 15, 500),
    nextSteps: jsonStringArray(resultData.nextSteps, 15, 500),
    waitingFor: task.waitingFor,
    blockedReason: task.blockedReason,
    nextRunAt,
    parentTaskId: task.parentTaskId,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    agent: { id: task.agent.id, name: task.agent.name, title: task.agent.title },
    objective: task.objective ? { id: task.objective.id, title: task.objective.title } : null,
  };

  const activityRows: ActivityItem[] = activities.map((a) => ({
    id: a.id,
    message: a.message,
    level: a.level,
    createdAt: a.createdAt.toISOString(),
    agentName: a.agentId === task.agentId ? task.agent.name : null,
    href: null,
  }));

  return (
    <TaskView
      task={view}
      history={history.steps}
      historyTotal={history.total}
      runs={runs.slice(0, 20).map((r) => ({
        id: r.id,
        attempt: r.attempt,
        status: r.status,
        mode: r.mode,
        provider: r.provider,
        model: r.model,
        steps: r.steps,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        costMicroUsd: r.costMicroUsd,
        latencyMs: r.latencyMs,
        error: r.error ? r.error.slice(0, 1000) : null,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
      }))}
      toolCalls={toolCalls.slice(-60).map((c) => ({
        id: c.id,
        tool: c.tool,
        risk: c.risk,
        status: c.status,
        suspicious: c.suspicious,
        error: c.error ? c.error.slice(0, 600) : null,
        createdAt: c.createdAt.toISOString(),
      }))}
      approvals={approvals.slice(0, 20).map((a) => ({
        id: a.id,
        summary: a.summary,
        reason: a.reason,
        status: a.status,
        risk: a.risk,
        categories: a.categories.map((c) => SENSITIVE_CATEGORIES[c as SensitiveCategory] ?? c),
        decisionNote: a.decisionNote,
        createdAt: a.createdAt.toISOString(),
        expiresAt: a.expiresAt.toISOString(),
        decidedAt: a.decidedAt?.toISOString() ?? null,
      }))}
      dispatches={dispatches.slice(0, 20).map((d) => ({
        id: d.id,
        workflow: N8N_WORKFLOWS[d.workflow as N8nWorkflow]?.label ?? d.workflow,
        status: d.status,
        attempts: d.attempts,
        maxAttempts: d.maxAttempts,
        lastError: d.lastError ? d.lastError.slice(0, 600) : null,
        responseStatus: d.responseStatus,
        nextAttemptAt: d.nextAttemptAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
        completedAt: d.completedAt?.toISOString() ?? null,
      }))}
      childTasks={children.map((c) => ({ id: c.id, title: c.title, kind: c.kind, status: c.status, agentName: c.agent.name }))}
      activities={activityRows}
      canCommand={ctx.permissions.has('ai_team.command')}
      canApprove={ctx.permissions.has('ai_team.approve')}
    />
  );
}
