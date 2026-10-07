import { beforeAll, describe, expect, it } from 'vitest';
import { systemDb } from '@/lib/db';
import { hashToken } from '@/lib/crypto';
import { ForbiddenError, LimitExceededError } from '@/lib/errors';
import { acceptInvitation, acceptInvitationAsUser, authenticate, changeMemberRole, changePassword, createInvitation, requestPasswordReset, resetPassword } from '@/server/auth-service';
import { createSessionRecord, findSessionByToken } from '@/lib/auth/session';
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

  it('erro genérico para senha errada (não revela bloqueio nem existência da conta)', async () => {
    await createUser('enum@auth.example', null);
    const wrong = await authenticate('enum@auth.example', 'errada', null);
    const unknown = await authenticate('fantasma@auth.example', 'errada', null);
    expect(wrong).toEqual(unknown);
    await systemDb.user.update({ where: { email: 'enum@auth.example' }, data: { disabled: true } });
    expect(await authenticate('enum@auth.example', 'errada', null)).toEqual(unknown);
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
    expect(link).toBeTruthy(); // sem SMTP configurado, o link volta para quem convidou
    const token = new URL(link!).searchParams.get('token')!;
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

  it('administrador não altera o próprio papel', async () => {
    const m = await systemDb.membership.findFirstOrThrow({ where: { userId: adminId } });
    const role = await getSystemRole('agent');
    await expect(changeMemberRole(ctxFor(orgId, adminId), m.id, role.id)).rejects.toThrow('próprio papel');
  });

  it('ninguém concede permissões que não possui (convite, troca de papel)', async () => {
    const org2 = (await createOrg('Escalada Org')).id;
    const admin2 = await createUser('admin@escalada.example', org2);
    const manager = await createUser('gestor@escalada.example', org2, 'manager');
    const agent = await createUser('atendente@escalada.example', org2, 'agent');
    // gestor com team.manage (papel personalizado) ainda não pode convidar administradores nem promover alguém a admin
    const managerCtx = ctxFor(org2, manager.id, 'manager');
    managerCtx.permissions.add('team.manage');
    const adminRole = await getSystemRole('org_admin');
    await expect(createInvitation(managerCtx, { email: 'x@escalada.example', roleId: adminRole.id })).rejects.toThrow(ForbiddenError);
    const agentMembership = await systemDb.membership.findFirstOrThrow({ where: { userId: agent.id } });
    await expect(changeMemberRole(managerCtx, agentMembership.id, adminRole.id)).rejects.toThrow(ForbiddenError);
    // nem rebaixa quem tem mais permissões
    const adminMembership = await systemDb.membership.findFirstOrThrow({ where: { userId: admin2.id } });
    await expect(changeMemberRole(managerCtx, adminMembership.id, (await getSystemRole('agent')).id)).rejects.toThrow(ForbiddenError);
  });

  it('convite para e-mail que já tem conta exige login com essa conta', async () => {
    const other = (await createOrg('Outra Org')).id;
    const existing = await createUser('existente@auth.example', other);
    const stranger = await createUser('estranho@auth.example', other);
    const role = await getSystemRole('agent');
    const org3 = (await createOrg('Convidante Org')).id;
    const admin3 = await createUser('admin@convidante.example', org3);
    const { link } = await createInvitation(ctxFor(org3, admin3.id), { email: 'existente@auth.example', roleId: role.id });
    const token = new URL(link!).searchParams.get('token')!;
    // não dá para "aceitar" definindo senha (o que permitiria testar senhas da conta existente)
    await expect(acceptInvitation(token, { password: 'Qualquer123' })).rejects.toThrow('já possui conta');
    await expect(acceptInvitationAsUser(token, stranger.id)).rejects.toThrow(ForbiddenError);
    const r = await acceptInvitationAsUser(token, existing.id);
    expect(r.organizationId).toBe(org3);
    expect(await systemDb.membership.count({ where: { userId: existing.id, status: 'ACTIVE' } })).toBe(2);
  });

  it('troca de senha encerra as outras sessões', async () => {
    const u = await createUser('sessoes@auth.example', orgId, 'agent');
    const keep = await createSessionRecord(u.id, orgId, { ip: null, userAgent: null });
    const other = await createSessionRecord(u.id, orgId, { ip: null, userAgent: null });
    const keepId = (await findSessionByToken(keep))!.id;
    await changePassword(u.id, 'Senha1234', 'NovaSenha123', keepId);
    expect(await findSessionByToken(keep)).not.toBeNull();
    expect(await findSessionByToken(other)).toBeNull();
  });
});
