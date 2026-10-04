import { NextResponse, type NextRequest } from 'next/server';
import { isUniqueViolation, systemDb } from '@/lib/db';
import { errorResponse } from '@/lib/route';
import { getBillingProvider } from '@/server/billing/provider';
import { applyBillingEvent } from '@/server/billing/subscriptions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: key } = await params;
  if (!['stripe', 'asaas'].includes(key)) return NextResponse.json({ error: 'Provedor desconhecido.' }, { status: 404 });
  try {
    const provider = getBillingProvider(key);
    const raw = await req.text();
    const event = await provider.parseWebhook(raw, req.headers);
    if (!event) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    try {
      await systemDb.webhookEvent.create({ data: { provider: `billing:${key}`, eventKey: event.id, organizationId: event.organizationId ?? null, payload: { type: event.type }, status: 'PROCESSED', processedAt: new Date() } });
    } catch (err) {
      if (isUniqueViolation(err)) return NextResponse.json({ duplicate: true });
      throw err;
    }
    await applyBillingEvent(event);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
