'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { actionError, runAction, type ActionResult } from '@/lib/action';
import { audit } from '@/lib/audit';
import { getUser } from '@/lib/auth/context';
import { passwordSchema } from '@/lib/auth/password';
import { clearSessionCookie, createSessionRecord, requestMeta, revokeSession, setSessionCookie, SESSION_COOKIE } from '@/lib/auth/session';
import { systemDb } from '@/lib/db';
import { AppError, ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { assertRateLimit } from '@/lib/rate-limit';
import { cookies } from 'next/headers';
import { acceptInvitation, acceptInvitationAsUser, authenticate, changePassword, requestPasswordReset, resetPassword } from '@/server/auth-service';

function safeNext(next: unknown) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

async function startSession(userId: string, preferredOrgId: string | null = null) {
  const meta = await requestMeta();
  const user = await systemDb.user.findUniqueOrThrow({ where: { id: userId } });
  const membership = preferredOrgId
    ? await systemDb.membership.findFirst({ where: { userId, organizationId: preferredOrgId, status: 'ACTIVE' } })
    : await systemDb.membership.findFirst({ where: { userId, status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } });
  const token = await createSessionRecord(userId, membership?.organizationId ?? null, meta);
  await setSessionCookie(token);
  await audit({ organizationId: membership?.organizationId ?? null, actorUserId: userId, action: 'auth.login', ip: meta.ip });
  return { user, membership };
}

const loginSchema = z.object({ email: z.string().trim().min(1, 'Informe o e-mail.'), password: z.string().min(1, 'Informe a senha.'), next: z.string().optional() });

export async function loginAction(form: FormData): Promise<ActionResult> {
  const result = await runAction(loginSchema, form, async (data) => {
    const { ip } = await requestMeta();
    assertRateLimit(`login:${ip}`, 20, 5 * 60_000);
    assertRateLimit(`login:${data.email.toLowerCase()}`, 8, 5 * 60_000);
    const auth = await authenticate(data.email, data.password, ip);
    if (!auth.ok) throw new AppError(auth.error);
    const { user, membership } = await startSession(auth.userId);
    return safeNext(data.next) ?? (!membership && user.isPlatformAdmin ? '/admin' : '/dashboard');
  });
  if (result.ok) redirect(result.data);
  return result as ActionResult;
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const auth = await getUser();
  if (token) await revokeSession(token);
  await clearSessionCookie();
  if (auth) await audit({ actorUserId: auth.user.id, action: 'auth.logout' });
  redirect('/login');
}

export async function forgotPasswordAction(form: FormData): Promise<ActionResult<{ devLink?: string }>> {
  return runAction(z.object({ email: z.string().trim().email('E-mail inválido.') }), form, async ({ email }) => {
    const { ip } = await requestMeta();
    assertRateLimit(`forgot:${ip}`, 5, 15 * 60_000);
    const r = await requestPasswordReset(email);
    return { devLink: r.link };
  });
}

const resetSchema = z
  .object({ token: z.string().min(10), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem.', path: ['confirm'] });

export async function resetPasswordAction(form: FormData): Promise<ActionResult> {
  const r = await runAction(resetSchema, form, async (d) => {
    const { ip } = await requestMeta();
    assertRateLimit(`reset:${ip}`, 10, 15 * 60_000);
    await resetPassword(d.token, d.password);
  });
  if (r.ok) redirect('/login?reset=1');
  return r;
}

const acceptSchema = z.object({ token: z.string().min(10), name: z.string().trim().max(120).optional(), password: passwordSchema });

/** Convite para e-mail SEM conta: cria a conta com a senha escolhida e entra na empresa. */
export async function acceptInviteAction(form: FormData): Promise<ActionResult> {
  const r = await runAction(acceptSchema, form, async (d) => {
    const { ip } = await requestMeta();
    assertRateLimit(`invite:${ip}`, 10, 15 * 60_000);
    const { userId, organizationId } = await acceptInvitation(d.token, { name: d.name, password: d.password });
    await startSession(userId, organizationId);
  });
  if (r.ok) redirect('/dashboard');
  return r;
}

/** Convite para e-mail que JÁ tem conta: aceito com a sessão atual (o login normal aplica o bloqueio por tentativas). */
export async function acceptInviteAsUserAction(token: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { ok: false, error: new UnauthorizedError().message };
  try {
    const { organizationId } = await acceptInvitationAsUser(token, auth.user.id);
    await systemDb.session.update({ where: { id: auth.session.id }, data: { activeOrgId: organizationId } });
  } catch (err) {
    return actionError(err);
  }
  redirect('/dashboard');
}

export async function switchOrganizationAction(organizationId: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { ok: false, error: new UnauthorizedError().message };
  const membership = await systemDb.membership.findFirst({ where: { userId: auth.user.id, organizationId, status: 'ACTIVE' } });
  if (!membership && !auth.user.isPlatformAdmin) return { ok: false, error: new ForbiddenError().message };
  const org = await systemDb.organization.findUnique({ where: { id: organizationId } });
  if (!org) return { ok: false, error: 'Organização não encontrada.' };
  await systemDb.session.update({ where: { id: auth.session.id }, data: { activeOrgId: organizationId } });
  if (!membership) {
    await audit({ organizationId, actorUserId: auth.user.id, action: 'admin.support_access', severity: 'warning', metadata: { org: org.name } });
  }
  redirect('/dashboard');
}

const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Informe a senha atual.'), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem.', path: ['confirm'] });

export async function changePasswordAction(form: FormData): Promise<ActionResult> {
  return runAction(
    changePasswordSchema,
    form,
    async (d) => {
      const auth = await getUser();
      if (!auth) throw new UnauthorizedError();
      await changePassword(auth.user.id, d.current, d.password, auth.session.id); // encerra as demais sessões
    },
    'Senha alterada. Outras sessões abertas foram encerradas.',
  );
}

const profileSchema = z.object({ name: z.string().trim().min(1, 'Nome obrigatório.').max(120) });
export async function updateProfileAction(form: FormData): Promise<ActionResult> {
  return runAction(
    profileSchema,
    form,
    async (d) => {
      const auth = await getUser();
      if (!auth) throw new UnauthorizedError();
      await systemDb.user.update({ where: { id: auth.user.id }, data: { name: d.name } });
    },
    'Perfil atualizado.',
  );
}
