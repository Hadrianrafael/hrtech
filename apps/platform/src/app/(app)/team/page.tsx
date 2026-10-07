import type { Metadata } from 'next';
import { TeamManager } from '@/components/org/team-manager';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { checkLimit } from '@/server/billing/limits';

export const metadata: Metadata = { title: 'Equipe' };

export default async function TeamPage() {
  const ctx = await requirePageContext('team.view');
  const [members, invitations, roles, limit] = await Promise.all([
    ctx.db.membership.findMany({ include: { user: true }, orderBy: { createdAt: 'asc' } }),
    ctx.db.invitation.findMany({ where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, include: { role: true }, orderBy: { createdAt: 'desc' } }),
    ctx.db.role.findMany({ orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }] }),
    checkLimit(ctx, 'users', 0),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Equipe" description={limit.limit !== null ? `${limit.used} de ${limit.limit} usuários do plano (inclui convites pendentes)` : 'Usuários e permissões'} />
      <TeamManager
        data={{
          members: members.map((m) => ({ membershipId: m.id, userId: m.userId, name: m.user.name, email: m.user.email, roleId: m.roleId, status: m.status, lastLoginAt: m.user.lastLoginAt?.toISOString() ?? null })),
          invitations: invitations.map((i) => ({ id: i.id, email: i.email, roleName: i.role.name, expiresAt: i.expiresAt.toISOString() })),
          roles: roles.map((r) => ({ id: r.id, name: r.name, description: r.description, isSystem: r.isSystem, permissions: r.permissions })),
          permissions: PERMISSIONS,
          currentUserId: ctx.userId,
          canManage: ctx.permissions.has('team.manage'),
          canManageRoles: ctx.permissions.has('roles.manage'),
        }}
      />
    </div>
  );
}
