import { NextResponse, type NextRequest } from 'next/server';
import { safeEqual } from '@/lib/crypto';
import { env } from '@/lib/env';
import { errorResponse } from '@/lib/route';
import { runTick } from '@/server/cron';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Rotina periódica: follow-ups, tarefas atrasadas, e-mail (IMAP), retenção LGPD e reprocessamento de webhooks. */
async function handler(req: NextRequest) {
  const secret = env.cronSecret();
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET não configurado.' }, { status: 503 });
  const auth = req.headers.get('authorization') ?? '';
  if (!safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    return NextResponse.json(await runTick());
  } catch (err) {
    return errorResponse(err);
  }
}

export const GET = handler;
export const POST = handler;
