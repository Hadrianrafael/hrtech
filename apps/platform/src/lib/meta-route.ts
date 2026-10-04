import 'server-only';
import { NextResponse, after, type NextRequest } from 'next/server';
import { audit } from './audit';
import { logger } from './logger';
import { rateLimit } from './rate-limit';
import { clientIp } from './route';
import { env } from './env';
import { verifyMetaSignature } from '@/server/channels/meta';
import type { StoredRecord } from '@/server/webhooks';

/** Verificação do endpoint (GET hub.challenge) exigida pela Meta. */
export function handleMetaVerification(req: NextRequest, verifyToken: string | undefined) {
  const sp = req.nextUrl.searchParams;
  if (sp.get('hub.mode') === 'subscribe' && verifyToken && sp.get('hub.verify_token') === verifyToken) {
    return new NextResponse(sp.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verificação inválida.' }, { status: 403 });
}

/**
 * Recebe webhook da Meta: valida assinatura HMAC (X-Hub-Signature-256), persiste os eventos
 * (idempotência) e processa após responder 200 — a Meta exige resposta rápida.
 */
export async function handleMetaWebhook(
  req: NextRequest,
  provider: string,
  ingest: (payload: unknown) => Promise<StoredRecord[]>,
  run: (records: StoredRecord[]) => Promise<string[]>,
) {
  const ip = clientIp(req);
  if (!rateLimit(`wh:${provider}:${ip}`, 600, 60_000).ok) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  if (!env.metaAppSecret()) {
    logger.error('webhook.meta_secret_missing', { provider });
    return NextResponse.json({ error: 'Webhook não configurado (META_APP_SECRET).' }, { status: 503 });
  }
  const raw = await req.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
  if (!verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'))) {
    await audit({ action: `webhook.${provider}.invalid_signature`, severity: 'warning', actorType: 'SYSTEM', ip });
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  try {
    const records = await ingest(payload);
    if (records.length) after(() => run(records).catch((err) => logger.error('webhook.after_failed', { provider, err })));
    return NextResponse.json({ received: records.length });
  } catch (err) {
    logger.error('webhook.ingest_failed', { provider, err });
    return NextResponse.json({ error: 'Falha temporária.' }, { status: 500 }); // a Meta reenviará
  }
}
