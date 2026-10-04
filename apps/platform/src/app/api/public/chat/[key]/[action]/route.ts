import { NextResponse, type NextRequest } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, errorResponse } from '@/lib/route';
import {
  getPublicChatbot, getVisitorMessages, postVisitorMessage, publicConfig, requestHumanFromWidget, startVisitorSession,
} from '@/server/webchat';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ key: string; action: string }> };

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/** Limite por IP e chave pública. */
function limited(req: NextRequest, key: string, bucket: string, limit: number, windowMs: number) {
  return !rateLimit(`pub:${bucket}:${key}:${clientIp(req)}`, limit, windowMs).ok;
}

/** Teto global por chatbot (todas as origens), contra abuso distribuído que esgotaria cotas da empresa. */
function globallyLimited(key: string, bucket: string, limit: number) {
  return !rateLimit(`pub-global:${bucket}:${key}`, limit, 60 * 60_000).ok;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { key, action } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    if (limited(req, key, 'get', 120, 60_000)) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429, headers });
    if (action === 'config') return NextResponse.json(publicConfig(await getPublicChatbot(key, origin)), { headers });
    if (action === 'messages') {
      const token = req.headers.get('x-visitor-token') ?? '';
      return NextResponse.json(await getVisitorMessages(key, origin, token, req.nextUrl.searchParams.get('after')), { headers });
    }
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 404, headers });
  } catch (err) {
    return errorResponse(err, headers);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { key, action } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const token = req.headers.get('x-visitor-token') ?? '';
    switch (action) {
      case 'start':
        if (limited(req, key, 'start', 10, 10 * 60_000) || globallyLimited(key, 'start', 200)) {
          return NextResponse.json({ error: 'Muitas sessões iniciadas. Aguarde alguns minutos.' }, { status: 429, headers });
        }
        return NextResponse.json(await startVisitorSession(key, origin, body), { headers });
      case 'messages':
        if (limited(req, key, 'msg', 30, 60_000) || globallyLimited(key, 'msg', 2000)) {
          return NextResponse.json({ error: 'Você está enviando mensagens rápido demais.' }, { status: 429, headers });
        }
        return NextResponse.json(await postVisitorMessage(key, origin, token, String(body.text ?? ''), (body.after as string) ?? null), { headers });
      case 'human':
        if (limited(req, key, 'human', 5, 10 * 60_000)) return NextResponse.json({ error: 'Aguarde um instante.' }, { status: 429, headers });
        return NextResponse.json(await requestHumanFromWidget(key, origin, token), { headers });
      default:
        return NextResponse.json({ error: 'Ação inválida.' }, { status: 404, headers });
    }
  } catch (err) {
    return errorResponse(err, headers);
  }
}
