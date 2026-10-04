import { systemCtx } from '@/lib/auth/ctx';
import { systemDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { emitEvent } from './events';
import { syncEmailAccount } from './integrations';
import { applyRetentionPolicies } from './lgpd';
import { retryFailedWebhooks } from './webhooks';

const NO_REPLY_HOURS = 48;

/**
 * Rotina periódica (chamar a cada 5–15 min via /api/cron/tick com CRON_SECRET).
 * Todas as etapas são idempotentes: eventos usam chaves determinísticas.
 */
export async function runTick(now = new Date()) {
  const summary = { orgs: 0, noReply: 0, overdue: 0, emailsImported: 0, webhooksRetried: 0, retentionRemoved: 0, trialsExpired: 0, errors: 0 };
  const orgs = await systemDb.organization.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
  summary.orgs = orgs.length;

  for (const org of orgs) {
    const ctx = systemCtx(org.id);
    try {
      // Lead não respondeu: nossa última mensagem tem mais de 48h e o cliente não voltou.
      const stale = await ctx.db.conversation.findMany({
        where: {
          status: { in: ['OPEN', 'PENDING'] },
          awaitingReply: false,
          lastOutboundAt: { lt: new Date(now.getTime() - NO_REPLY_HOURS * 3600000), gt: new Date(now.getTime() - 14 * 86400000) },
        },
        take: 200,
      });
      for (const c of stale) {
        if (c.lastInboundAt && c.lastOutboundAt && c.lastInboundAt > c.lastOutboundAt) continue;
        await emitEvent(ctx, 'conversation.no_reply', { contactId: c.contactId, conversationId: c.id, channel: c.channel }, { eventKey: `noreply:${c.id}:${c.lastOutboundAt?.getTime()}` });
        summary.noReply++;
      }

      const overdue = await ctx.db.task.findMany({ where: { status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lt: now } }, take: 200 });
      for (const t of overdue) {
        await emitEvent(ctx, 'task.overdue', { contactId: t.contactId, taskId: t.id, title: t.title }, { eventKey: `overdue:${t.id}:${t.dueAt?.getTime()}` });
        summary.overdue++;
      }

      const emailIntegrations = await ctx.db.integration.findMany({ where: { type: 'EMAIL', status: 'CONNECTED' }, select: { id: true } });
      for (const i of emailIntegrations) summary.emailsImported += (await syncEmailAccount(ctx, i.id)).imported;
    } catch (err) {
      summary.errors++;
      logger.error('cron.org_failed', { orgId: org.id, err });
    }
  }

  const expired = await systemDb.subscription.updateMany({ where: { status: 'TRIALING', trialEndsAt: { lt: now } }, data: { status: 'PAST_DUE' } });
  summary.trialsExpired = expired.count;
  summary.webhooksRetried = await retryFailedWebhooks();
  summary.retentionRemoved = await applyRetentionPolicies();
  await systemDb.session.deleteMany({ where: { expiresAt: { lt: now } } });
  return summary;
}
