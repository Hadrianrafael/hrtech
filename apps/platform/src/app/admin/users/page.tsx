import { UserToggle } from '@/components/admin/admin-forms';
import { Badge, Card, PageHeader } from '@/components/ui/misc';
import { timeAgo } from '@/components/shared/format';
import { systemDb } from '@/lib/db';

export const metadata = { title: 'Usuários' };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const users = await systemDb.user.findMany({
    where: sp.q ? { OR: [{ name: { contains: sp.q, mode: 'insensitive' } }, { email: { contains: sp.q, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { memberships: { include: { organization: { select: { name: true } }, role: { select: { name: true } } } } },
  });
  return (
    <div>
      <PageHeader title="Usuários" description={`${users.length} usuário(s)`} />
      <form className="mb-3" method="get"><input name="q" defaultValue={sp.q} placeholder="Buscar por nome ou e-mail…" className="input max-w-sm" aria-label="Buscar" /></form>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-fg-muted"><tr><th className="px-4 py-2 font-medium">Usuário</th><th className="px-4 py-2 font-medium">Empresas</th><th className="px-4 py-2 font-medium">Último login</th><th className="px-4 py-2 font-medium">Status</th><th /></tr></thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5"><p className="font-medium">{u.name} {u.isPlatformAdmin && <Badge tone="brand">Super admin</Badge>}</p><p className="text-xs text-fg-muted">{u.email}</p></td>
                <td className="px-4 py-2.5 text-xs">{u.memberships.map((m) => `${m.organization.name} (${m.role.name})`).join(', ') || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-fg-muted">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Nunca'}</td>
                <td className="px-4 py-2.5"><Badge tone={u.disabled ? 'red' : u.lockedUntil && u.lockedUntil > new Date() ? 'yellow' : 'green'}>{u.disabled ? 'Desativado' : u.lockedUntil && u.lockedUntil > new Date() ? 'Bloqueado temporariamente' : 'Ativo'}</Badge></td>
                <td className="px-4 py-2.5 text-right"><UserToggle userId={u.id} disabled={u.disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
