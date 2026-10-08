import type { Metadata } from 'next';
import { TASK_FILTERS } from '@/components/ai-team/task-helpers';
import { AiTaskList, type TaskListRow } from '@/components/ai-team/task-list';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listAiTasks } from '@/server/ai-company/queries';

export const metadata: Metadata = { title: 'Tarefas da Equipe IA' };

const LIMIT = 100;

export default async function AiTasksPage({ searchParams }: { searchParams: Promise<{ status?: string; agent?: string }> }) {
  const ctx = await requirePageContext('ai_team.view');
  const sp = await searchParams;
  const status = TASK_FILTERS.some((f) => f.key && f.key === sp.status) ? sp.status! : '';
  const agents = await ctx.db.aiAgent.findMany({ orderBy: [{ isCeo: 'desc' }, { createdAt: 'asc' }], select: { id: true, name: true } });
  const agent = sp.agent && agents.some((a) => a.id === sp.agent) ? sp.agent : null;
  const tasks = await listAiTasks(ctx, { status: status || undefined, agentId: agent ?? undefined, take: LIMIT });

  const rows: TaskListRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind,
    status: t.status,
    agentName: t.agent.name,
    attempts: t.attempts,
    maxAttempts: t.maxAttempts,
    costMicroUsd: t.costMicroUsd,
    objective: t.objective ? { id: t.objective.id, title: t.objective.title } : null,
    waitingFor: t.waitingFor,
    blockedReason: t.blockedReason,
    error: t.error ? t.error.slice(0, 300) : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader title="Tarefas da Equipe IA" description="Tudo o que o CEO Agent planejou e delegou, com status, tentativas e custo de cada etapa." />
      <AiTaskList tasks={rows} status={status} agent={agent} agents={agents} limit={LIMIT} />
    </div>
  );
}
