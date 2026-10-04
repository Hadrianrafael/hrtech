import type { Prisma } from '@prisma/client';
import { systemCtx } from '@/lib/auth/ctx';
import { audit } from '@/lib/audit';
import { isUniqueViolation, systemDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { decryptJson } from '@/lib/crypto';
import { fetchInstagramProfile, parseInstagramWebhook, type IgConfig, type IgInboundMessage, type IgSecrets } from './channels/instagram';
import { parseWhatsAppWebhook, type WaInboundMessage, type WaStatusUpdate } from './channels/whatsapp';
import { receiveInbound, updateMessageStatusByExternalId } from './conversations';

/**
 * Processamento de webhooks da Meta.
 * Cada mensagem/status vira um WebhookEvent com chave única → idempotência garantida
 * mesmo quando a Meta reenvia o mesmo evento. Falhas ficam registradas para reprocessamento.
 */

type StoredEvent =
  | { kind: 'wa_message'; data: WaInboundMessage }
  | { kind: 'wa_status'; data: WaStatusUpdate }
  | { kind: 'ig_message'; data: IgInboundMessage };

async function resolveIntegration(type: 'WHATSAPP' | 'INSTAGRAM', externalId: string) {
  const integration = await systemDb.integration.findFirst({
    // Somente integrações verificadas (posse comprovada no teste de conexão) recebem eventos.
    where: { type, externalId, status: 'CONNECTED' },
    include: { organization: { select: { id: true, status: true } } },
  });
  if (!integration || integration.organization.status !== 'ACTIVE') return null;
  return integration;
}

async function handleEvent(ev: StoredEvent): Promise<{ orgId: string | null; ignored?: string }> {
  switch (ev.kind) {
    case 'wa_message': {
      const m = ev.data;
      const integration = await resolveIntegration('WHATSAPP', m.phoneNumberId);
      if (!integration) return { orgId: null, ignored: 'Número não vinculado a uma empresa ativa.' };
      const ctx = systemCtx(integration.organizationId);
      await receiveInbound(ctx, {
        channel: 'WHATSAPP',
        integrationId: integration.id,
        identityExternalId: m.from,
        contactDefaults: { name: m.profileName, phone: m.from },
        body: m.text,
        contentType: m.media ? m.type : 'text',
        media: m.media,
        externalId: m.id,
        receivedAt: m.timestamp,
      });
      await systemDb.integration.update({ where: { id: integration.id }, data: { lastEventAt: new Date() } });
      return { orgId: integration.organizationId };
    }
    case 'wa_status': {
      const s = ev.data;
      const integration = await resolveIntegration('WHATSAPP', s.phoneNumberId);
      if (!integration) return { orgId: null, ignored: 'Número não vinculado.' };
      const map = { sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED' } as const;
      const status = map[s.status as keyof typeof map];
      if (status) await updateMessageStatusByExternalId(systemCtx(integration.organizationId), s.id, status, s.error);
      if (status === 'FAILED') {
        await audit({ organizationId: integration.organizationId, action: 'integration.whatsapp_delivery_failed', severity: 'error', actorType: 'SYSTEM', metadata: { error: s.error } });
      }
      return { orgId: integration.organizationId };
    }
    case 'ig_message': {
      const m = ev.data;
      const integration = await resolveIntegration('INSTAGRAM', m.accountId);
      if (!integration) return { orgId: null, ignored: 'Conta do Instagram não vinculada.' };
      const ctx = systemCtx(integration.organizationId);
      const known = await ctx.db.contactIdentity.findFirst({ where: { channel: 'INSTAGRAM', externalId: m.senderId } });
      let profile: { name?: string; username?: string } | null = null;
      if (!known && integration.secretsEnc) {
        profile = await fetchInstagramProfile(decryptJson<IgSecrets>(integration.secretsEnc)!, integration.config as unknown as IgConfig, m.senderId);
      }
      await receiveInbound(ctx, {
        channel: 'INSTAGRAM',
        integrationId: integration.id,
        identityExternalId: m.senderId,
        contactDefaults: { name: profile?.name ?? (profile?.username ? `@${profile.username}` : 'Contato do Instagram'), instagram: profile?.username ?? null },
        body: m.text,
        contentType: m.attachments.length ? 'attachment' : 'text',
        media: m.attachments.length ? { attachments: m.attachments } : null,
        externalId: m.mid,
        receivedAt: m.timestamp,
      });
      await systemDb.integration.update({ where: { id: integration.id }, data: { lastEventAt: new Date() } });
      return { orgId: integration.organizationId };
    }
  }
}

/** Registra o evento (idempotente). Retorna o id ou null se já recebido. */
async function store(provider: string, eventKey: string, ev: StoredEvent): Promise<{ id: string; ev: StoredEvent } | null> {
  try {
    const record = await systemDb.webhookEvent.create({ data: { provider, eventKey, payload: ev as unknown as Prisma.InputJsonValue } });
    return { id: record.id, ev };
  } catch (err) {
    if (isUniqueViolation(err)) return null;
    throw err;
  }
}

async function runRecord(id: string, ev: StoredEvent) {
  try {
    const r = await handleEvent(ev);
    await systemDb.webhookEvent.update({
      where: { id },
      data: { status: r.ignored ? 'IGNORED' : 'PROCESSED', organizationId: r.orgId, error: r.ignored ?? null, processedAt: new Date(), attempts: { increment: 1 } },
    });
    return r.ignored ? 'ignored' : 'processed';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('webhook.process_failed', { id, err });
    await systemDb.webhookEvent.update({ where: { id }, data: { status: 'FAILED', error: message.slice(0, 1000), attempts: { increment: 1 } } });
    return 'failed';
  }
}

export type StoredRecord = { id: string; ev: StoredEvent };

/**
 * Etapa 1 (síncrona, antes de responder 200 à Meta): persiste cada mensagem/status.
 * Etapa 2 (`runStoredEvents`, pode rodar após a resposta): processa.
 */
export async function ingestWhatsAppWebhook(payload: unknown): Promise<StoredRecord[]> {
  const { messages, statuses } = parseWhatsAppWebhook(payload);
  const out: StoredRecord[] = [];
  for (const m of messages) {
    const r = await store('whatsapp', `msg:${m.id}`, { kind: 'wa_message', data: m });
    if (r) out.push(r);
  }
  for (const s of statuses) {
    const r = await store('whatsapp', `status:${s.id}:${s.status}`, { kind: 'wa_status', data: s });
    if (r) out.push(r);
  }
  return out;
}

export async function ingestInstagramWebhook(payload: unknown): Promise<StoredRecord[]> {
  const out: StoredRecord[] = [];
  for (const m of parseInstagramWebhook(payload)) {
    const r = await store('instagram', `msg:${m.mid}`, { kind: 'ig_message', data: m });
    if (r) out.push(r);
  }
  return out;
}

export async function runStoredEvents(records: StoredRecord[]) {
  const results: string[] = [];
  for (const r of records) results.push(await runRecord(r.id, r.ev));
  return results;
}

/** Atalho síncrono (testes e reprocessamento). */
export async function processWhatsAppWebhook(payload: unknown) {
  return runStoredEvents(await ingestWhatsAppWebhook(payload));
}

export async function processInstagramWebhook(payload: unknown) {
  return runStoredEvents(await ingestInstagramWebhook(payload));
}

/** Reprocessa eventos que falharam (até 3 tentativas) — chamado pelo cron. */
export async function retryFailedWebhooks(limit = 20) {
  const failed = await systemDb.webhookEvent.findMany({
    where: {
      OR: [
        { status: 'FAILED', attempts: { lt: 3 } },
        // eventos gravados mas não processados (ex.: instância encerrada após responder à Meta)
        { status: 'RECEIVED', receivedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
      ],
      provider: { in: ['whatsapp', 'instagram'] },
    },
    orderBy: { receivedAt: 'asc' },
    take: limit,
  });
  for (const f of failed) {
    const ev = f.payload as unknown as StoredEvent;
    if (ev?.kind && ev.data) {
      // datas serializadas em JSON
      if ('timestamp' in ev.data && typeof ev.data.timestamp === 'string') (ev.data as { timestamp: Date }).timestamp = new Date(ev.data.timestamp);
      await runRecord(f.id, ev);
    }
  }
  return failed.length;
}
