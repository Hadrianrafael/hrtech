import { NextResponse, type NextRequest } from 'next/server';
import { readTextLimited } from '@/lib/http-body';
import { errorResponse } from '@/lib/route';
import { handleN8nCommand } from '@/server/ai-company/commands';

export const dynamic = 'force-dynamic';

/** Comandos para o CEO Agent enviados pelo n8n (assinados com HMAC; idempotentes pelo eventId). */
export async function POST(req: NextRequest) {
  try {
    const raw = await readTextLimited(req, 50_000);
    if (raw === null) return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
    const r = await handleN8nCommand(raw, req.headers.get('x-hrtech-signature'));
    return NextResponse.json(r.body, { status: r.status });
  } catch (err) {
    return errorResponse(err);
  }
}
