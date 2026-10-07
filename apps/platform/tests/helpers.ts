import { __unsafeBasePrismaForTests, systemDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { makeServiceCtx, type ServiceCtx } from '@/lib/auth/ctx';
import { SYSTEM_ROLES, type Permission } from '@/lib/auth/permissions';
import { ensureSystemRoles, getSystemRole, provisionOrganization } from '@/server/orgs';

export const hasDb = !!process.env.TEST_DATABASE_URL || !!process.env.DATABASE_URL;

export async function dbReachable() {
  if (!hasDb) return false;
  try {
    await __unsafeBasePrismaForTests.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Limpa todas as tabelas (TRUNCATE não é afetado por RLS) e recria planos/papéis. */
export async function resetDb() {
  const tables = await __unsafeBasePrismaForTests.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await __unsafeBasePrismaForTests.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`);
  await systemDb.plan.create({ data: { key: 'test', name: 'Teste', priceCents: 0, limits: {}, position: 0 } });
  await ensureSystemRoles();
}

export async function createOrg(name: string, limits: Record<string, number> = {}) {
  let planKey = 'test';
  if (Object.keys(limits).length) {
    planKey = `limited-${Math.random().toString(36).slice(2, 8)}`;
    await systemDb.plan.create({ data: { key: planKey, name: planKey, limits } });
  }
  return provisionOrganization({ name, segment: 'pousada', planKey, trialDays: 0 });
}

export async function createUser(email: string, orgId: string | null, roleKey = 'org_admin', password = 'Senha1234') {
  const user = await systemDb.user.create({ data: { email, name: email.split('@')[0]!, passwordHash: await hashPassword(password) } });
  if (orgId) {
    const role = await getSystemRole(roleKey);
    await systemDb.membership.create({ data: { userId: user.id, organizationId: orgId, roleId: role.id } });
  }
  return user;
}

export function ctxFor(orgId: string, userId: string | null, roleKey: string = 'org_admin'): ServiceCtx {
  const role = SYSTEM_ROLES.find((r) => r.key === roleKey)!;
  return makeServiceCtx(orgId, { userId, permissions: role.permissions as Permission[] });
}
