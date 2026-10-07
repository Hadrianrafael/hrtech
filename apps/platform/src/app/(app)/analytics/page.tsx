import { Bot, Clock, MessageCircle, Sparkles, Target, Trophy, UserPlus, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarList, ColumnChart, Donut } from '@/components/ui/charts';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/misc';
import { PeriodFilter } from '@/components/shared/period-filter';
import { duration, fmtDate, pct } from '@/components/shared/format';
import { CHANNEL_COLORS, CHANNEL_LABELS, SOURCE_COLORS } from '@/components/shared/labels';
import { requirePageContext } from '@/lib/auth/context';
import { formatMoney } from '@/lib/utils';
import { getAnalytics, resolveRange } from '@/server/analytics';
import { SOURCE_LABELS } from '@/server/contacts';

export const metadata: Metadata = { title: 'Métricas' };

const APPT: Record<string, string> = { MEETING: 'Reuniões', CALL: 'Ligações', VISIT: 'Visitas', SERVICE: 'Atendimentos', FOLLOW_UP: 'Follow-ups', TASK: 'Tarefas', RETURN: 'Retornos' };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('analytics.view');
  const range = resolveRange(sp.period, sp.from, sp.to);
  const a = await getAnalytics(ctx, range);
  const apptTotals = Object.entries(
    a.appointments.reduce<Record<string, number>>((acc, x) => ({ ...acc, [x.type]: (acc[x.type] ?? 0) + x.count }), {}),
  ).map(([type, count]) => ({ label: APPT[type] ?? type, value: count }));
  const openStages = a.pipeline.filter((s) => s.kind === 'OPEN');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Métricas"
        description={`${fmtDate(range.start)} a ${fmtDate(range.end)} · métricas calculadas somente a partir de dados reais registrados na plataforma`}
        actions={<Suspense><PeriodFilter current={range.key} /></Suspense>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads no período" value={a.newLeads} icon={<UserPlus className="h-4 w-4" />} />
        <StatCard label="Vendas" value={a.won.count} hint={formatMoney(a.won.value)} icon={<Trophy className="h-4 w-4" />} tone="green" />
        <StatCard label="Perdidas" value={a.lost} hint={`Taxa de ganho: ${pct(a.winRate)}`} icon={<XCircle className="h-4 w-4" />} tone="red" />
        <StatCard label="Oportunidades abertas" value={a.openOpportunities.count} hint={formatMoney(a.openOpportunities.value)} icon={<Target className="h-4 w-4" />} tone="yellow" />
        <StatCard label="Conversão lead → cliente" value={pct(a.leadConversion)} icon={<Target className="h-4 w-4" />} tone="green" />
        <StatCard
          label="Tempo médio de resposta"
          value={duration(a.responseTime.overallSeconds)}
          hint={a.responseTime.samples ? `${a.responseTime.samples} mensagens analisadas` : 'Sem dados suficientes'}
          icon={<Clock className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard label="Conversas abertas" value={a.conversationsOpen} hint={`${a.conversationsWaiting} aguardando resposta`} icon={<MessageCircle className="h-4 w-4" />} tone="blue" />
        <StatCard label="Transferências para humano" value={a.ai.handoffs} icon={<Bot className="h-4 w-4" />} tone="gray" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Leads por período" />
          <div className="p-4"><ColumnChart data={a.leadsSeries.map((s) => ({ label: `${s.date.slice(8, 10)}/${s.date.slice(5, 7)}`, value: s.count }))} /></div>
        </Card>
        <Card>
          <CardHeader title="Leads por origem" />
          <div className="p-4"><BarList items={a.bySource.map((s, i) => ({ label: SOURCE_LABELS[s.key] ?? s.key, value: s.count, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }))} /></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pipeline comercial" description="Oportunidades abertas por etapa (valor)" />
          <div className="p-4">
            <BarList items={openStages.map((s) => ({ label: `${s.name} (${s.count})`, value: s.value, color: s.color }))} format={(n) => formatMoney(n)} empty="Sem oportunidades abertas." />
          </div>
        </Card>
        <Card>
          <CardHeader title="Conversas por canal" />
          <div className="p-4">
            <Donut items={a.byChannel.map((c) => ({ label: CHANNEL_LABELS[c.key] ?? c.key, value: c.count, color: CHANNEL_COLORS[c.key] ?? '#64748b' }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Desempenho por atendente/vendedor" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-fg-muted">
                <tr><th className="px-4 py-2 font-medium">Pessoa</th><th className="px-4 py-2 text-right font-medium">Mensagens enviadas</th><th className="px-4 py-2 text-right font-medium">Vendas</th><th className="px-4 py-2 text-right font-medium">Valor vendido</th></tr>
              </thead>
              <tbody className="divide-y">
                {a.agents.map((g) => (
                  <tr key={g.userId}>
                    <td className="px-4 py-2">{g.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{g.messages}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{g.won}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatMoney(g.wonValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Agendamentos no período" />
          <div className="p-4"><BarList items={apptTotals} /></div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Desempenho da IA" description="Somente chamadas reais registradas; sem credencial de IA configurada, estes números permanecem zerados." />
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={<Bot className="h-4 w-4" />} label="Chamadas de IA" value={a.ai.total} />
          <Metric icon={<MessageCircle className="h-4 w-4" />} label="Respostas automáticas" value={a.ai.autoReplies} />
          <Metric icon={<Sparkles className="h-4 w-4" />} label="Sugestões ao atendente" value={a.ai.suggestions} hint={`Aceitação: ${pct(a.ai.acceptanceRate)}`} />
          <Metric icon={<Clock className="h-4 w-4" />} label="Latência média" value={a.ai.avgLatencyMs !== null ? `${(a.ai.avgLatencyMs / 1000).toFixed(1).replace('.', ',')}s` : '—'} />
          <Metric icon={<XCircle className="h-4 w-4" />} label="Falhas" value={a.ai.failed} hint={`${a.ai.tokens.toLocaleString('pt-BR')} tokens`} />
        </div>
        {a.responseTime.bySender.length > 0 && (
          <p className="border-t px-4 py-2.5 text-xs text-fg-muted">
            Tempo médio até a 1ª resposta: {a.responseTime.bySender.map((r) => `${r.sender === 'AI' ? 'IA' : 'Equipe'} ${duration(r.seconds)} (${r.samples})`).join(' · ')}
          </p>
        )}
      </Card>
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">{icon} {label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-fg-muted">{hint}</p>}
    </div>
  );
}
