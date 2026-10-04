import { audit } from '@/lib/audit';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { ServiceCtx } from '@/lib/auth/ctx';
import { assertCan } from '@/lib/auth/ctx';
import { randomToken, hashToken } from '@/lib/crypto';
import { systemDb, withSystem } from '@/lib/db';
import { env } from '@/lib/env';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { sendTransactionalMail } from '@/lib/mailer';
import { normalizeEmail } from '@/lib/utils';
import { assertWithinLimit } from './billing/limits';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const RESET_TTL_MS = 60 * 60 * 1000;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthResult = { ok: true; userId: string } | { ok: false; error: string };

/** Valida credenciais com bloqueio progressivo após tentativas falhas. */
export async function authenticate(emailRaw: string, password: string, ip: string | null): Promise<AuthResult> {
  const email = normalizeEmail(emailRaw);
  const generic = 'E-mail ou senha inválidos.';
  if (!email) return { ok: false, error: generic };
  const user = await systemDb.user.findUnique({ where: { email } });
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em alguns minutos.` };
  }
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid || user.disabled) {
    if (user && !user.disabled) {
      const failed = user.failedLogins + 1;
      await systemDb.user.update({
        where: { id: user.id },
        data: { failedLogins: failed >= MAX_FAILED ? 0 : failed, lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60000) : null },
      });
      await audit({ actorUserId: user.id, action: 'auth.login_failed', severity: 'warning', ip, metadata: { failed } });
    }
    return { ok: false, error: user?.disabled ? 'Usuário desativado. Contate o administrador.' : generic };
  }
  await systemDb.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  return { ok: true, userId: user.id };
}

export async function requestPasswordReset(emailRaw: string): Promise<{ link?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email) return {};
  const user = await systemDb.user.findUnique({ where: { email } });
  if (!user || user.disabled) return {}; // não revela se o e-mail existe
  const token = randomToken(32);
  await systemDb.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } });
  const link = `${env.appUrl()}/reset-password?token=${token}`;
  const { delivered } = await sendTransactionalMail({
    to: user.email,
    subject: 'Redefinição de senha — HR Tech',
    text: `Olá, ${user.name}.\n\nPara redefinir sua senha, acesse: ${link}\n\nO link expira em 1 hora. Se você não solicitou, ignore este e-mail.`,
  });
  await audit({ actorUserId: user.id, action: 'auth.password_reset_requested' });
  // Em desenvolvimento sem SMTP, o link é devolvido para facilitar testes locais.
  return !delivered && !env.isProd ? { link } : {};
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await systemDb.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) throw new AppError('Link inválido ou expirado. Solicite uma nova redefinição.');
  const passwordHash = await hashPassword(newPassword);
  await withSystem(async (tx) => {
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
    await tx.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: record.userId } }); // encerra sessões antigas
  });
  await audit({ actorUserId: record.userId, action: 'auth.password_reset' });
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await systemDb.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) throw new AppError('Senha atual incorreta.');
  await systemDb.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  await audit({ actorUserId: userId, action: 'auth.password_changed' });
}

// ─────────────── Convites ───────────────

export async function createInvitation(ctx: ServiceCtx, input: { email: string; name?: string | null; roleId: string }) {
  assertCan(ctx, 'team.manage');
  const email = normalizeEmail(input.email);
  if (!email) throw new AppError('E-mail inválido.');
  const role = await ctx.db.role.findFirst({ where: { id: input.roleId } });
  if (!role) throw new NotFoundError('Papel não encontrado.');
  const existingUser = await systemDb.user.findUnique({ where: { email } });
  if (existingUser) {
    const member = await ctx.db.membership.findFirst({ where: { userId: existingUser.id } });
    if (member) throw new AppError('Este usuário já faz parte da equipe.');
  }
  await assertWithinLimit(ctx, 'users');
  await ctx.db.invitation.updateMany({ where: { email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
  const token = randomToken(32);
  const invitation = await ctx.db.invitation.create({
    data: {
      organizationId: ctx.orgId,
      email,
      name: input.name ?? null,
      roleId: role.id,
      tokenHash: hashToken(token),
      invitedById: ctx.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  const org = await ctx.db.organization.findFirstOrThrow({});
  const link = `${env.appUrl()}/accept-invite?token=${token}`;
  const { delivered } = await sendTransactionalMail({
    to: email,
    subject: `Convite para ${org.name} — HR Tech`,
    text: `Você foi convidado(a) para a equipe ${org.name} na plataforma HR Tech como ${role.name}.\n\nAceite o convite: ${link}\n\nO link expira em 7 dias.`,
  });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'team.invitation_created', entityType: 'Invitation', entityId: invitation.id, metadata: { role: role.key } });
  return { invitation, link, delivered };
}

export async function getInvitationByToken(token: string) {
  const inv = await systemDb.invitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { organization: true, role: true } });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt < new Date()) return null;
  const existingUser = await systemDb.user.findUnique({ where: { email: inv.email }, select: { id: true } });
  return { ...inv, userExists: !!existingUser };
}

/** Aceita convite: cria o usuário (ou vincula um existente após validar a senha) e a associação. */
export async function acceptInvitation(token: string, input: { name?: string; password: string }) {
  const inv = await getInvitationByToken(token);
  if (!inv) throw new AppError('Convite inválido ou expirado.');
  let user = await systemDb.user.findUnique({ where: { email: inv.email } });
  if (user) {
    if (!(await verifyPassword(input.password, user.passwordHash))) throw new ForbiddenError('Senha incorreta para a conta existente.');
  } else {
    user = await systemDb.user.create({
      data: { email: inv.email, name: input.name?.trim() || inv.name || inv.email.split('@')[0]!, passwordHash: await hashPassword(input.password) },
    });
  }
  const userId = user.id;
  await withSystem(async (tx) => {
    await tx.membership.upsert({
      where: { userId_organizationId: { userId, organizationId: inv.organizationId } },
      create: { userId, organizationId: inv.organizationId, roleId: inv.roleId },
      update: { roleId: inv.roleId, status: 'ACTIVE' },
    });
    await tx.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
  });
  await audit({ organizationId: inv.organizationId, actorUserId: userId, action: 'team.invitation_accepted', entityType: 'Invitation', entityId: inv.id });
  return { userId, organizationId: inv.organizationId };
}

export async function revokeInvitation(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'team.manage');
  await ctx.db.invitation.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'team.invitation_revoked', entityType: 'Invitation', entityId: id });
}

export async function changeMemberRole(ctx: ServiceCtx, membershipId: string, roleId: string) {
  assertCan(ctx, 'team.manage');
  const role = await ctx.db.role.findFirst({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Papel não encontrado.');
  const m = await ctx.db.membership.findFirst({ where: { id: membershipId }, include: { role: true } });
  if (!m) throw new NotFoundError('Membro não encontrado.');
  if (m.userId === ctx.userId && role.key !== 'org_admin') throw new AppError('Você não pode remover seu próprio acesso de administrador.');
  await ctx.db.membership.update({ where: { id: membershipId }, data: { roleId } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'team.role_changed', entityType: 'Membership', entityId: membershipId, severity: 'warning', metadata: { from: m.role.key, to: role.key, userId: m.userId } });
}

export async function setMemberStatus(ctx: ServiceCtx, membershipId: string, status: 'ACTIVE' | 'DISABLED') {
  assertCan(ctx, 'team.manage');
  const m = await ctx.db.membership.findFirst({ where: { id: membershipId } });
  if (!m) throw new NotFoundError('Membro não encontrado.');
  if (m.userId === ctx.userId) throw new AppError('Você não pode desativar o próprio acesso.');
  if (status === 'ACTIVE') await assertWithinLimit(ctx, 'users');
  await ctx.db.membership.update({ where: { id: membershipId }, data: { status } });
  if (status === 'DISABLED') await systemDb.session.updateMany({ where: { userId: m.userId, activeOrgId: ctx.orgId }, data: { activeOrgId: null } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: status === 'DISABLED' ? 'team.member_disabled' : 'team.member_enabled', entityType: 'Membership', entityId: membershipId, severity: 'warning' });
}
