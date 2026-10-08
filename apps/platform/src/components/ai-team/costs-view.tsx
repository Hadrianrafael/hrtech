'use client';

import { AlertTriangle, CalendarDays, Coins, Info, Sigma } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarList, ColumnChart, Progress } from '@/components/ui/charts';
import { Alert, Card, CardHeader, StatCard } from '@/components/ui/misc';
import { usd } from './shared';

// ─────────────── Tipos (dados simples e serializáveis vindos da página) ───────────────

export interface CostsViewData {
  /** Existe registro da Equipe IA para a organização. */
  activated: boolean;
  enabled: boolean;
  today: { micro: number; budgetMicro: number | null };
  month: { micro: number; budgetMicro: number | null };
  totalMicro: number;
  /** Um item por dia (AAAA-MM-DD, UTC), do mais antigo para hoje, com dias sem consumo zerados. */
  days: { day: string; micro: number }[];
  agents: { id: string; name: string; micro: number; tokens: number; runs: number; failed: number }[];
  models: { model: string; micro: number; tokens: number }[];
}

const tokens = (n: number) => n.toLocaleString('pt-BR');

/** "2026-10-07" → "07/10" (sem passar por Date, para não deslocar o dia pelo fuso). */
function shortDay(day: string) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(day);
  return m ? `${m[2]}/${m[1]}` : day;
}

/** Micro-dólares → US$ numérico (para o gráfico). */
function dollars(micro: number) {
  return Number((micro / 1_000_000).toFixed(4));
}

function pct(value: number, max: number | null) {
  if (!max) return null;
  return Math.round((value / max) * 100);
}

function BudgetHint({ micro, budgetMicro, label }: { micro: number; budgetMicro: number | null; label: string }) {
  if (budgetMicro === null) return <span>Orçamento não configurado.</span>;
  if (budgetMicro === 0) return <span className="text-danger">{label} zerado: nenhuma execução é liberada.</span>;
  const p = pct(micro, budgetMicro);
  return (
    <span className="block space-y-1.5">
      <Progress value={micro} max={budgetMicro} />
      <span className="flex flex-wrap justify-between gap-x-2">
        <span>
          {label}: {usd(budgetMicro)}
        </span>
        {p !== null && <span className={p >= 100 ? 'font-medium text-danger' : p >= 70 ? 'text-warning' : undefined}>{p}% usado</span>}
      </span>
    </span>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2 font-medium ${right ? 'text-right' : ''}`}>{children}</th>;
}

export function CostsView({ data, canManage }: { data: CostsViewData; canManage: boolean }) {
  const runs = data.agents.reduce((s, a) => s + a.runs, 0);
  const failed = data.agents.reduce((s, a) => s + a.failed, 0);
  const tokenTotal = data.agents.reduce((s, a) => s + a.tokens, 0);
  const dailyReached = data.today.budgetMicro !== null && data.today.micro >= data.today.budgetMicro;
  const monthlyReached = data.month.budgetMicro !== null && data.month.micro >= data.month.budgetMicro;
  const chart = data.days.map((d) => ({ label: shortDay(d.day), value: dollars(d.micro) }));
  const agentBars = data.agents.filter((a) => a.micro > 0).map((a) => ({ label: a.name, value: a.micro }));
  const settingsLink = canManage ? (
    <Link href="/ai-team/settings" className="font-medium underline">
      Ajustar orçamentos
    </Link>
  ) : null;

  return (
    <div className="space-y-5">
      {!data.activated ? (
        <Alert tone="yellow" title="Equipe IA ainda não ativada">
          Os custos aparecem aqui depois que a Equipe IA começar a trabalhar.{' '}
          <Link href="/ai-team" className="font-medium underline">
            Conhecer a Equipe IA
          </Link>
        </Alert>
      ) : (
        (dailyReached || monthlyReached) && (
          <Alert tone="red" title={monthlyReached ? 'Orçamento mensal atingido' : 'Orçamento diário atingido'}>
            Novas execuções ficam retidas na fila (nada é perdido) até {monthlyReached ? 'o próximo mês' : 'amanhã'} ou até o orçamento ser ajustado. {settingsLink}
          </Alert>
        )
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Hoje"
          value={usd(data.today.micro)}
          icon={<Coins className="h-4 w-4" />}
          tone={dailyReached ? 'red' : 'brand'}
          hint={<BudgetHint micro={data.today.micro} budgetMicro={data.today.budgetMicro} label="Orçamento diário" />}
        />
        <StatCard
          label="Este mês"
          value={usd(data.month.micro)}
          icon={<CalendarDays className="h-4 w-4" />}
          tone={monthlyReached ? 'red' : 'brand'}
          hint={<BudgetHint micro={data.month.micro} budgetMicro={data.month.budgetMicro} label="Orçamento mensal" />}
        />
        <StatCard
          label="Últimos 30 dias"
          value={usd(data.totalMicro)}
          icon={<Sigma className="h-4 w-4" />}
          tone="blue"
          hint={
            <span>
              {runs.toLocaleString('pt-BR')} execução(ões) · {tokens(tokenTotal)} tokens
              {failed > 0 && (
                <span className="text-danger">
                  {' '}
                  · {failed} com falha
                </span>
              )}
            </span>
          }
        />
      </div>

      <Card>
        <CardHeader title="Custo por dia" description="Últimos 30 dias, em US$ (datas em UTC)." />
        <div className="px-4 py-4">
          <ColumnChart data={chart} empty="Nenhum consumo de IA nos últimos 30 dias." />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Por agente" description="Últimos 30 dias." />
          <div className="px-4 py-4">
            <BarList items={agentBars} format={usd} empty="Nenhum agente consumiu IA no período." />
          </div>
          {data.agents.length > 0 && (
            <div className="overflow-x-auto border-t">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-fg-muted">
                  <tr>
                    <Th>Agente</Th>
                    <Th right>Execuções</Th>
                    <Th right>Falhas</Th>
                    <Th right>Tokens</Th>
                    <Th right>Custo</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.agents.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2">
                        <Link href={`/ai-team/agents/${a.id}`} className="font-medium hover:underline">
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{a.runs.toLocaleString('pt-BR')}</td>
                      <td className={`px-4 py-2 text-right tabular-nums ${a.failed ? 'text-danger' : 'text-fg-muted'}`}>{a.failed.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{tokens(a.tokens)}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{usd(a.micro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Por modelo" description="Provedor · modelo, últimos 30 dias." />
          {data.models.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-fg-muted">Nenhuma execução com modelo de IA no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-fg-muted">
                  <tr>
                    <Th>Provedor · modelo</Th>
                    <Th right>Tokens</Th>
                    <Th right>Custo</Th>
                    <Th right>% do total</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.models.map((m) => (
                    <tr key={m.model}>
                      <td className="break-all px-4 py-2 font-mono text-xs">{m.model}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{tokens(m.tokens)}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{usd(m.micro)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-fg-muted">{data.totalMicro > 0 ? `${Math.round((m.micro / data.totalMicro) * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Alert tone="gray" title="Valores estimados">
        <span className="flex gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Os custos são <strong>estimativas</strong> calculadas a partir dos tokens de cada execução e de uma tabela de preços de referência por modelo (ajustável
            pela variável de ambiente <code className="font-mono">AI_PRICING_JSON</code>). A cobrança real é a do provedor de IA (OpenAI, Anthropic ou Google) — confira
            sempre o painel de faturamento do provedor. Os orçamentos diário e mensal usam essas estimativas para reter novas execuções antes de exceder o limite.
          </span>
        </span>
      </Alert>

      {data.activated && !data.enabled && (
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> A Equipe IA está desativada: nenhum novo custo é gerado até ela ser ativada.
        </p>
      )}
    </div>
  );
}
