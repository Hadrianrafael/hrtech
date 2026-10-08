import { NextResponse, type NextRequest } from 'next/server';
import { readTextLimited } from '@/lib/http-body';
import { errorResponse } from '@/lib/route';
import { handleN8nCallback } from '@/server/ai-company/n8n';

export const dynamic = 'force-dynamic';

const MAX_BODY = 1_000_000;

/** Retorno dos fluxos do n8n (assinado com HMAC; idempotente pelo eventId). */
export async function POST(req: NextRequest) {
  try {
    const raw = await readTextLimited(req, MAX_BODY);
    if (raw === null) return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
    const r = await handleN8nCallback(raw, req.headers.get('x-hrtech-signature'));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json(r);
  } catch (err) {
    return errorResponse(err);
  }
}
