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

/**
 * Registra uma falha de login de forma atômica (sem corrida entre requisições concorrentes) e bloqueia a conta
 * por LOCK_MINUTES ao atingir MAX_FAILED. Nunca remove um bloqueio existente.
 */
async function registerLoginFailure(userId: string) {
  const rows = await systemDb.$queryRaw<{ failedLogins: number; lockedUntil: Date | null }[]>`
    UPDATE "User" SET
      "failedLogins" = CASE WHEN "failedLogins" + 1 >= ${MAX_FAILED}::int THEN 0 ELSE "failedLogins" + 1 END,
      "lockedUntil" = CASE WHEN "failedLogins" + 1 >= ${MAX_FAILED}::int THEN now() + make_interval(mins => ${LOCK_MINUTES}::int) ELSE "lockedUntil" END
    WHERE id = ${userId}
    RETURNING "failedLogins", "lockedUntil"`;
  return rows[0];
}

/**
 * Valida credenciais com bloqueio após tentativas falhas. Para não revelar se um e-mail existe, a resposta é a
 * mesma para e-mail inexistente e senha errada; "desativado"/"bloqueado" só são informados após a senha correta.
 */
export async function authenticate(emailRaw: string, password: string, ip: string | null): Promise<AuthResult> {
  const email = normalizeEmail(emailRaw);
  const generic = 'E-mail ou senha inválidos.';
  if (!email) {
    await verifyPassword(password, null); // tempo constante
    return { ok: false, error: generic };
  }
  const user = await systemDb.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) {
    if (user) {
      const r = await registerLoginFailure(user.id);
      await audit({ actorUserId: user.id, action: 'auth.login_failed', severity: 'warning', ip, metadata: { locked: !!r?.lockedUntil && r.lockedUntil > new Date() } });
    }
    return { ok: false, error: generic };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: 'Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em alguns minutos.' };
  }
  if (user.disabled) return { ok: false, error: 'Usuário desativado. Contate o administrador.' };
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

/** Troca a senha e encerra todas as outras sessões do usuário (mantém apenas a sessão atual, se informada). */
export async function changePassword(userId: string, current: string, next: string, keepSessionId?: string) {
  const user = await systemDb.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) throw new AppError('Senha atual incorreta.');
  await systemDb.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  await systemDb.session.deleteMany({ where: { userId, ...(keepSessionId ? { NOT: { id: keepSessionId } } : {}) } });
  await audit({ actorUserId: userId, action: 'auth.password_changed' });
}

// ─────────────── Delegação segura de permissões ───────────────

/** Ninguém pode conceder (a si ou a outros) permissões que não possui. */
export function assertGrantable(ctx: ServiceCtx, permissions: string[]) {
  const missing = permissions.filter((p) => !ctx.permissions.has(p as never));
  if (missing.length) throw new ForbiddenError('Você não pode conceder permissões que não possui.');
}

/** Impede que a organização fique sem nenhum administrador ativo. */
async function assertNotLastAdmin(ctx: ServiceCtx, membershipId: string) {
  const others = await ctx.db.membership.count({ where: { status: 'ACTIVE', role: { key: 'org_admin' }, NOT: { id: membershipId } } });
  if (others === 0) throw new AppError('A empresa precisa de pelo menos um administrador ativo.');
}

// ─────────────── Convites ───────────────

export async function createInvitation(ctx: ServiceCtx, input: { email: string; name?: string | null; roleId: string }) {
  assertCan(ctx, 'team.manage');
  const email = normalizeEmail(input.email);
  if (!email) throw new AppError('E-mail inválido.');
  const role = await ctx.db.role.findFirst({ where: { id: input.roleId } });
  if (!role) throw new NotFoundError('Papel não encontrado.');
  assertGrantable(ctx, role.permissions);
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
  // O link só é devolvido a quem convidou quando o e-mail não pôde ser enviado (SMTP ausente).
  return { invitation, link: delivered ? null : link, delivered };
}

export async function getInvitationByToken(token: string) {
  const inv = await systemDb.invitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { organization: true, role: true } });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt < new Date()) return null;
  const existingUser = await systemDb.user.findUnique({ where: { email: inv.email }, select: { id: true } });
  return { ...inv, userExists: !!existingUser };
}

async function linkMembership(inv: { id: string; organizationId: string; roleId: string }, userId: string) {
  await withSystem(async (tx) => {
    await tx.membership.upsert({
      where: { userId_organizationId: { userId, organizationId: inv.organizationId } },
      create: { userId, organizationId: inv.organizationId, roleId: inv.roleId },
      update: { roleId: inv.roleId, status: 'ACTIVE' },
    });
    await tx.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
  });
  await audit({ organizationId: inv.organizationId, actorUserId: userId, action: 'team.invitation_accepted', entityType: 'Invitation', entityId: inv.id });
}

/**
 * Aceita convite criando uma conta NOVA. Para e-mails que já possuem conta, a pessoa precisa entrar normalmente
 * (com bloqueio por tentativas) e aceitar com a sessão — ver acceptInvitationAsUser. Assim o convite não vira um
 * canal para testar senhas de contas existentes.
 */
export async function acceptInvitation(token: string, input: { name?: string; password: string }) {
  const inv = await getInvitationByToken(token);
  if (!inv) throw new AppError('Convite inválido ou expirado.');
  if (inv.userExists) throw new AppError('Este e-mail já possui conta: entre com seu login para aceitar o convite.');
  const user = await systemDb.user.create({
    data: { email: inv.email, name: input.name?.trim() || inv.name || inv.email.split('@')[0]!, passwordHash: await hashPassword(input.password) },
  });
  await linkMembership(inv, user.id);
  return { userId: user.id, organizationId: inv.organizationId };
}

/** Aceita convite com a sessão de um usuário já autenticado, cujo e-mail deve ser o do convite. */
export async function acceptInvitationAsUser(token: string, userId: string) {
  const inv = await getInvitationByToken(token);
  if (!inv) throw new AppError('Convite inválido ou expirado.');
  const user = await systemDb.user.findUnique({ where: { id: userId } });
  if (!user || user.disabled) throw new ForbiddenError();
  if (user.email !== inv.email) throw new ForbiddenError(`Este convite é para ${inv.email}. Entre com essa conta para aceitá-lo.`);
  await linkMembership(inv, user.id);
  return { userId: user.id, organizationId: inv.organizationId };
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
  if (m.userId === ctx.userId) throw new AppError('Você não pode alterar o próprio papel. Peça a outro administrador.');
  assertGrantable(ctx, m.role.permissions); // não altera quem tem mais permissões que você
  assertGrantable(ctx, role.permissions); // nem concede o que você não tem
  if (m.role.key === 'org_admin' && role.key !== 'org_admin') await assertNotLastAdmin(ctx, m.id);
  await ctx.db.membership.update({ where: { id: membershipId }, data: { roleId } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'team.role_changed', entityType: 'Membership', entityId: membershipId, severity: 'warning', metadata: { from: m.role.key, to: role.key, userId: m.userId } });
}

export async function setMemberStatus(ctx: ServiceCtx, membershipId: string, status: 'ACTIVE' | 'DISABLED') {
  assertCan(ctx, 'team.manage');
  const m = await ctx.db.membership.findFirst({ where: { id: membershipId }, include: { role: true } });
  if (!m) throw new NotFoundError('Membro não encontrado.');
  if (m.userId === ctx.userId) throw new AppError('Você não pode desativar o próprio acesso.');
  assertGrantable(ctx, m.role.permissions);
  if (status === 'DISABLED' && m.role.key === 'org_admin') await assertNotLastAdmin(ctx, m.id);
  if (status === 'ACTIVE') await assertWithinLimit(ctx, 'users');
  await ctx.db.membership.update({ where: { id: membershipId }, data: { status } });
  if (status === 'DISABLED') await systemDb.session.updateMany({ where: { userId: m.userId, activeOrgId: ctx.orgId }, data: { activeOrgId: null } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: status === 'DISABLED' ? 'team.member_disabled' : 'team.member_enabled', entityType: 'Membership', entityId: membershipId, severity: 'warning' });
}
