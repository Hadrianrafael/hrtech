import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { CancelButton, PlanButton } from '@/components/org/billing-actions';
import { Progress } from '@/components/ui/charts';
import { Alert, Badge, Card, CardHeader, PageHeader } from '@/components/ui/misc';
import { fmtDate } from '@/components/shared/format';
import { requirePageContext } from '@/lib/auth/context';
import { systemDb } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { usageSummary } from '@/server/billing/limits';
import { getBillingProvider } from '@/server/billing/provider';

export const metadata: Metadata = { title: 'Plano e assinatura' };

const STATUS: Record<string, { label: string; tone: 'green' | 'yellow' | 'red' | 'gray' | 'blue' }> = {
  TRIALING: { label: 'Período de teste', tone: 'blue' }, ACTIVE: { label: 'Ativa', tone: 'green' }, PAST_DUE: { label: 'Pagamento pendente', tone: 'yellow' },
  CANCELED: { label: 'Cancelada', tone: 'red' }, PAUSED: { label: 'Pausada', tone: 'gray' },
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('billing.view');
  const [{ plan, rows }, plans] = await Promise.all([usageSummary(ctx), systemDb.plan.findMany({ where: { active: true, isPublic: true }, orderBy: { position: 'asc' } })]);
  const sub = plan?.subscription;
  const canManage = ctx.permissions.has('billing.manage');
  const provider = getBillingProvider();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader title="Plano e assinatura" />
      {sp.status === 'success' && <Alert tone="green" title="Pagamento recebido">A assinatura será atualizada assim que o gateway confirmar.</Alert>}
      {sub?.status === 'PAST_DUE' && <Alert tone="yellow" title="Assinatura com pendência">Regularize para evitar suspensão. Fale com a HR Tech se precisar de ajuda.</Alert>}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader title="Assinatura atual" />
          {sub && plan ? (
            <div className="space-y-2 p-4 text-sm">
              <p className="text-2xl font-semibold">{plan.plan.name}</p>
              <p className="text-fg-muted">{formatMoney(plan.plan.priceCents / 100)} / mês</p>
              <div className="flex flex-wrap gap-2"><Badge tone={STATUS[sub.status]?.tone}>{STATUS[sub.status]?.label}</Badge>{sub.cancelAtPeriodEnd && <Badge tone="red">Cancelamento agendado</Badge>}</div>
              <p className="text-xs text-fg-muted">
                {sub.status === 'TRIALING' && sub.trialEndsAt ? `Teste até ${fmtDate(sub.trialEndsAt)}` : `Período: ${fmtDate(sub.currentPeriodStart)} a ${fmtDate(sub.currentPeriodEnd)}`}
              </p>
              <p className="text-xs text-fg-muted">Cobrança: {sub.provider === 'manual' ? 'gerenciada pela HR Tech' : sub.provider}</p>
              {canManage && !sub.cancelAtPeriodEnd && sub.status !== 'CANCELED' && <CancelButton />}
            </div>
          ) : (
            <p className="p-4 text-sm text-fg-muted">Nenhuma assinatura encontrada.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Consumo e limites" description="Mês corrente para métricas mensais" />
          <ul className="space-y-3 p-4">
            {rows.map((r) => (
              <li key={r.key}>
                <div className="mb-1 flex justify-between text-xs"><span>{r.label}</span><span className="tabular-nums text-fg-muted">{r.used}{r.limit !== null ? ` / ${r.limit}` : ' (ilimitado)'}</span></div>
                <Progress value={r.used} max={r.limit} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold">Planos disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => {
            const limits = p.limits as Record<string, number>;
            return (
              <Card key={p.id} className={plan?.plan.id === p.id ? 'ring-2 ring-brand' : ''}>
                <div className="space-y-3 p-4">
                  <div><p className="text-lg font-semibold">{p.name}</p><p className="text-xs text-fg-muted">{p.description}</p></div>
                  <p className="text-2xl font-semibold">{formatMoney(p.priceCents / 100)}<span className="text-xs font-normal text-fg-muted"> /mês</span></p>
                  <ul className="space-y-1 text-xs">
                    {p.features.map((f) => <li key={f} className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> {f}</li>)}
                    {limits.users !== undefined && <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Até {limits.users} usuários</li>}
                    {limits.aiMessagesPerMonth !== undefined && <li className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> {limits.aiMessagesPerMonth.toLocaleString('pt-BR')} mensagens de IA/mês</li>}
                  </ul>
                  {canManage && <PlanButton planId={p.id} current={plan?.plan.id === p.id} />}
                </div>
              </Card>
            );
          })}
        </div>
        {provider.key === 'manual' && <p className="mt-2 text-xs text-fg-muted">Pagamentos online ainda não habilitados (gateway pendente de credenciais). Mudanças de plano são processadas pela equipe HR Tech.</p>}
      </div>
    </div>
  );
}
