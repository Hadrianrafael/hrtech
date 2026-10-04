import type { SubscriptionStatus } from '@prisma/client';
import { audit } from '@/lib/audit';
import { systemDb } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import type { BillingWebhookEvent } from './provider';

const DAY = 24 * 60 * 60 * 1000;

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export async function changePlan(organizationId: string, planId: string, actorUserId: string | null) {
  const plan = await systemDb.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError('Plano não encontrado.');
  const sub = await systemDb.subscription.upsert({
    where: { organizationId },
    create: { organizationId, planId, status: 'ACTIVE', currentPeriodEnd: addMonths(new Date(), 1) },
    update: { planId },
  });
  await audit({ organizationId, actorUserId, action: 'billing.plan_changed', entityType: 'Subscription', entityId: sub.id, metadata: { plan: plan.key } });
  return sub;
}

export async function setSubscriptionStatus(
  organizationId: string,
  status: SubscriptionStatus,
  actorUserId: string | null,
  opts: { periodEnd?: Date } = {},
) {
  const data: Record<string, unknown> = { status };
  if (status === 'CANCELED') data.canceledAt = new Date();
  if (status === 'ACTIVE') {
    data.currentPeriodStart = new Date();
    data.currentPeriodEnd = opts.periodEnd ?? addMonths(new Date(), 1);
    data.cancelAtPeriodEnd = false;
  }
  const sub = await systemDb.subscription.update({ where: { organizationId }, data });
  await audit({ organizationId, actorUserId, action: 'billing.status_changed', entityType: 'Subscription', entityId: sub.id, metadata: { status } });
  return sub;
}

export async function requestCancellation(organizationId: string, actorUserId: string) {
  const sub = await systemDb.subscription.update({ where: { organizationId }, data: { cancelAtPeriodEnd: true } });
  await audit({ organizationId, actorUserId, action: 'billing.cancel_requested', entityType: 'Subscription', entityId: sub.id });
  return sub;
}

/** Aplica eventos normalizados vindos de qualquer gateway. */
export async function applyBillingEvent(event: BillingWebhookEvent) {
  // Primeiro pela assinatura do provedor já vinculada; depois pela empresa informada nos metadados.
  let sub = event.externalSubscriptionId ? await systemDb.subscription.findFirst({ where: { externalSubscriptionId: event.externalSubscriptionId } }) : null;
  if (!sub && event.organizationId) sub = await systemDb.subscription.findUnique({ where: { organizationId: event.organizationId } });
  if (!sub) return null;
  const statusMap: Partial<Record<BillingWebhookEvent['type'], SubscriptionStatus>> = {
    'subscription.activated': 'ACTIVE',
    'subscription.renewed': 'ACTIVE',
    'subscription.past_due': 'PAST_DUE',
    'subscription.canceled': 'CANCELED',
  };
  const status = statusMap[event.type];
  if (!status) return sub.organizationId;
  const ignore = async (reason: string) => {
    await audit({ organizationId: sub.organizationId, action: 'billing.webhook.ignored', actorType: 'SYSTEM', metadata: { eventId: event.id, type: event.type, reason } });
    return sub.organizationId;
  };
  // Eventos de outra assinatura do provedor (ex.: a anterior a uma troca de plano) não mexem na atual;
  // apenas um checkout concluído vincula uma assinatura nova.
  if (sub.externalSubscriptionId && event.externalSubscriptionId && event.externalSubscriptionId !== sub.externalSubscriptionId && event.type !== 'subscription.activated') {
    return ignore('other_subscription');
  }
  // Entrega fora de ordem (ex.: reenvio de uma falha de pagamento antiga) não desfaz um estado mais novo.
  if (event.occurredAt && sub.lastBillingEventAt && event.occurredAt < sub.lastBillingEventAt) return ignore('stale');
  await systemDb.subscription.update({
    where: { id: sub.id },
    data: {
      status,
      externalSubscriptionId: event.externalSubscriptionId ?? sub.externalSubscriptionId,
      externalCustomerId: event.externalCustomerId ?? sub.externalCustomerId,
      ...(status === 'ACTIVE'
        ? { currentPeriodStart: new Date(), currentPeriodEnd: event.periodEnd ?? new Date(Date.now() + 30 * DAY) }
        : {}),
      ...(status === 'CANCELED' ? { canceledAt: new Date() } : {}),
      ...(event.occurredAt ? { lastBillingEventAt: event.occurredAt } : {}),
    },
  });
  await audit({ organizationId: sub.organizationId, action: `billing.webhook.${event.type}`, actorType: 'SYSTEM', metadata: { eventId: event.id } });
  return sub.organizationId;
}
