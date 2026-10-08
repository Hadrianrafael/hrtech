import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentDetailView, type AgentDetailData, type AgentLimitsInput } from '@/components/ai-team/agent-config';
import { requirePageContext } from '@/lib/auth/context';
import { env } from '@/lib/env';
import { NotFoundError } from '@/lib/errors';
import { isProviderName } from '@/server/ai/provider';
import { MEMORY_KINDS } from '@/server/ai-company/memory';
import { resolveLimits } from '@/server/ai-company/policy';
import { getAgentDetail } from '@/server/ai-company/queries';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Agente — Equipe IA' };

const ACTIVE_TASK = new Set(['QUEUED', 'RUNNING']);

/** Lê um limite numérico do JSON do agente (valores inválidos = herdar da empresa). */
function limitValue(raw: Record<string, unknown>, key: keyof AgentLimitsInput): number | null {
  const v = raw[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageContext('ai_team.view');
  const { id } = await params;
  let detail;
  try {
    detail = await getAgentDetail(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const objectiveIds = [...new Set(detail.tasks.map((t) => t.objectiveId).filter((x): x is string => !!x))];
  const [company, members, objectives] = await Promise.all([
    ctx.db.aiCompany.findFirst({ select: { limits: true, dailyBudgetCents: true } }),
    getMembers(ctx),
    objectiveIds.length ? ctx.db.aiObjective.findMany({ where: { id: { in: objectiveIds } }, select: { id: true, title: true } }) : Promise.resolve([]),
  ]);
  const objectiveTitles = new Map(objectives.map((o) => [o.id, o.title]));
  const { agent } = detail;
  const companyLimits = resolveLimits(company?.limits ?? {});
  const rawLimits = agent.limits && typeof agent.limits === 'object' && !Array.isArray(agent.limits) ? (agent.limits as Record<string, unknown>) : {};
  const memberNames = new Map(members.map((m) => [m.id, m.name]));
  const defaultProvider = env.aiProvider();

  // Versões de prompt: as 20 mais recentes, garantindo a versão ativa na lista.
  const recentPrompts = detail.prompts.slice(0, 20);
  const activePrompt = detail.prompts.find((p) => p.id === agent.currentPromptId);
  if (activePrompt && !recentPrompts.includes(activePrompt)) recentPrompts.push(activePrompt);

  const data: AgentDetailData = {
    agent: {
      id: agent.id,
      key: agent.key,
      name: agent.name,
      title: agent.title,
      department: agent.department,
      description: agent.description,
      isCeo: agent.isCeo,
      status: agent.status,
      autonomy: agent.autonomy,
      provider: agent.provider,
      model: agent.model,
      tools: agent.tools,
      limits: {
        maxStepsPerRun: limitValue(rawLimits, 'maxStepsPerRun'),
        maxTokensPerTask: limitValue(rawLimits, 'maxTokensPerTask'),
        dailyBudgetCents: limitValue(rawLimits, 'dailyBudgetCents'),
        maxTasksPerAgentPerDay: limitValue(rawLimits, 'maxTasksPerAgentPerDay'),
      },
      currentPromptId: agent.currentPromptId,
      updatedAt: agent.updatedAt.toISOString(),
    },
    catalog: detail.catalog.map((t) => ({ key: t.key, label: t.label, description: t.description, risk: t.risk, categories: [...t.categories] })),
    providers: detail.providers.map((p) => ({ name: p.name, label: p.label, configured: p.configured, defaultModel: p.defaultModel, models: [...p.models] })),
    defaultProvider: isProviderName(defaultProvider) ? defaultProvider : null,
    inherited: {
      maxStepsPerRun: companyLimits.maxStepsPerRun,
      maxTokensPerTask: companyLimits.maxTokensPerTask,
      maxTasksPerAgentPerDay: companyLimits.maxTasksPerAgentPerDay,
      companyDailyBudgetCents: company?.dailyBudgetCents ?? 0,
    },
    prompts: recentPrompts.map((p) => ({
      id: p.id,
      version: p.version,
      notes: p.notes,
      systemPrompt: p.systemPrompt,
      createdAt: p.createdAt.toISOString(),
      createdByName: p.createdById ? (memberNames.get(p.createdById) ?? null) : null,
    })),
    history: {
      tasks: detail.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        kind: t.kind,
        status: t.status,
        error: t.error ? t.error.slice(0, 300) : null,
        costMicroUsd: t.costMicroUsd,
        objectiveTitle: t.objectiveId ? (objectiveTitles.get(t.objectiveId)?.slice(0, 120) ?? null) : null,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
      runs: detail.runs.map((r) => ({
        id: r.id,
        taskId: r.taskId,
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
        error: r.error ? r.error.slice(0, 300) : null,
        startedAt: r.startedAt.toISOString(),
      })),
      toolCalls: detail.toolCalls.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        tool: c.tool,
        risk: c.risk,
        status: c.status,
        error: c.error ? c.error.slice(0, 300) : null,
        suspicious: c.suspicious,
        createdAt: c.createdAt.toISOString(),
      })),
      memories: detail.memories.map((m) => ({
        id: m.id,
        kind: m.kind,
        title: m.title,
        content: m.content.slice(0, 600),
        source: m.source,
        importance: m.importance,
        pinned: m.pinned,
        updatedAt: m.updatedAt.toISOString(),
      })),
      memoryKinds: { ...MEMORY_KINDS },
    },
    working: detail.tasks.some((t) => ACTIVE_TASK.has(t.status)) || detail.runs.some((r) => r.status === 'RUNNING'),
  };

  return <AgentDetailView data={data} canManage={ctx.permissions.has('ai_team.manage')} />;
}
