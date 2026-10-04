import { systemCtx } from '@/lib/auth/ctx';
import { systemDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { emitEvent } from './events';
import { syncEmailAccount } from './integrations';
import { applyRetentionPolicies } from './lgpd';
import { retryFailedWebhooks } from './webhooks';

const NO_REPLY_HOURS = 48;
/** Janela de varredura: cobre um dia sem execução do cron (na Vercel Hobby ele roda 1x por dia). */
const LOOKBACK_MS = 48 * 3600000;
const BATCH = 200;
/** A rota tem 60s: o trabalho por empresa para aqui e o restante fica para a próxima execução (tudo é idempotente). */
const TIME_BUDGET_MS = 45_000;

/**
 * Percorre os resultados em páginas pelo id (chave estável: as ações das automações podem alterar as datas usadas
 * no filtro, como lastOutboundAt, sem afetar a paginação). Retorna false se o tempo acabou no meio.
 */
async function forEachPage<T extends { id: string }>(fetchPage: (afterId?: string) => Promise<T[]>, handle: (row: T) => Promise<void>, outOfTime: () => boolean) {
  let afterId: string | undefined;
  for (;;) {
    const page = await fetchPage(afterId);
    for (const row of page) {
      if (outOfTime()) return false;
      await handle(row);
    }
    if (page.length < BATCH) return true;
    afterId = page.at(-1)!.id;
  }
}

/**
 * Rotina periódica (chamar a cada 5–15 min via /api/cron/tick com CRON_SECRET).
 * Todas as etapas são idempotentes: eventos usam chaves determinísticas.
 */
export async function runTick(now = new Date(), opts: { budgetMs?: number } = {}) {
  const startedAt = Date.now();
  const outOfTime = () => Date.now() - startedAt > (opts.budgetMs ?? TIME_BUDGET_MS);
  const summary = { orgs: 0, orgsDeferred: 0, noReply: 0, overdue: 0, emailsImported: 0, webhooksRetried: 0, retentionRemoved: 0, trialsExpired: 0, errors: 0 };

  // Etapas globais primeiro: não podem ficar para trás por causa de uma empresa grande.
  const expired = await systemDb.subscription.updateMany({ where: { status: 'TRIALING', trialEndsAt: { lt: now } }, data: { status: 'PAST_DUE' } });
  summary.trialsExpired = expired.count;
  await systemDb.session.deleteMany({ where: { expiresAt: { lt: now } } });
  summary.webhooksRetried = await retryFailedWebhooks();
  summary.retentionRemoved = await applyRetentionPolicies();

  const orgs = await systemDb.organization.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
  summary.orgs = orgs.length;
  // Ordem embaralhada: se o tempo acabar, as empresas que ficaram para depois variam a cada execução.
  for (let i = orgs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orgs[i], orgs[j]] = [orgs[j]!, orgs[i]!];
  }

  for (const org of orgs) {
    if (outOfTime()) {
      summary.orgsDeferred++;
      continue;
    }
    const ctx = systemCtx(org.id);
    try {
      // Só varre o que alguma automação ativa da empresa vai usar.
      const triggers = new Set(
        (await ctx.db.automation.findMany({ where: { enabled: true, trigger: { in: ['conversation.no_reply', 'task.overdue'] } }, select: { trigger: true } })).map((a) => a.trigger),
      );

      if (triggers.has('conversation.no_reply')) {
        // Lead não respondeu: nossa última mensagem tem mais de 48h e o cliente não voltou.
        const noReplyBefore = new Date(now.getTime() - NO_REPLY_HOURS * 3600000);
        await forEachPage(
          (afterId) =>
            ctx.db.conversation.findMany({
              where: {
                status: { in: ['OPEN', 'PENDING'] },
                awaitingReply: false,
                lastOutboundAt: { lt: noReplyBefore, gte: new Date(noReplyBefore.getTime() - LOOKBACK_MS) },
                ...(afterId ? { id: { gt: afterId } } : {}),
              },
              orderBy: { id: 'asc' },
              take: BATCH,
            }),
          async (c) => {
            if (c.lastInboundAt && c.lastOutboundAt && c.lastInboundAt > c.lastOutboundAt) return;
            await emitEvent(ctx, 'conversation.no_reply', { contactId: c.contactId, conversationId: c.id, channel: c.channel }, { eventKey: `noreply:${c.id}:${c.lastOutboundAt?.getTime()}` });
            summary.noReply++;
          },
          outOfTime,
        );
      }

      if (triggers.has('task.overdue')) {
        // Tarefas que venceram na janela (a chave inclui o prazo: reagendar gera novo aviso).
        await forEachPage(
          (afterId) =>
            ctx.db.task.findMany({
              where: { status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lt: now, gte: new Date(now.getTime() - LOOKBACK_MS) }, ...(afterId ? { id: { gt: afterId } } : {}) },
              orderBy: { id: 'asc' },
              take: BATCH,
            }),
          async (t) => {
            await emitEvent(ctx, 'task.overdue', { contactId: t.contactId, taskId: t.id, title: t.title }, { eventKey: `overdue:${t.id}:${t.dueAt?.getTime()}` });
            summary.overdue++;
          },
          outOfTime,
        );
      }

      const emailIntegrations = await ctx.db.integration.findMany({ where: { type: 'EMAIL', status: 'CONNECTED' }, select: { id: true } });
      for (const i of emailIntegrations) {
        if (outOfTime()) break;
        summary.emailsImported += (await syncEmailAccount(ctx, i.id)).imported;
      }
    } catch (err) {
      summary.errors++;
      logger.error('cron.org_failed', { orgId: org.id, err });
    }
  }
  if (summary.orgsDeferred) logger.warn('cron.time_budget_exhausted', { deferred: summary.orgsDeferred, orgs: summary.orgs });
  return summary;
}
