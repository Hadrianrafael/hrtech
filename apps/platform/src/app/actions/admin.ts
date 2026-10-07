'use server';

import type { Prisma, SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';
import { actionError, runAction, type ActionResult } from '@/lib/action';
import { audit } from '@/lib/audit';
import { requirePlatformAdminAction } from '@/lib/auth/context';
import { makeServiceCtx } from '@/lib/auth/ctx';
import { systemDb } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { createInvitation } from '@/server/auth-service';
import { LIMIT_KEYS, type LimitKey } from '@/server/billing/limits';
import { changePlan, setSubscriptionStatus } from '@/server/billing/subscriptions';
import { getSystemRole, provisionOrganization, setOrganizationStatus } from '@/server/orgs';

async function adminAction<T>(fn: (adminId: string) => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const { user } = await requirePlatformAdminAction();
    return { ok: true, data: await fn(user.id), message };
  } catch (err) {
    return actionError(err);
  }
}

const orgSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório.').max(120),
  segment: z.string().max(40).optional(),
  planKey: z.string().min(1, 'Selecione o plano.'),
  trialDays: z.coerce.number().int().min(0).max(90).default(14),
  adminName: z.string().trim().max(120).optional(),
  adminEmail: z.string().trim().email('E-mail do administrador inválido.'),
});

export async function createOrganizationAction(form: FormData): Promise<ActionResult<{ id: string; link: string | null; delivered: boolean }>> {
  try {
    const { user } = await requirePlatformAdminAction();
    return runAction(orgSchema, form, async (d) => {
      const org = await provisionOrganization({ name: d.name, segment: d.segment || null, planKey: d.planKey, trialDays: d.trialDays }, user.id);
      const role = await getSystemRole('org_admin');
      const ctx = makeServiceCtx(org.id, { userId: user.id });
      const inv = await createInvitation(ctx, { email: d.adminEmail, name: d.adminName ?? null, roleId: role.id });
      return { id: org.id, link: inv.link, delivered: inv.delivered };
    });
  } catch (err) {
    return actionError(err);
  }
}

export async function inviteToOrganizationAction(orgId: string, form: FormData) {
  return adminAction(async (adminId) => {
    const raw = Object.fromEntries(form.entries()) as Record<string, string>;
    const role = await getSystemRole(raw.roleKey || 'agent');
    const inv = await createInvitation(makeServiceCtx(orgId, { userId: adminId }), { email: raw.email ?? '', name: raw.name || null, roleId: role.id });
    return { link: inv.link, delivered: inv.delivered };
  });
}

export async function setOrganizationStatusAction(orgId: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
  return adminAction(async (adminId) => {
    await setOrganizationStatus(orgId, status, adminId, reason);
  }, status === 'SUSPENDED' ? 'Empresa bloqueada.' : 'Empresa desbloqueada.');
}

export async function changeOrganizationPlanAction(orgId: string, planId: string) {
  return adminAction(async (adminId) => {
    await changePlan(orgId, planId, adminId);
  }, 'Plano alterado.');
}

export async function setSubscriptionStatusAction(orgId: string, status: SubscriptionStatus) {
  return adminAction(async (adminId) => {
    await setSubscriptionStatus(orgId, status, adminId);
  }, 'Assinatura atualizada.');
}

export async function savePlanAction(id: string | null, form: FormData) {
  return adminAction(async (adminId) => {
    const raw = Object.fromEntries(form.entries()) as Record<string, string>;
    const key = (raw.key ?? '').trim().toLowerCase();
    const name = (raw.name ?? '').trim();
    if (!/^[a-z0-9_-]{2,40}$/.test(key)) throw new AppError('Chave inválida (use letras minúsculas, números, - ou _).');
    if (!name) throw new AppError('Nome obrigatório.');
    const price = Math.round(Number((raw.price ?? '0').replace(',', '.')) * 100);
    if (!Number.isFinite(price) || price < 0) throw new AppError('Preço inválido.');
    const limits: Partial<Record<LimitKey, number>> = {};
    for (const k of Object.keys(LIMIT_KEYS) as LimitKey[]) {
      const v = raw[`limit_${k}`];
      if (v !== undefined && v !== '') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0) throw new AppError(`Limite inválido: ${LIMIT_KEYS[k]}`);
        limits[k] = n;
      }
    }
    const data = {
      key,
      name,
      description: raw.description || null,
      priceCents: price,
      currency: 'BRL',
      limits: limits as Prisma.InputJsonValue,
      features: (raw.features ?? '').split('\n').map((f) => f.trim()).filter(Boolean),
      active: raw.active === 'on',
      isPublic: raw.isPublic === 'on',
      position: Number(raw.position ?? 0) || 0,
    };
    const plan = id ? await systemDb.plan.update({ where: { id }, data }) : await systemDb.plan.create({ data });
    await audit({ actorUserId: adminId, action: id ? 'admin.plan_updated' : 'admin.plan_created', entityType: 'Plan', entityId: plan.id, metadata: { key } });
  }, 'Plano salvo.');
}

export async function setUserDisabledAction(userId: string, disabled: boolean) {
  return adminAction(async (adminId) => {
    if (userId === adminId) throw new AppError('Você não pode desativar a própria conta.');
    await systemDb.user.update({ where: { id: userId }, data: { disabled } });
    if (disabled) await systemDb.session.deleteMany({ where: { userId } });
    await audit({ actorUserId: adminId, action: disabled ? 'admin.user_disabled' : 'admin.user_enabled', entityType: 'User', entityId: userId, severity: 'warning' });
  }, disabled ? 'Usuário desativado.' : 'Usuário reativado.');
}

export async function enterOrganizationAction(orgId: string) {
  return adminAction(async (adminId) => {
    const { getUser } = await import('@/lib/auth/context');
    const auth = await getUser();
    if (!auth) throw new AppError('Sessão inválida.');
    await systemDb.session.update({ where: { id: auth.session.id }, data: { activeOrgId: orgId } });
    await audit({ organizationId: orgId, actorUserId: adminId, action: 'admin.support_access', severity: 'warning' });
  });
}
