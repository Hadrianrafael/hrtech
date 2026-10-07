import type { Metadata } from 'next';
import { CostsView, type CostsViewData } from '@/components/ai-team/costs-view';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { getCosts, getTeamOverview } from '@/server/ai-company/queries';

export const metadata: Metadata = { title: 'Custos da Equipe IA' };

const DAY_MS = 86_400_000;
/** getCosts considera os últimos 30 dias a partir de agora: o gráfico cobre do dia inicial (parcial) até hoje. */
const WINDOW_DAYS = 30;
const MAX_MODELS = 30;

/** Centavos de dólar → micro-dólares (unidade usada nos custos das execuções). */
const centsToMicro = (cents: number) => Math.max(0, cents) * 10_000;

export default async function AiCostsPage() {
  const ctx = await requirePageContext('ai_team.view');
  const [costs, overview] = await Promise.all([getCosts(ctx), getTeamOverview(ctx)]);

  const microByDay = new Map(costs.days.map((d) => [d.day, d.micro]));
  const now = Date.now();
  const days: CostsViewData['days'] = [];
  for (let i = WINDOW_DAYS; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    days.push({ day, micro: microByDay.get(day) ?? 0 });
  }

  const data: CostsViewData = {
    activated: !!overview,
    enabled: overview?.company.enabled ?? false,
    today: {
      micro: overview?.cost.todayMicro ?? 0,
      budgetMicro: overview ? centsToMicro(overview.company.dailyBudgetCents) : null,
    },
    month: {
      micro: overview?.cost.monthMicro ?? 0,
      budgetMicro: overview ? centsToMicro(overview.company.monthlyBudgetCents) : null,
    },
    totalMicro: costs.totalMicro,
    days,
    agents: costs.agents
      .map((a) => ({ id: a.id, name: a.name, micro: a.micro, tokens: a.tokens, runs: a.runs, failed: a.failed }))
      .sort((a, b) => b.micro - a.micro || b.runs - a.runs),
    models: costs.models.slice(0, MAX_MODELS).map((m) => ({ model: m.model, micro: m.micro, tokens: m.tokens })),
  };

  return (
    <div>
      <PageHeader title="Custos" description="Quanto a Equipe IA está consumindo por dia, por agente e por modelo, comparado aos orçamentos definidos." />
      <CostsView data={data} canManage={ctx.permissions.has('ai_team.manage')} />
    </div>
  );
}
