'use server';

import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { formToObject } from '@/lib/action';
import { withOrg, withOrgSchema } from '@/lib/action-ctx';
import { audit } from '@/lib/audit';
import { ALL_PERMISSIONS, isPermission } from '@/lib/auth/permissions';
import { AppError } from '@/lib/errors';
import { timeZoneSchema } from '@/lib/validation';
import { assertGrantable, changeMemberRole, createInvitation, revokeInvitation, setMemberStatus } from '@/server/auth-service';
import { getOrgPlan } from '@/server/billing/limits';
import { getBillingProvider } from '@/server/billing/provider';
import { requestCancellation } from '@/server/billing/subscriptions';
import {
  deleteIntegration, emailSchema, instagramSchema, saveEmail, saveInstagram, saveWhatsApp, setIntegrationEnabled, testIntegration, whatsappSchema,
} from '@/server/integrations';
import { systemDb } from '@/lib/db';
import { env } from '@/lib/env';
import { slugify } from '@/lib/utils';

// ─── Equipe ───
export async function inviteMemberAction(form: FormData) {
  return withOrgSchema(
    'team.manage',
    z.object({ email: z.string().trim().email('E-mail inválido.'), name: z.string().trim().max(120).optional(), roleId: z.string().min(1, 'Selecione o papel.') }),
    form,
    async (ctx, d) => {
      const r = await createInvitation(ctx, d);
      return { link: r.link, delivered: r.delivered };
    },
  );
}

export async function revokeInvitationAction(id: string) {
  return withOrg('team.manage', (ctx) => revokeInvitation(ctx, id), 'Convite revogado.');
}

export async function changeMemberRoleAction(membershipId: string, roleId: string) {
  return withOrg('team.manage', (ctx) => changeMemberRole(ctx, membershipId, roleId), 'Papel atualizado.');
}

export async function setMemberStatusAction(membershipId: string, status: 'ACTIVE' | 'DISABLED') {
  return withOrg('team.manage', (ctx) => setMemberStatus(ctx, membershipId, status), status === 'ACTIVE' ? 'Acesso reativado.' : 'Acesso desativado.');
}

export async function saveRoleAction(id: string | null, form: FormData) {
  return withOrg('roles.manage', async (ctx) => {
    const raw = formToObject(form);
    const name = String(raw.name ?? '').trim();
    if (!name) throw new AppError('Nome do papel é obrigatório.');
    const perms = ([] as unknown[]).concat(raw.permissions ?? []).map(String).filter(isPermission);
    if (!perms.length) throw new AppError('Selecione ao menos uma permissão.');
    assertGrantable(ctx, perms); // ninguém concede permissões que não possui
    if (id) {
      const role = await ctx.db.role.findFirst({ where: { id, organizationId: ctx.orgId } });
      if (!role) throw new AppError('Papéis de sistema não podem ser editados. Crie um papel personalizado.');
      assertGrantable(ctx, role.permissions);
      const own = await ctx.db.membership.findFirst({ where: { userId: ctx.userId, roleId: id } });
      if (own && !ctx.isSupportMode) throw new AppError('Você não pode editar o papel que você mesmo possui.');
      await ctx.db.role.update({ where: { id }, data: { name, description: String(raw.description ?? '') || null, permissions: perms } });
    } else {
      await ctx.db.role.create({ data: { organizationId: ctx.orgId, key: `custom_${slugify(name)}_${Date.now().toString(36)}`, name, description: String(raw.description ?? '') || null, permissions: perms } });
    }
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'roles.saved', severity: 'warning', metadata: { name, permissions: perms.length, of: ALL_PERMISSIONS.length } });
  }, 'Papel salvo.');
}

export async function deleteRoleAction(id: string) {
  return withOrg('roles.manage', async (ctx) => {
    const inUse = await ctx.db.membership.count({ where: { roleId: id } });
    if (inUse) throw new AppError('Há membros com este papel. Altere-os antes de excluir.');
    const role = await ctx.db.role.findFirst({ where: { id, organizationId: ctx.orgId } });
    if (!role) throw new AppError('Papel não encontrado ou de sistema.');
    assertGrantable(ctx, role.permissions);
    await ctx.db.role.delete({ where: { id } });
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'roles.deleted', severity: 'warning', entityId: id });
  }, 'Papel excluído.');
}

// ─── Configurações da empresa ───
export async function saveOrganizationAction(form: FormData) {
  return withOrgSchema(
    'settings.manage',
    z.object({
      name: z.string().trim().min(2, 'Nome obrigatório.').max(120),
      segment: z.string().max(40).optional(),
      timezone: timeZoneSchema,
      retentionDays: z.union([z.literal(''), z.coerce.number().int().min(30, 'Mínimo de 30 dias.').max(3650)]).optional(),
    }),
    form,
    async (ctx, d) => {
      await ctx.db.organization.update({
        where: { id: ctx.orgId },
        data: { name: d.name, segment: d.segment || null, timezone: d.timezone, retentionDays: d.retentionDays === '' || d.retentionDays === undefined ? null : d.retentionDays },
      });
      // O horário de atendimento do chatbot segue o fuso da empresa (o assistente usa esse valor).
      const chatbot = await ctx.db.chatbot.findFirst({});
      const hours = (chatbot?.businessHours ?? null) as Record<string, unknown> | null;
      if (chatbot && hours && hours.timezone !== d.timezone) {
        await ctx.db.chatbot.update({ where: { id: chatbot.id }, data: { businessHours: { ...hours, timezone: d.timezone } as Prisma.InputJsonValue } });
      }
      await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'organization.updated', entityType: 'Organization', entityId: ctx.orgId });
    },
    'Configurações salvas.',
  );
}

// ─── Integrações ───
export async function saveWhatsAppAction(id: string | null, form: FormData) {
  return withOrgSchema('integrations.manage', whatsappSchema, form, async (ctx, d) => ({ id: (await saveWhatsApp(ctx, id, d)).id }), 'WhatsApp salvo. Teste a conexão.');
}
export async function saveInstagramAction(id: string | null, form: FormData) {
  return withOrgSchema('integrations.manage', instagramSchema, form, async (ctx, d) => ({ id: (await saveInstagram(ctx, id, d)).id }), 'Instagram salvo. Teste a conexão.');
}
export async function saveEmailAction(id: string | null, form: FormData) {
  return withOrgSchema('integrations.manage', emailSchema, form, async (ctx, d) => ({ id: (await saveEmail(ctx, id, d)).id }), 'Conta de e-mail salva. Teste a conexão.');
}
export async function testIntegrationAction(id: string) {
  return withOrg('integrations.manage', (ctx) => testIntegration(ctx, id));
}
export async function setIntegrationEnabledAction(id: string, enabled: boolean) {
  return withOrg('integrations.manage', (ctx) => setIntegrationEnabled(ctx, id, enabled), enabled ? 'Integração reativada.' : 'Integração desativada.');
}
export async function deleteIntegrationAction(id: string) {
  return withOrg('integrations.manage', (ctx) => deleteIntegration(ctx, id), 'Integração removida.');
}

// ─── Plano ───
export async function requestPlanChangeAction(planId: string) {
  return withOrg('billing.manage', async (ctx) => {
    const plan = await systemDb.plan.findFirst({ where: { id: planId, active: true, isPublic: true } });
    if (!plan) throw new AppError('Plano indisponível.');
    const provider = getBillingProvider();
    const current = await getOrgPlan(ctx.orgId);
    const result = await provider.createCheckout({
      organizationId: ctx.orgId,
      planKey: plan.key,
      priceCents: plan.priceCents,
      currency: plan.currency,
      customerEmail: ctx.user.email,
      successUrl: `${env.appUrl()}/billing?status=success`,
      cancelUrl: `${env.appUrl()}/billing?status=cancel`,
    });
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'billing.plan_change_requested', metadata: { from: current?.plan.key, to: plan.key, provider: provider.key } });
    return result;
  });
}

export async function cancelSubscriptionAction() {
  return withOrg('billing.manage', async (ctx) => {
    await requestCancellation(ctx.orgId, ctx.userId);
  }, 'Cancelamento agendado para o fim do período atual.');
}
