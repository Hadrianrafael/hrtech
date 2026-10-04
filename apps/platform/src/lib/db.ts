import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Acesso ao banco com isolamento multi-tenant.
 *
 *  - `tenantDb(orgId)`: TODA operação recebe o filtro `organizationId = orgId` (camada de aplicação)
 *    e roda numa transação com `app.org_id` definido (camada de banco / RLS).
 *  - `systemDb`: operações de sistema (auth, webhooks antes da resolução do tenant, cron, painel HR Tech).
 *    Define `app.bypass_rls = on`. Use com parcimônia e nunca com input do usuário para escolher o tenant.
 *  - `withTenant(orgId, fn)`: transação interativa com RLS ativo (para consultas raw/atômicas).
 *    Dentro dela, sempre inclua `organizationId` explicitamente.
 *
 * O cliente "cru" (`basePrisma`) não é exportado para o restante da aplicação: sem `app.org_id`
 * definido, o RLS não retorna nenhuma linha de tabelas de tenant (fail-closed).
 */

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

const basePrisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === 'query' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = basePrisma;

/** Modelos com coluna `organizationId` obrigatória. */
export const TENANT_MODELS = new Set<string>([
  'Membership', 'Invitation', 'Subscription', 'Usage', 'Contact', 'ContactIdentity', 'Tag', 'ContactTag',
  'Note', 'Pipeline', 'PipelineStage', 'Opportunity', 'TimelineEvent', 'Integration', 'EmailAccount',
  'MessageTemplate', 'Conversation', 'ConversationTag', 'Message', 'Chatbot', 'KnowledgeBase',
  'KnowledgeDocument', 'KnowledgeChunk', 'AiRun', 'Appointment', 'Task', 'Automation', 'AutomationRun',
  'AuditLog',
]);

const WHERE_OPS = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate',
  'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert',
]);

type AnyArgs = Record<string, unknown> & { where?: Record<string, unknown>; data?: unknown; create?: unknown };

function scopeData(data: unknown, orgId: string, model: string): unknown {
  if (Array.isArray(data)) return data.map((d) => scopeData(d, orgId, model));
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.organizationId !== undefined && d.organizationId !== orgId) {
      throw new Error(`Tentativa de gravar ${model} em outra organização bloqueada.`);
    }
    // Quando a relação `organization` é usada via connect, não sobrescrevemos.
    if (d.organization === undefined) return { ...d, organizationId: orgId };
    return d;
  }
  return data;
}

/** Aplica o escopo do tenant aos argumentos de uma operação Prisma (exportado para testes). */
export function applyTenantScope(model: string, operation: string, args: AnyArgs | undefined, orgId: string): AnyArgs {
  const a: AnyArgs = { ...(args ?? {}) };
  if (model === 'Organization') {
    if (operation.startsWith('create')) throw new Error('Organizações só podem ser criadas pelo sistema.');
    if (WHERE_OPS.has(operation)) a.where = { ...(a.where ?? {}), id: orgId };
    return a;
  }
  if (model === 'Role') {
    if (WHERE_OPS.has(operation)) {
      const readOnly = operation.startsWith('find') || ['count', 'aggregate', 'groupBy'].includes(operation);
      const where = a.where ?? {};
      const and = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
      a.where = readOnly
        ? { ...where, AND: [...and, { OR: [{ organizationId: null }, { organizationId: orgId }] }] }
        : { ...where, organizationId: orgId };
    }
    if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
      a.data = scopeData(a.data, orgId, model);
    }
    if (operation === 'upsert') a.create = scopeData(a.create, orgId, model);
    return a;
  }
  if (!TENANT_MODELS.has(model)) return a;
  if (WHERE_OPS.has(operation)) a.where = { ...(a.where ?? {}), organizationId: orgId };
  if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
    a.data = scopeData(a.data, orgId, model);
  }
  if (operation === 'upsert') a.create = scopeData(a.create, orgId, model);
  if ((operation === 'update' || operation === 'updateMany') && a.data && typeof a.data === 'object') {
    const d = a.data as Record<string, unknown>;
    if (d.organizationId !== undefined && d.organizationId !== orgId) {
      throw new Error('Não é permitido mover registros entre organizações.');
    }
  }
  return a;
}

function makeTenantClient(orgId: string) {
  if (!orgId) throw new Error('tenantDb requer organizationId.');
  return basePrisma.$extends({
    name: 'tenant',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scoped = applyTenantScope(model, operation, args as AnyArgs, orgId);
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.org_id', ${orgId}, TRUE)`,
            query(scoped as typeof args),
          ]);
          return result;
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof makeTenantClient>;

export function tenantDb(orgId: string): TenantDb {
  return makeTenantClient(orgId);
}

function makeSystemClient() {
  return basePrisma.$extends({
    name: 'system',
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', TRUE)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

export const systemDb = makeSystemClient();
export type SystemDb = typeof systemDb;

export type Tx = Prisma.TransactionClient;

/** Transação interativa com RLS do tenant ativo. Inclua `organizationId` explicitamente nas queries. */
export async function withTenant<T>(orgId: string, fn: (tx: Tx) => Promise<T>, opts?: { timeout?: number }): Promise<T> {
  return basePrisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, TRUE)`;
      return fn(tx);
    },
    { timeout: opts?.timeout ?? 15_000 },
  );
}

/** Transação interativa em modo sistema (bypass de RLS). */
export async function withSystem<T>(fn: (tx: Tx) => Promise<T>, opts?: { timeout?: number }): Promise<T> {
  return basePrisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', TRUE)`;
      return fn(tx);
    },
    { timeout: opts?.timeout ?? 15_000 },
  );
}

/** Verifica se o usuário do banco respeita RLS (não-superuser, sem BYPASSRLS). */
export async function checkDatabaseRole(): Promise<{ ok: boolean; role: string; reason?: string }> {
  const rows = await basePrisma.$queryRaw<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
  const r = rows[0];
  if (!r) return { ok: false, role: 'unknown', reason: 'Papel do banco não encontrado.' };
  if (r.rolsuper || r.rolbypassrls) {
    const reason = `O usuário do banco "${r.rolname}" é SUPERUSER/BYPASSRLS: o Row-Level Security não será aplicado.`;
    logger.warn('db.rls_role_unsafe', { role: r.rolname });
    return { ok: false, role: r.rolname, reason };
  }
  return { ok: true, role: r.rolname };
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await basePrisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Uso exclusivo em testes. */
export const __unsafeBasePrismaForTests = basePrisma;

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
