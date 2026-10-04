import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { randomToken, hashToken } from '../crypto';
import { systemDb } from '../db';
import { env } from '../env';

export const SESSION_COOKIE = 'hrt_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias, renovação deslizante

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || null;
  return { ip, userAgent: h.get('user-agent')?.slice(0, 300) ?? null };
}

/** Cria a sessão no banco (armazenando apenas o hash do token). Retorna o token em claro. */
export async function createSessionRecord(userId: string, activeOrgId: string | null, meta: { ip: string | null; userAgent: string | null }) {
  const token = randomToken(32);
  await systemDb.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      activeOrgId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function findSessionByToken(token: string) {
  const session = await systemDb.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || session.user.disabled) {
    await systemDb.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Renovação deslizante (no máximo 1x por hora).
  if (Date.now() - session.lastSeenAt.getTime() > 60 * 60 * 1000) {
    await systemDb.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
      .catch(() => undefined);
  }
  return session;
}

/** Sessão atual (memoizada por requisição). */
export const getCurrentSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionByToken(token);
});

export async function revokeSession(token: string) {
  await systemDb.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function revokeAllUserSessions(userId: string) {
  await systemDb.session.deleteMany({ where: { userId } });
}
