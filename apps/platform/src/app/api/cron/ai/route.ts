import { NextResponse, type NextRequest } from 'next/server';
import { safeEqual } from '@/lib/crypto';
import { env } from '@/lib/env';
import { errorResponse } from '@/lib/route';
import { runAiWorker } from '@/server/ai-company/worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Worker da Equipe IA: executa tarefas na fila, envia/reenvia chamadas ao n8n, recupera execuções interrompidas,
 * expira aprovações e gera os briefings no horário. Chamar a cada 1–5 min (agendador do n8n, cron externo ou
 * Vercel Cron) com `Authorization: Bearer <CRON_SECRET>`.
 */
async function handler(req: NextRequest) {
  const secret = env.cronSecret();
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET não configurado.' }, { status: 503 });
  if (!safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    return NextResponse.json(await runAiWorker({ budgetMs: 45_000 }));
  } catch (err) {
    return errorResponse(err);
  }
}

export const GET = handler;
export const POST = handler;
