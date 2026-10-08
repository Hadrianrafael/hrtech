import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ObjectiveView, type ObjectiveApprovalRow, type ObjectivePlanView, type ObjectiveTaskNode } from '@/components/ai-team/objective-view';
import type { ActivityItem } from '@/components/ai-team/task-activity';
import { jsonRecord, jsonString, jsonStringArray } from '@/components/ai-team/task-helpers';
import { requirePageContext } from '@/lib/auth/context';
import { NotFoundError } from '@/lib/errors';
import { agentDefinition, SENSITIVE_CATEGORIES, type SensitiveCategory } from '@/server/ai-company/constants';
import { getObjective } from '@/server/ai-company/objectives';
import { PLAYBOOK_LABELS, type PlaybookKey } from '@/server/ai-company/playbooks';

export const metadata: Metadata = { title: 'Objetivo da Equipe IA' };

const PARAM_LABELS: Record<string, string> = {
  quantity: 'Quantidade',
  segment: 'Segmento',
  city: 'Cidade',
  state: 'UF',
  target: 'Meta',
  period: 'Período',
};

function readPlan(raw: unknown, playbook: string | null, agentName: (key: string) => string): ObjectivePlanView {
  const p = jsonRecord(raw);
  const key = jsonString(p.playbook, 40) ?? playbook;
  const params = Object.entries(jsonRecord(p.params))
    .filter(([, v]) => (typeof v === 'string' && v.trim()) || typeof v === 'number')
    .slice(0, 10)
    .map(([k, v]) => ({ label: PARAM_LABELS[k] ?? k, value: String(v).slice(0, 120) }));
  const delegations = (Array.isArray(p.delegations) ? p.delegations : [])
    .slice(0, 20)
    .map((d) => jsonRecord(d))
    .map((d) => ({ agent: agentName(jsonString(d.agent, 40) ?? '—'), title: jsonString(d.title, 300) ?? '' }))
    .filter((d) => d.title);
  return {
    label: jsonString(p.label, 80) ?? (key ? (PLAYBOOK_LABELS[key as PlaybookKey] ?? null) : null),
    mode: jsonString(p.mode, 20),
    params,
    notes: jsonStringArray(p.notes, 20, 600),
    delegations,
    summary: jsonString(p.summary, 8000),
  };
}

export default async function ObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageContext('ai_team.view');
  const { id } = await params;
  let data;
  try {
    data = await getObjective(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const { objective, activities, approvals, toolCalls } = data;

  const namesById = new Map(objective.tasks.map((t) => [t.agent.id, t.agent.name]));
  const namesByKey = new Map(objective.tasks.map((t) => [t.agent.key, t.agent.name]));
  const agentName = (key: string) => namesByKey.get(key) ?? agentDefinition(key)?.name ?? key;

  const callStats = new Map<string, { total: number; suspicious: number }>();
  for (const c of toolCalls) {
    const s = callStats.get(c.taskId) ?? { total: 0, suspicious: 0 };
    s.total += 1;
    if (c.suspicious) s.suspicious += 1;
    callStats.set(c.taskId, s);
  }

  const tasks: ObjectiveTaskNode[] = objective.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind,
    status: t.status,
    agentName: t.agent.name,
    parentTaskId: t.parentTaskId,
    waitingFor: t.waitingFor,
    blockedReason: t.blockedReason,
    error: t.error ? t.error.slice(0, 500) : null,
    attempts: t.attempts,
    maxAttempts: t.maxAttempts,
    costMicroUsd: t.costMicroUsd,
    toolCalls: callStats.get(t.id)?.total ?? 0,
    suspicious: callStats.get(t.id)?.suspicious ?? 0,
    createdAt: t.createdAt.toISOString(),
  }));

  const approvalRows: ObjectiveApprovalRow[] = approvals.slice(0, 30).map((a) => ({
    id: a.id,
    taskId: a.taskId,
    summary: a.summary,
    status: a.status,
    risk: a.risk,
    tool: a.tool,
    agentName: namesById.get(a.agentId) ?? '—',
    categories: a.categories.map((c) => SENSITIVE_CATEGORIES[c as SensitiveCategory] ?? c),
    decisionNote: a.decisionNote,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt.toISOString(),
  }));

  // Linha do tempo: as 150 atividades mais recentes, em ordem cronológica.
  const activityRows: ActivityItem[] = activities.slice(-150).map((a) => ({
    id: a.id,
    message: a.message,
    level: a.level,
    createdAt: a.createdAt.toISOString(),
    agentName: a.agentId ? (namesById.get(a.agentId) ?? null) : null,
    href: a.taskId ? `/ai-team/tasks/${a.taskId}` : null,
  }));

  return (
    <ObjectiveView
      objective={{
        id: objective.id,
        title: objective.title,
        command: objective.command,
        status: objective.status,
        source: objective.source,
        result: objective.result,
        costMicroUsd: objective.costMicroUsd,
        createdAt: objective.createdAt.toISOString(),
        completedAt: objective.completedAt?.toISOString() ?? null,
      }}
      plan={readPlan(objective.plan, objective.playbook, agentName)}
      tasks={tasks}
      approvals={approvalRows}
      activities={activityRows}
      canCommand={ctx.permissions.has('ai_team.command')}
      canApprove={ctx.permissions.has('ai_team.approve')}
    />
  );
}
