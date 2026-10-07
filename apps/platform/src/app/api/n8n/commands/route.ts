import { NextResponse, type NextRequest } from 'next/server';
import { errorResponse } from '@/lib/route';
import { handleN8nCommand } from '@/server/ai-company/commands';

export const dynamic = 'force-dynamic';

/** Comandos para o CEO Agent enviados pelo n8n (assinados com HMAC; idempotentes pelo eventId). */
export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get('content-length') ?? 0) > 50_000) return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
    const raw = await req.text();
    if (raw.length > 50_000) return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
    const r = await handleN8nCommand(raw, req.headers.get('x-hrtech-signature'));
    return NextResponse.json(r.body, { status: r.status });
  } catch (err) {
    return errorResponse(err);
  }
}
