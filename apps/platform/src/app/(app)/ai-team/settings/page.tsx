import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { N8nHelp, QueuePanel, SettingsForm, type SettingsData } from '@/components/ai-team/settings-form';
import { PauseControl } from '@/components/ai-team/team-overview';
import { buttonClass } from '@/components/ui/button';
import { Card, EmptyState, PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { env } from '@/lib/env';
import { safeTimeZone } from '@/lib/utils';
import { N8N_DISPATCHER_PATH, N8N_WORKFLOWS } from '@/server/ai-company/n8n';
import { getTeamOverview, listDispatches } from '@/server/ai-company/queries';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Configurações — Equipe IA' };

/** Lê os caminhos de webhook salvos (JSON livre no banco → somente strings dos fluxos conhecidos). */
function readWorkflowPaths(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const key of Object.keys(N8N_WORKFLOWS)) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === 'string') out[key] = v;
  }
  return out;
}

export default async function AiTeamSettingsPage() {
  const ctx = await requirePageContext('ai_team.manage');
  const overview = await getTeamOverview(ctx);

  if (!overview) {
    return (
      <div>
        <PageHeader title="Configurações da Equipe IA" />
        <Card>
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="A Equipe IA ainda não foi ativada"
            description="Ative a Equipe IA para configurar orçamento, limites, briefing diário e a integração com o n8n."
            action={
              <Link href="/ai-team" className={buttonClass('primary')}>
                Ir para a Equipe IA
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const [dispatches, members] = await Promise.all([listDispatches(ctx, 30), getMembers(ctx)]);
  const { company, limits, briefing, n8n } = overview;
  const rawLimits = company.limits && typeof company.limits === 'object' && !Array.isArray(company.limits) ? (company.limits as Record<string, unknown>) : {};
  const workflows = (Object.keys(N8N_WORKFLOWS) as (keyof typeof N8N_WORKFLOWS)[]).map((key) => ({ key, label: N8N_WORKFLOWS[key].label, path: N8N_WORKFLOWS[key].path }));

  const data: SettingsData = {
    enabled: company.enabled,
    dailyBudgetCents: company.dailyBudgetCents,
    monthlyBudgetCents: company.monthlyBudgetCents,
    limits: {
      maxStepsPerRun: limits.maxStepsPerRun,
      maxTokensPerTask: limits.maxTokensPerTask,
      maxDelegationDepth: limits.maxDelegationDepth,
      maxTasksPerObjective: limits.maxTasksPerObjective,
      maxSubtasksPerTask: limits.maxSubtasksPerTask,
      maxAttempts: limits.maxAttempts,
      approvalTtlHours: limits.approvalTtlHours,
      allowAutonomousExternal: rawLimits.allowAutonomousExternal === true,
    },
    briefing: { enabled: briefing.enabled, hour: briefing.hour, weekdays: [...briefing.weekdays], recipients: [...briefing.recipients], deliverViaN8n: briefing.deliverViaN8n },
    n8nEnabled: company.n8nEnabled,
    canEnableN8n: ctx.org.isPlatformOwner || ctx.user.isPlatformAdmin,
    n8nWorkflows: readWorkflowPaths(company.n8nWorkflows),
    workflows,
    dispatcherPath: N8N_DISPATCHER_PATH,
    n8n: { configured: n8n.configured, missing: n8n.missing, dispatcherUrl: n8n.dispatcherUrl },
    callbackUrl: `${env.appUrl()}/api/webhooks/n8n`,
    timezone: safeTimeZone(ctx.org.timezone),
    members: members.map((m) => ({ id: m.id, name: m.name, email: m.email })),
  };

  const soon = Date.now() + 60_000;
  const refreshActive = dispatches.some((d) => d.status === 'SENDING' || d.status === 'SENT' || (d.status === 'PENDING' && d.nextAttemptAt.getTime() <= soon));

  return (
    <div className="space-y-4">
      <PageHeader title="Configurações da Equipe IA" description="Orçamento, limites de segurança, briefing diário do CEO e integração com o n8n." />
      <PauseControl paused={company.paused} pausedReason={company.pausedReason} canManage />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SettingsForm data={data} />
        <div className="space-y-4">
          <QueuePanel
            refreshActive={refreshActive}
            workflowLabels={Object.fromEntries(workflows.map((w) => [w.key, w.label]))}
            dispatches={dispatches.map((d) => ({
              id: d.id,
              workflow: d.workflow,
              status: d.status,
              attempts: d.attempts,
              maxAttempts: d.maxAttempts,
              nextAttemptAt: d.nextAttemptAt.toISOString(),
              lastError: d.lastError ? d.lastError.slice(0, 400) : null,
              responseStatus: d.responseStatus,
              taskId: d.taskId,
              createdAt: d.createdAt.toISOString(),
              sentAt: d.sentAt?.toISOString() ?? null,
              completedAt: d.completedAt?.toISOString() ?? null,
            }))}
          />
          <N8nHelp />
        </div>
      </div>
    </div>
  );
}
