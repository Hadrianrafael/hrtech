import type { Organization } from '@prisma/client';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { systemDb, tenantDb, type TenantDb } from '../db';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { ServiceCtx } from './ctx';
import { ALL_PERMISSIONS, isPermission, type Permission } from './permissions';
import { getCurrentSession } from './session';

export interface OrgContext extends ServiceCtx {
  userId: string;
  user: { id: string; name: string; email: string; isPlatformAdmin: boolean };
  sessionId: string;
  org: Organization;
  role: { key: string; name: string } | null;
  /** Super admin HR Tech acessando uma organização sem ser membro (modo suporte). */
  isSupportMode: boolean;
  db: TenantDb;
  memberships: { organizationId: string; name: string }[];
}

export const getUser = cache(async () => {
  const session = await getCurrentSession();
  return session ? { session, user: session.user } : null;
});

/** Resolve a organização ativa e as permissões do usuário (memoizado por requisição). */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const auth = await getUser();
  if (!auth) return null;
  const { session, user } = auth;

  const memberships = await systemDb.membership.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    include: { organization: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  let orgId = session.activeOrgId;
  let membership = memberships.find((m) => m.organizationId === orgId) ?? null;
  if (!membership && !(orgId && user.isPlatformAdmin)) {
    membership = memberships[0] ?? null;
    orgId = membership?.organizationId ?? null;
  }
  if (!orgId) return null;

  const org = membership?.organization ?? (await systemDb.organization.findUnique({ where: { id: orgId } }));
  if (!org) return null;

  const isSupportMode = !membership && user.isPlatformAdmin;
  const permissions = new Set<Permission>(
    isSupportMode ? ALL_PERMISSIONS : (membership?.role.permissions ?? []).filter(isPermission),
  );

  return {
    orgId: org.id,
    db: tenantDb(org.id),
    userId: user.id,
    actorType: 'USER',
    permissions,
    user: { id: user.id, name: user.name, email: user.email, isPlatformAdmin: user.isPlatformAdmin },
    sessionId: session.id,
    org,
    role: membership ? { key: membership.role.key, name: membership.role.name } : null,
    isSupportMode,
    memberships: memberships.map((m) => ({ organizationId: m.organizationId, name: m.organization.name })),
  };
});

/** Para páginas: redireciona quando não autenticado / sem acesso. */
export async function requirePageContext(permission?: Permission): Promise<OrgContext> {
  const auth = await getUser();
  if (!auth) redirect('/login');
  const ctx = await getOrgContext();
  if (!ctx) redirect(auth.user.isPlatformAdmin ? '/admin' : '/no-organization');
  if (ctx.org.status === 'SUSPENDED' && !ctx.user.isPlatformAdmin) redirect('/suspended');
  if (permission && !ctx.permissions.has(permission)) redirect('/forbidden');
  return ctx;
}

/** Para server actions / route handlers: lança erros tipados. */
export async function requireActionContext(permission?: Permission): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) throw new UnauthorizedError();
  if (ctx.org.status === 'SUSPENDED' && !ctx.user.isPlatformAdmin) {
    throw new ForbiddenError('A conta desta empresa está suspensa. Entre em contato com a HR Tech.');
  }
  if (permission && !ctx.permissions.has(permission)) throw new ForbiddenError();
  return ctx;
}

export async function requirePlatformAdminPage() {
  const auth = await getUser();
  if (!auth) redirect('/login');
  if (!auth.user.isPlatformAdmin) redirect('/forbidden');
  return auth;
}

export async function requirePlatformAdminAction() {
  const auth = await getUser();
  if (!auth) throw new UnauthorizedError();
  if (!auth.user.isPlatformAdmin) throw new ForbiddenError();
  return auth;
}
