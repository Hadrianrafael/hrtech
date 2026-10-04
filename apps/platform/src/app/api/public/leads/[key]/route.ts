import { NextResponse, type NextRequest } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, errorResponse } from '@/lib/route';
import { submitLeadForm } from '@/server/webchat';

export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/** Captura de leads de formulários do site do cliente (JSON ou form-urlencoded). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    if (!rateLimit(`pub:lead:${key}:${clientIp(req)}`, 10, 10 * 60_000).ok) return NextResponse.json({ error: 'Muitos envios. Tente novamente mais tarde.' }, { status: 429, headers });
    const type = req.headers.get('content-type') ?? '';
    const raw: Record<string, unknown> = type.includes('application/json')
      ? ((await req.json().catch(() => ({}))) as Record<string, unknown>)
      : Object.fromEntries((await req.formData()).entries());
    const data = {
      ...raw,
      consent: raw.consent === true || raw.consent === 'on' || raw.consent === 'true',
      wantsAppointment: raw.wantsAppointment === true || raw.wantsAppointment === 'on' || raw.wantsAppointment === 'true',
    };
    await submitLeadForm(key, origin, data as never);
    return NextResponse.json({ ok: true, message: 'Recebemos seu contato! Em breve retornaremos.' }, { headers });
  } catch (err) {
    return errorResponse(err, headers);
  }
}
