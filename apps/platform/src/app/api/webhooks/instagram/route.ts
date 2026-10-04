import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { handleMetaVerification, handleMetaWebhook } from '@/lib/meta-route';
import { ingestInstagramWebhook, runStoredEvents } from '@/server/webhooks';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return handleMetaVerification(req, env.instagramVerifyToken());
}

export function POST(req: NextRequest) {
  return handleMetaWebhook(req, 'instagram', ingestInstagramWebhook, runStoredEvents);
}
