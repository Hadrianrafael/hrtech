import { describe, expect, it } from 'vitest';
import { applyTenantScope } from '@/lib/db';

describe('escopo de tenant (camada de aplicação)', () => {
  it('injeta organizationId em leituras, atualizações e exclusões', () => {
    for (const op of ['findMany', 'findFirst', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'aggregate', 'groupBy']) {
      const a = applyTenantScope('Contact', op, { where: { id: 'x' } }, 'org-a');
      expect(a.where).toMatchObject({ id: 'x', organizationId: 'org-a' });
    }
  });

  it('força organizationId na criação e bloqueia gravação em outra organização', () => {
    expect(applyTenantScope('Contact', 'create', { data: { name: 'A' } }, 'org-a').data).toMatchObject({ organizationId: 'org-a' });
    expect(() => applyTenantScope('Contact', 'create', { data: { name: 'A', organizationId: 'org-b' } }, 'org-a')).toThrow();
    expect(() => applyTenantScope('Contact', 'update', { where: { id: 'x' }, data: { organizationId: 'org-b' } }, 'org-a')).toThrow();
    const many = applyTenantScope('Tag', 'createMany', { data: [{ name: 'a' }, { name: 'b' }] }, 'org-a').data as { organizationId: string }[];
    expect(many.every((d) => d.organizationId === 'org-a')).toBe(true);
  });

  it('Organization só enxerga a própria linha e não pode ser criada pelo tenant', () => {
    expect(applyTenantScope('Organization', 'findFirst', {}, 'org-a').where).toEqual({ id: 'org-a' });
    expect(() => applyTenantScope('Organization', 'create', { data: {} }, 'org-a')).toThrow();
  });

  it('Role lê papéis de sistema + próprios e grava apenas no tenant', () => {
    const read = applyTenantScope('Role', 'findMany', { where: { key: 'x' } }, 'org-a').where as { AND: unknown[] };
    expect(JSON.stringify(read.AND)).toContain('"organizationId":null');
    expect(applyTenantScope('Role', 'update', { where: { id: 'r' }, data: {} }, 'org-a').where).toMatchObject({ organizationId: 'org-a' });
  });

  it('não altera modelos globais', () => {
    expect(applyTenantScope('Plan', 'findMany', { where: { key: 'a' } }, 'org-a').where).toEqual({ key: 'a' });
  });
});
