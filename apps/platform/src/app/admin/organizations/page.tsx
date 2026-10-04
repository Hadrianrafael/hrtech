import Link from 'next/link';
import { CreateOrganizationButton } from '@/components/admin/admin-forms';
import { Badge, Card, PageHeader } from '@/components/ui/misc';
import { fmtDate } from '@/components/shared/format';
import { systemDb } from '@/lib/db';
import { currentPeriod } from '@/lib/utils';

export const metadata = { title: 'Empresas' };

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const [orgs, plans, usage] = await Promise.all([
    systemDb.organization.findMany({
      where: {
        ...(sp.q ? { name: { contains: sp.q, mode: 'insensitive' as const } } : {}),
        ...(sp.status === 'ACTIVE' || sp.status === 'SUSPENDED' ? { status: sp.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { memberships: true, contacts: true, conversations: true } },
        integrations: { select: { type: true, status: true } },
      },
    }),
    systemDb.plan.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
    systemDb.usage.findMany({ where: { metric: 'ai_messages', period: currentPeriod() } }),
  ]);
  const ai = new Map(usage.map((u) => [u.organizationId, u.count]));
  return (
    <div>
      <PageHeader title="Empresas" description={`${orgs.length} empresa(s)`} actions={<CreateOrganizationButton plans={plans.map((p) => ({ key: p.key, name: p.name }))} />} />
      <form className="mb-3 flex gap-2" method="get">
        <input name="q" defaultValue={sp.q} placeholder="Buscar empresa…" className="input max-w-xs" aria-label="Buscar" />
        <select name="status" defaultValue={sp.status ?? ''} className="input w-40" aria-label="Status">
          <option value="">Todas</option><option value="ACTIVE">Ativas</option><option value="SUSPENDED">Bloqueadas</option>
        </select>
        <button className="rounded-lg bg-muted px-3 text-sm">Filtrar</button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-fg-muted">
            <tr>
              {['Empresa', 'Status', 'Plano', 'Assinatura', 'Usuários', 'Contatos', 'Conversas', 'IA (mês)', 'Integrações', 'Cadastro'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-muted/40">
                <td className="px-3 py-2.5"><Link href={`/admin/organizations/${o.id}`} className="font-medium hover:text-brand">{o.name}</Link>{o.isPlatformOwner && <Badge tone="brand" className="ml-1">HR Tech</Badge>}<p className="text-xs text-fg-muted">{o.segment ?? '—'}</p></td>
                <td className="px-3 py-2.5"><Badge tone={o.status === 'ACTIVE' ? 'green' : 'red'}>{o.status === 'ACTIVE' ? 'Ativa' : 'Bloqueada'}</Badge></td>
                <td className="px-3 py-2.5">{o.subscription?.plan.name ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{o.subscription?.status ?? '—'}</td>
                <td className="px-3 py-2.5 tabular-nums">{o._count.memberships}</td>
                <td className="px-3 py-2.5 tabular-nums">{o._count.contacts}</td>
                <td className="px-3 py-2.5 tabular-nums">{o._count.conversations}</td>
                <td className="px-3 py-2.5 tabular-nums">{ai.get(o.id) ?? 0}</td>
                <td className="px-3 py-2.5 text-xs">{o.integrations.filter((i) => i.status === 'CONNECTED').map((i) => i.type).join(', ') || '—'}</td>
                <td className="px-3 py-2.5 text-xs text-fg-muted">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
