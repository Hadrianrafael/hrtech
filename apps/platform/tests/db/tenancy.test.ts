import { beforeAll, describe, expect, it } from 'vitest';
import { __unsafeBasePrismaForTests, checkDatabaseRole, tenantDb, withTenant } from '@/lib/db';
import { createContact, getContact, listContacts } from '@/server/contacts';
import { NotFoundError } from '@/lib/errors';
import { retrieve, saveKnowledgeDocument } from '@/server/ai/rag';
import { createOrg, createUser, ctxFor, dbReachable, resetDb } from '../helpers';

const ok = await dbReachable();

describe.skipIf(!ok)('isolamento multi-tenant', () => {
  let orgA: string, orgB: string, contactB: string, userA: string;

  beforeAll(async () => {
    await resetDb();
    orgA = (await createOrg('Empresa A')).id;
    orgB = (await createOrg('Empresa B')).id;
    userA = (await createUser('a@a.example', orgA)).id;
    const userB = (await createUser('b@b.example', orgB)).id;
    await createContact(ctxFor(orgA, userA), { name: 'Contato da A', email: 'ca@a.example' });
    contactB = (await createContact(ctxFor(orgB, userB), { name: 'Contato da B', email: 'cb@b.example' })).id;
    await saveKnowledgeDocument(ctxFor(orgB, userB), null, { title: 'Segredo B', content: 'A tarifa secreta da empresa B é 999 reais por diária.' });
  });

  it('o RLS está efetivo para a aplicação', async () => {
    expect((await checkDatabaseRole()).ok).toBe(true);
  });

  it('transações da aplicação usam o papel restrito quando ele existe', async () => {
    const status = await checkDatabaseRole();
    const [row] = await withTenant(orgA, (tx) => tx.$queryRaw<{ u: string }[]>`SELECT current_user AS u`);
    expect(row!.u).toBe(status.mode === 'app_role' ? 'hrtech_rls' : status.role);
  });

  it('listagens retornam apenas dados da própria empresa', async () => {
    const { items } = await listContacts(ctxFor(orgA, userA));
    expect(items.map((c) => c.name)).toEqual(['Contato da A']);
  });

  it('acesso direto por ID de outra empresa é negado', async () => {
    await expect(getContact(ctxFor(orgA, userA), contactB)).rejects.toThrow(NotFoundError);
    expect(await tenantDb(orgA).contact.findUnique({ where: { id: contactB } })).toBeNull();
    await expect(tenantDb(orgA).contact.update({ where: { id: contactB }, data: { name: 'invadido' } })).rejects.toThrow();
    expect((await tenantDb(orgA).contact.updateMany({ where: { id: contactB }, data: { name: 'invadido' } })).count).toBe(0);
    expect((await tenantDb(orgA).contact.deleteMany({ where: { id: contactB } })).count).toBe(0);
    expect((await tenantDb(orgB).contact.findUnique({ where: { id: contactB } }))?.name).toBe('Contato da B');
  });

  it('RLS no banco filtra até consultas SQL brutas', async () => {
    const rows = await withTenant(orgA, (tx) => tx.$queryRaw<{ name: string }[]>`SELECT name FROM "Contact"`);
    expect(rows.map((r) => r.name)).toEqual(['Contato da A']);
    // Sem contexto de tenant o banco não retorna nada (fail-closed) — vale para usuários de conexão sem BYPASSRLS.
    if (!(await checkDatabaseRole()).loginBypassesRls) {
      const none = await __unsafeBasePrismaForTests.$queryRaw<{ c: bigint }[]>`SELECT count(*) AS c FROM "Contact"`;
      expect(Number(none[0]!.c)).toBe(0);
    }
  });

  it('RLS impede inserir dados em outra empresa mesmo via SQL', async () => {
    await expect(
      withTenant(orgA, (tx) => tx.$executeRaw`INSERT INTO "Tag" (id, "organizationId", name, color, "createdAt") VALUES ('t-x', ${orgB}, 'intrusa', '#000', now())`),
    ).rejects.toThrow();
  });

  it('a IA nunca recupera conhecimento de outra empresa', async () => {
    const results = await retrieve(ctxFor(orgA, userA), 'tarifa secreta diária', 5);
    expect(results).toHaveLength(0);
    const own = await retrieve(ctxFor(orgB, null), 'tarifa secreta diária', 5);
    expect(own[0]?.title).toBe('Segredo B');
  });
});
