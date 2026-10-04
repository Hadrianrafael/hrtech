import { audit } from '@/lib/audit';
import { SYSTEM_ROLES } from '@/lib/auth/permissions';
import { randomToken } from '@/lib/crypto';
import { systemDb, withSystem } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { slugify } from '@/lib/utils';
import { addMonths } from './billing/subscriptions';
import { DEFAULT_STAGES, DEFAULT_TAGS, defaultAutomations, defaultCollectFields } from './defaults';

/** Garante a existência dos papéis de sistema (idempotente). */
export async function ensureSystemRoles() {
  for (const r of SYSTEM_ROLES) {
    const existing = await systemDb.role.findFirst({ where: { organizationId: null, key: r.key } });
    if (existing) {
      await systemDb.role.update({ where: { id: existing.id }, data: { name: r.name, description: r.description, permissions: r.permissions, isSystem: true } });
    } else {
      await systemDb.role.create({ data: { key: r.key, name: r.name, description: r.description, permissions: r.permissions, isSystem: true } });
    }
  }
}

export async function getSystemRole(key: string) {
  const role = await systemDb.role.findFirst({ where: { organizationId: null, key } });
  if (!role) throw new AppError(`Papel de sistema ${key} ausente. Execute o seed.`);
  return role;
}

export async function uniqueSlug(name: string) {
  const base = slugify(name) || 'empresa';
  let slug = base;
  for (let i = 2; await systemDb.organization.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return slug;
}

export interface ProvisionInput {
  name: string;
  segment?: string | null;
  planKey?: string;
  isPlatformOwner?: boolean;
  trialDays?: number;
}

/**
 * Cria uma organização com tudo o que ela precisa para funcionar:
 * funil padrão, etiquetas, chatbot, base de conhecimento, canal de chat do site,
 * automações iniciais e assinatura.
 */
export async function provisionOrganization(input: ProvisionInput, actorUserId: string | null = null) {
  const slug = await uniqueSlug(input.name);
  const plan =
    (input.planKey ? await systemDb.plan.findUnique({ where: { key: input.planKey } }) : null) ??
    (await systemDb.plan.findFirst({ where: { active: true }, orderBy: { position: 'asc' } }));
  if (!plan) throw new AppError('Nenhum plano cadastrado. Cadastre um plano no painel HR Tech.');

  const org = await withSystem(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.name, slug, segment: input.segment ?? null, isPlatformOwner: input.isPlatformOwner ?? false },
    });
    const pipeline = await tx.pipeline.create({ data: { organizationId: org.id, name: 'Funil comercial', isDefault: true } });
    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((s, i) => ({ ...s, organizationId: org.id, pipelineId: pipeline.id, position: i })),
    });
    await tx.tag.createMany({ data: DEFAULT_TAGS.map((t) => ({ ...t, organizationId: org.id })) });
    await tx.chatbot.create({
      data: {
        organizationId: org.id,
        name: 'Assistente',
        greeting: `Olá! Bem-vindo(a) à ${input.name}. Como posso ajudar?`,
        collectFields: defaultCollectFields(input.segment),
        channels: ['WEBCHAT', 'WHATSAPP', 'INSTAGRAM'],
        publicKey: `pk_${randomToken(18)}`,
        handoffRules: { keywords: ['atendente', 'humano', 'pessoa', 'falar com alguém'], maxAiTurns: 12 },
        businessHours: {
          enabled: true,
          timezone: 'America/Sao_Paulo',
          days: { mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'], sat: ['09:00', '13:00'] },
          outOfHoursMessage: 'Nossa equipe está fora do horário de atendimento, mas responderemos assim que possível.',
        },
      },
    });
    await tx.knowledgeBase.create({ data: { organizationId: org.id, name: 'Base principal' } });
    await tx.integration.create({ data: { organizationId: org.id, type: 'WEBCHAT', name: 'Chat do site', status: 'CONNECTED' } });
    for (const a of defaultAutomations()) await tx.automation.create({ data: { ...a, organizationId: org.id } });
    const trialDays = input.trialDays ?? 14;
    await tx.subscription.create({
      data: {
        organizationId: org.id,
        planId: plan.id,
        status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
        trialEndsAt: trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : null,
        currentPeriodEnd: trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : addMonths(new Date(), 1),
      },
    });
    return org;
  });

  await audit({ organizationId: org.id, actorUserId, action: 'organization.created', entityType: 'Organization', entityId: org.id, metadata: { name: org.name, plan: plan.key } });
  return org;
}

export async function setOrganizationStatus(orgId: string, status: 'ACTIVE' | 'SUSPENDED', actorUserId: string, reason?: string) {
  const org = await systemDb.organization.update({
    where: { id: orgId },
    data: { status, suspendedReason: status === 'SUSPENDED' ? (reason ?? null) : null },
  });
  await audit({ organizationId: orgId, actorUserId, action: status === 'SUSPENDED' ? 'organization.suspended' : 'organization.reactivated', entityType: 'Organization', entityId: orgId, severity: 'warning', metadata: { reason } });
  return org;
}
