import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrgAdminControls } from '@/components/admin/admin-forms';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/misc';
import { fmtDate, fmtDateTime, timeAgo } from '@/components/shared/format';
import { systemDb } from '@/lib/db';
import { LIMIT_KEYS, parseLimits } from '@/server/billing/limits';
import { requirePlatformAdminPage } from '@/lib/auth/context';

export const metadata = { title: 'Empresa' };

export default async function OrganizationDetail({ params }: { params: Promise<{ id: string }> }) {
  // Cada página do painel verifica o acesso: o layout sozinho não protege requisições RSC parciais.
  await requirePlatformAdminPage();
  const { id } = await params;
  const org = await systemDb.organization.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      memberships: { include: { user: true, role: true } },
      integrations: true,
      usage: { orderBy: { period: 'desc' }, take: 12 },
      auditLogs: { where: { severity: { in: ['error', 'warning'] } }, orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { contacts: true, conversations: true, automations: true } },
    },
  });
  if (!org) notFound();
  const plans = await systemDb.plan.findMany({ orderBy: { position: 'asc' } });
  const limits = parseLimits(org.subscription?.plan.limits);
  return (
    <div className="space-y-4">
      <Link href="/admin/organizations" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"><ArrowLeft className="h-3.5 w-3.5" /> Empresas</Link>
      <PageHeader title={org.name} description={`${org.slug} · criada em ${fmtDate(org.createdAt)} · ${org.segment ?? 'sem segmento'}`} actions={<Badge tone={org.status === 'ACTIVE' ? 'green' : 'red'}>{org.status === 'ACTIVE' ? 'Ativa' : `Bloqueada${org.suspendedReason ? `: ${org.suspendedReason}` : ''}`}</Badge>} />
      <Card className="p-4">
        <OrgAdminControls orgId={org.id} status={org.status} planId={org.subscription?.planId ?? null} subStatus={org.subscription?.status ?? null} plans={plans.map((p) => ({ id: p.id, name: p.name }))} />
        {org.subscription && <p className="mt-3 text-xs text-fg-muted">Período atual: {fmtDate(org.subscription.currentPeriodStart)} a {fmtDate(org.subscription.currentPeriodEnd)}{org.subscription.trialEndsAt ? ` · teste até ${fmtDate(org.subscription.trialEndsAt)}` : ''}{org.subscription.cancelAtPeriodEnd ? ' · cancelamento agendado' : ''}</p>}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Usuários (${org.memberships.length})`} />
          <ul className="divide-y text-sm">
            {org.memberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <span>{m.user.name} <span className="text-xs text-fg-muted">{m.user.email}</span></span>
                <span className="flex gap-1.5"><Badge>{m.role.name}</Badge>{m.status !== 'ACTIVE' && <Badge tone="red">Desativado</Badge>}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Consumo" description={`${org._count.contacts} contatos · ${org._count.conversations} conversas · ${org._count.automations} automações`} />
          <div className="space-y-2 p-4 text-xs">
            {Object.entries(LIMIT_KEYS).map(([k, v]) => <p key={k} className="flex justify-between"><span className="text-fg-muted">{v}</span><span>limite: {limits[k as keyof typeof limits] ?? '∞'}</span></p>)}
            <div className="border-t pt-2">
              {org.usage.map((u) => <p key={u.id} className="flex justify-between"><span className="text-fg-muted">{u.period} · {u.metric}</span><span className="tabular-nums">{u.count}</span></p>)}
              {!org.usage.length && <p className="text-fg-muted">Sem consumo registrado.</p>}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Integrações" />
          <ul className="divide-y text-sm">
            {org.integrations.map((i) => (
              <li key={i.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between"><span>{i.type} · {i.name}</span><Badge tone={i.status === 'CONNECTED' ? 'green' : i.status === 'ERROR' ? 'red' : 'gray'}>{i.status}</Badge></div>
                <p className="text-xs text-fg-muted">{i.lastEventAt ? `último evento ${timeAgo(i.lastEventAt)}` : 'sem eventos'}{i.lastError ? ` · erro: ${i.lastError}` : ''}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Alertas e erros recentes" />
          <ul className="divide-y text-sm">
            {org.auditLogs.map((l) => (
              <li key={l.id} className="px-4 py-2">
                <p className="flex items-center gap-2"><Badge tone={l.severity === 'error' ? 'red' : 'yellow'}>{l.action}</Badge><span className="text-xs text-fg-muted">{fmtDateTime(l.createdAt)}</span></p>
                {(l.metadata as { error?: string }).error && <p className="mt-0.5 truncate text-xs text-fg-muted">{(l.metadata as { error?: string }).error}</p>}
              </li>
            ))}
            {!org.auditLogs.length && <li className="px-4 py-6 text-center text-xs text-fg-muted">Nenhum alerta.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
