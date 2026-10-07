import { systemDb } from '@/lib/db';
import { LimitExceededError } from '@/lib/errors';
import { currentPeriod } from '@/lib/utils';
import type { ServiceCtx } from '@/lib/auth/ctx';

/** Chaves de limite suportadas por plano. `null`/ausente/-1 = ilimitado. */
export const LIMIT_KEYS = {
  users: 'Usuários',
  contacts: 'Contatos',
  conversationsPerMonth: 'Conversas por mês',
  aiMessagesPerMonth: 'Mensagens de IA por mês',
  automations: 'Automações',
  channels: 'Canais conectados',
  knowledgeDocuments: 'Documentos na base de conhecimento',
} as const;

export type LimitKey = keyof typeof LIMIT_KEYS;
export type PlanLimits = Partial<Record<LimitKey, number | null>>;

export const USAGE_METRICS = { aiMessages: 'ai_messages', conversations: 'conversations' } as const;

export function parseLimits(raw: unknown): PlanLimits {
  const out: PlanLimits = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const key of Object.keys(LIMIT_KEYS) as LimitKey[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[key] = v;
  }
  return out;
}

export async function getOrgPlan(orgId: string) {
  const sub = await systemDb.subscription.findUnique({ where: { organizationId: orgId }, include: { plan: true } });
  return sub ? { subscription: sub, plan: sub.plan, limits: parseLimits(sub.plan.limits) } : null;
}

export async function getUsageCount(orgId: string, metric: string, period = currentPeriod()) {
  const row = await systemDb.usage.findUnique({ where: { organizationId_metric_period: { organizationId: orgId, metric, period } } });
  return row?.count ?? 0;
}

export async function incrementUsage(orgId: string, metric: string, by = 1) {
  const period = currentPeriod();
  await systemDb.usage.upsert({
    where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
    create: { organizationId: orgId, metric, period, count: by },
    update: { count: { increment: by } },
  });
}

async function currentValue(ctx: ServiceCtx, key: LimitKey): Promise<number> {
  switch (key) {
    case 'users':
      return (
        (await ctx.db.membership.count({ where: { status: 'ACTIVE' } })) +
        (await ctx.db.invitation.count({ where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }))
      );
    case 'contacts':
      return ctx.db.contact.count({ where: { anonymizedAt: null } });
    case 'automations':
      return ctx.db.automation.count();
    case 'channels':
      return ctx.db.integration.count({ where: { status: { in: ['CONNECTED', 'PENDING'] }, type: { not: 'WEBCHAT' } } });
    case 'knowledgeDocuments':
      return ctx.db.knowledgeDocument.count();
    case 'conversationsPerMonth':
      return getUsageCount(ctx.orgId, USAGE_METRICS.conversations);
    case 'aiMessagesPerMonth':
      return getUsageCount(ctx.orgId, USAGE_METRICS.aiMessages);
  }
}

export async function checkLimit(ctx: ServiceCtx, key: LimitKey, adding = 1) {
  const plan = await getOrgPlan(ctx.orgId);
  const limit = plan?.limits[key];
  if (limit === undefined || limit === null || limit < 0) return { allowed: true, limit: null, used: null };
  const used = await currentValue(ctx, key);
  return { allowed: used + adding <= limit, limit, used };
}

export async function assertWithinLimit(ctx: ServiceCtx, key: LimitKey, adding = 1) {
  const r = await checkLimit(ctx, key, adding);
  if (!r.allowed) {
    throw new LimitExceededError(
      `Limite do plano atingido: ${LIMIT_KEYS[key]} (${r.used}/${r.limit}). Faça upgrade do plano para continuar.`,
    );
  }
}

export async function usageSummary(ctx: ServiceCtx) {
  const plan = await getOrgPlan(ctx.orgId);
  const rows = await Promise.all(
    (Object.keys(LIMIT_KEYS) as LimitKey[]).map(async (key) => ({
      key,
      label: LIMIT_KEYS[key],
      used: await currentValue(ctx, key),
      limit: plan?.limits[key] ?? null,
    })),
  );
  return { plan, rows };
}
