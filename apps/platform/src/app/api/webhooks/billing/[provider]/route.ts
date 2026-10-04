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
    // Registra como RECEIVED e só marca PROCESSED depois de aplicar: se a aplicação falhar, o provedor reenvia e o
    // evento é aplicado na nova tentativa (em vez de ser descartado como duplicado).
    const provider_ = `billing:${key}`;
    let record;
    try {
      record = await systemDb.webhookEvent.create({ data: { provider: provider_, eventKey: event.id, organizationId: event.organizationId ?? null, payload: { type: event.type }, status: 'RECEIVED' } });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Reentrega: só reaplica se a tentativa anterior falhou (ou ficou presa há mais de 5 min). A reivindicação é
      // atômica, então duas entregas simultâneas do mesmo evento não aplicam duas vezes.
      const claimed = await systemDb.webhookEvent.updateMany({
        where: { provider: provider_, eventKey: event.id, OR: [{ status: 'FAILED' }, { status: 'RECEIVED', receivedAt: { lt: new Date(Date.now() - 5 * 60_000) } }] },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      });
      if (!claimed.count) return NextResponse.json({ duplicate: true });
      record = await systemDb.webhookEvent.findUniqueOrThrow({ where: { provider_eventKey: { provider: provider_, eventKey: event.id } } });
    }
    try {
      const organizationId = await applyBillingEvent(event);
      await systemDb.webhookEvent.update({ where: { id: record.id }, data: { status: 'PROCESSED', processedAt: new Date(), organizationId: organizationId ?? null, attempts: { increment: 1 }, error: null } });
    } catch (err) {
      await systemDb.webhookEvent
        .update({ where: { id: record.id }, data: { status: 'FAILED', attempts: { increment: 1 }, error: err instanceof Error ? err.message.slice(0, 500) : 'erro' } })
        .catch(() => undefined);
      throw err;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
