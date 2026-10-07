import { describe, expect, it } from 'vitest';
import { assertCan, can, makeServiceCtx, ownerScope } from '@/lib/auth/ctx';
import { ForbiddenError } from '@/lib/errors';
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '@/lib/auth/permissions';

const role = (key: string) => SYSTEM_ROLES.find((r) => r.key === key)!;

describe('RBAC', () => {
  it('administrador tem todas as permissões', () => {
    expect(role('org_admin').permissions).toEqual(ALL_PERMISSIONS);
  });

  it('atendente não administra equipe, integrações nem exclui contatos', () => {
    const agent = role('agent').permissions;
    for (const p of ['team.manage', 'integrations.manage', 'contacts.delete', 'billing.manage', 'records.view_all', 'roles.manage'] as const) {
      expect(agent).not.toContain(p);
    }
    expect(agent).toContain('inbox.use');
  });

  it('gestor vê métricas e toda a equipe, mas não altera permissões', () => {
    const manager = role('manager').permissions;
    expect(manager).toContain('analytics.view');
    expect(manager).toContain('records.view_all');
    expect(manager).not.toContain('roles.manage');
  });

  it('assertCan lança ForbiddenError', () => {
    const ctx = makeServiceCtx('org', { userId: 'u', permissions: role('agent').permissions });
    expect(can(ctx, 'inbox.use')).toBe(true);
    expect(() => assertCan(ctx, 'team.manage')).toThrow(ForbiddenError);
  });

  it('ownerScope restringe atendente aos próprios registros e não atribuídos', () => {
    const agent = makeServiceCtx('org', { userId: 'u1', permissions: role('agent').permissions });
    expect(ownerScope(agent, 'ownerId')).toEqual({ OR: [{ ownerId: 'u1' }, { ownerId: null }] });
    const manager = makeServiceCtx('org', { userId: 'u2', permissions: role('manager').permissions });
    expect(ownerScope(manager, 'ownerId')).toEqual({});
  });
});
