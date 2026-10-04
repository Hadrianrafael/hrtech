import { beforeAll, describe, expect, it } from 'vitest';
import { systemDb } from '@/lib/db';
import { hashToken } from '@/lib/crypto';
import { ForbiddenError, LimitExceededError } from '@/lib/errors';
import { acceptInvitation, authenticate, changeMemberRole, createInvitation, requestPasswordReset, resetPassword } from '@/server/auth-service';
import { getSystemRole } from '@/server/orgs';
import { createOrg, createUser, ctxFor, dbReachable, resetDb } from '../helpers';

const ok = await dbReachable();

describe.skipIf(!ok)('autenticação e convites', () => {
  let orgId: string, adminId: string;
  beforeAll(async () => {
    await resetDb();
    orgId = (await createOrg('Auth Org', { users: 3 })).id;
    adminId = (await createUser('admin@auth.example', orgId)).id;
  });

  it('login com credenciais válidas e inválidas', async () => {
    expect(await authenticate('ADMIN@auth.example', 'Senha1234', null)).toMatchObject({ ok: true, userId: adminId });
    expect(await authenticate('admin@auth.example', 'errada', null)).toMatchObject({ ok: false });
    expect(await authenticate('naoexiste@auth.example', 'x', null)).toMatchObject({ ok: false, error: 'E-mail ou senha inválidos.' });
  });

  it('bloqueia a conta após 5 tentativas falhas', async () => {
    await createUser('lock@auth.example', orgId);
    for (let i = 0; i < 5; i++) await authenticate('lock@auth.example', 'errada', null);
    const r = await authenticate('lock@auth.example', 'Senha1234', null);
    expect(r.ok).toBe(false);
    expect((r as { error: string }).error).toContain('bloqueada');
  });

  it('usuário desativado não consegue entrar', async () => {
    await systemDb.user.update({ where: { email: 'lock@auth.example' }, data: { disabled: true, lockedUntil: null } });
    expect((await authenticate('lock@auth.example', 'Senha1234', null)).ok).toBe(false);
  });

  it('redefinição de senha com token de uso único', async () => {
    const { link } = await requestPasswordReset('admin@auth.example');
    const token = new URL(link!).searchParams.get('token')!;
    await resetPassword(token, 'NovaSenha99');
    expect((await authenticate('admin@auth.example', 'NovaSenha99', null)).ok).toBe(true);
    await expect(resetPassword(token, 'OutraSenha99')).rejects.toThrow('inválido');
    // pedido para e-mail inexistente não revela nada
    expect(await requestPasswordReset('ninguem@auth.example')).toEqual({});
  });

  it('convite cria usuário e vínculo com o papel escolhido', async () => {
    const agentRole = await getSystemRole('agent');
    const { link } = await createInvitation(ctxFor(orgId, adminId), { email: 'novo@auth.example', name: 'Novo', roleId: agentRole.id });
    const token = new URL(link).searchParams.get('token')!;
    const stored = await systemDb.invitation.findFirst({ where: { email: 'novo@auth.example' } });
    expect(stored?.tokenHash).toBe(hashToken(token)); // apenas o hash é armazenado
    const { userId } = await acceptInvitation(token, { name: 'Novo', password: 'Senha1234' });
    const m = await systemDb.membership.findFirst({ where: { userId, organizationId: orgId }, include: { role: true } });
    expect(m?.role.key).toBe('agent');
    await expect(acceptInvitation(token, { password: 'Senha1234' })).rejects.toThrow();
  });

  it('atendente não pode convidar usuários', async () => {
    const agent = await systemDb.user.findUniqueOrThrow({ where: { email: 'novo@auth.example' } });
    const role = await getSystemRole('agent');
    await expect(createInvitation(ctxFor(orgId, agent.id, 'agent'), { email: 'x@auth.example', roleId: role.id })).rejects.toThrow(ForbiddenError);
  });

  it('respeita o limite de usuários do plano', async () => {
    const role = await getSystemRole('agent');
    // 3 membros ativos (admin, lock, novo) = limite atingido
    await expect(createInvitation(ctxFor(orgId, adminId), { email: 'extra@auth.example', roleId: role.id })).rejects.toThrow(LimitExceededError);
  });

  it('administrador não remove o próprio acesso de admin', async () => {
    const m = await systemDb.membership.findFirstOrThrow({ where: { userId: adminId } });
    const role = await getSystemRole('agent');
    await expect(changeMemberRole(ctxFor(orgId, adminId), m.id, role.id)).rejects.toThrow('próprio acesso');
  });
});
