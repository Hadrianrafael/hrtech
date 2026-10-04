import 'server-only';
import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { logger } from './logger';
import { getOrgContext, type OrgContext } from './auth/context';
import type { Permission } from './auth/permissions';

/** Autenticação + autorização para route handlers internos (JSON). */
export async function routeContext(permission?: Permission): Promise<OrgContext | NextResponse> {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (ctx.org.status === 'SUSPENDED' && !ctx.user.isPlatformAdmin) return NextResponse.json({ error: 'Conta suspensa.' }, { status: 403 });
  if (permission && !ctx.permissions.has(permission)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  return ctx;
}

export function errorResponse(err: unknown, headers?: HeadersInit) {
  if (err instanceof AppError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status, headers });
  if (err && typeof err === 'object' && 'name' in err && (err as Error).name === 'ZodError') {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers });
  }
  logger.error('route.unexpected_error', { err });
  return NextResponse.json({ error: 'Erro interno.' }, { status: 500, headers });
}

export function clientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim();
}
