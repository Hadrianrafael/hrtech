import { Bot, Settings } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TeamIntro, TeamOverview, type OverviewData } from '@/components/ai-team/team-overview';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { env } from '@/lib/env';
import { isProviderName } from '@/server/ai/provider';
import { AGENT_DEFINITIONS } from '@/server/ai-company/constants';
import { getTeamOverview } from '@/server/ai-company/queries';

export const metadata: Metadata = { title: 'Equipe IA' };

export default async function AiTeamPage() {
  const ctx = await requirePageContext('ai_team.view');
  const overview = await getTeamOverview(ctx);
  const can = {
    command: ctx.permissions.has('ai_team.command'),
    approve: ctx.permissions.has('ai_team.approve'),
    manage: ctx.permissions.has('ai_team.manage'),
  };

  if (!overview || !overview.company.enabled) {
    return (
      <div>
        <PageHeader title="Equipe IA" description="Sua empresa de agentes de IA, integrada ao CRM, às conversas e à agenda — sob o seu comando." />
        <TeamIntro
          exists={!!overview}
          canManage={can.manage}
          agents={AGENT_DEFINITIONS.map((a) => ({ key: a.key, name: a.name, title: a.title, description: a.description, isCeo: a.isCeo }))}
        />
      </div>
    );
  }

  const { company } = overview;
  const agentNames = new Map(overview.agents.map((a) => [a.id, a.name]));
  const defaultProvider = env.aiProvider();

  const data: OverviewData = {
    paused: company.paused,
    pausedReason: company.pausedReason,
    n8nEnabled: company.n8nEnabled,
    cost: {
      todayMicro: overview.cost.todayMicro,
      monthMicro: overview.cost.monthMicro,
      dailyBudgetMicro: company.dailyBudgetCents * 10_000,
      monthlyBudgetMicro: company.monthlyBudgetCents * 10_000,
    },
    pendingApprovals: overview.pendingApprovals,
    providers: overview.providers.map((p) => ({ name: p.name, label: p.label, envKey: p.envKey, configured: p.configured, defaultModel: p.defaultModel })),
    defaultProvider: isProviderName(defaultProvider) ? defaultProvider : null,
    n8n: { configured: overview.n8n.configured, missing: overview.n8n.missing },
    briefing: { enabled: overview.briefing.enabled, hour: overview.briefing.hour },
    agents: overview.agents.map((a) => ({
      id: a.id,
      name: a.name,
      title: a.title,
      department: a.department,
      isCeo: a.isCeo,
      status: a.status,
      autonomy: a.autonomy,
      provider: a.provider,
      model: a.model,
      toolsCount: a.tools.length,
      active: a.active,
      waitingApproval: a.tasks.WAITING_APPROVAL ?? 0,
      completed7d: a.completed7d,
      monthCostMicro: a.monthCostMicro,
      monthTokens: a.monthTokens,
      monthRuns: a.monthRuns,
      errors7d: a.errors7d,
      lastRunAt: a.lastRunAt?.toISOString() ?? null,
    })),
    activities: overview.activities.slice(0, 25).map((x) => ({
      id: x.id,
      message: x.message.slice(0, 500),
      level: x.level,
      agentName: x.agentId ? (agentNames.get(x.agentId) ?? null) : null,
      taskId: x.taskId,
      createdAt: x.createdAt.toISOString(),
    })),
  };

  return (
    <div>
      <PageHeader
        title="Equipe IA"
        description="Você → CEO Agent → agentes especializados → ferramentas/n8n → SaaS. Acompanhe status, consumo, erros e resultados de cada agente."
        actions={
          <>
            {can.command && (
              <Link href="/ai-team/ceo" className={buttonClass('primary')}>
                <Bot className="h-4 w-4" /> Central do CEO
              </Link>
            )}
            {can.manage && (
              <Link href="/ai-team/settings" className={buttonClass('outline')}>
                <Settings className="h-4 w-4" /> Configurações
              </Link>
            )}
          </>
        }
      />
      <TeamOverview data={data} can={can} />
    </div>
  );
}
