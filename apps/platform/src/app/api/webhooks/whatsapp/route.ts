import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { handleMetaVerification, handleMetaWebhook } from '@/lib/meta-route';
import { ingestWhatsAppWebhook, runStoredEvents } from '@/server/webhooks';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return handleMetaVerification(req, env.whatsappVerifyToken());
}

export function POST(req: NextRequest) {
  return handleMetaWebhook(req, 'whatsapp', ingestWhatsAppWebhook, runStoredEvents);
}
