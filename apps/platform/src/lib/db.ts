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

/**
 * Papel restrito (NOLOGIN, sem BYPASSRLS, não-dono das tabelas) criado pela migration `rls_app_role`.
 * Quando disponível, toda transação troca para ele (`set_config('role', ...)`), garantindo que o RLS
 * seja aplicado mesmo que o usuário de conexão seja dono das tabelas, SUPERUSER ou BYPASSRLS
 * (comum em bancos gerenciados como Neon/Supabase).
 */
export const RLS_ROLE = 'hrtech_rls';

let rlsRoleCheck: Promise<boolean> | null = null;

/** Verifica (uma vez por processo) se o papel restrito existe e pode ser assumido pelo usuário de conexão. */
export function rlsRoleAvailable(): Promise<boolean> {
  rlsRoleCheck ??= basePrisma
    .$queryRaw<{ ok: boolean }[]>`
      SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${RLS_ROLE})
        THEN pg_has_role(current_user, ${RLS_ROLE}, 'MEMBER') ELSE false END AS ok`
    .then((rows) => {
      const ok = !!rows[0]?.ok;
      if (!ok) logger.warn('db.rls_role_unavailable', { role: RLS_ROLE });
      return ok;
    })
    .catch((err) => {
      rlsRoleCheck = null; // tenta novamente na próxima operação
      throw err;
    });
  return rlsRoleCheck;
}

/**
 * Monta (sem executar) a instrução que prepara o contexto de segurança da transação.
 * Síncrona de propósito: PrismaPromise é preguiçosa e só pode ser executada dentro do `$transaction`.
 */
function securityContext(client: { $executeRaw: typeof basePrisma.$executeRaw }, mode: { orgId: string } | 'system', useRole: boolean) {
  if (mode === 'system') {
    return useRole
      ? client.$executeRaw`SELECT set_config('app.bypass_rls', 'on', TRUE), set_config('role', ${RLS_ROLE}, TRUE)`
      : client.$executeRaw`SELECT set_config('app.bypass_rls', 'on', TRUE)`;
  }
  return useRole
    ? client.$executeRaw`SELECT set_config('app.org_id', ${mode.orgId}, TRUE), set_config('role', ${RLS_ROLE}, TRUE)`
    : client.$executeRaw`SELECT set_config('app.org_id', ${mode.orgId}, TRUE)`;
}

/** Modelos com coluna `organizationId` obrigatória. */
export const TENANT_MODELS = new Set<string>([
  'Membership', 'Invitation', 'Subscription', 'Usage', 'Contact', 'ContactIdentity', 'Tag', 'ContactTag',
  'Note', 'Pipeline', 'PipelineStage', 'Opportunity', 'TimelineEvent', 'Integration', 'EmailAccount',
  'MessageTemplate', 'Conversation', 'ConversationTag', 'Message', 'Chatbot', 'KnowledgeBase',
  'KnowledgeDocument', 'KnowledgeChunk', 'AiRun', 'Appointment', 'Task', 'Automation', 'AutomationRun',
  'AuditLog',
  // Equipe IA
  'AiCompany', 'AiAgent', 'AiPromptVersion', 'AiObjective', 'AiTask', 'AiTaskRun', 'AiToolCall', 'AiApproval',
  'AiMemory', 'AiActivity', 'AiBriefing', 'N8nDispatch',
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
          const useRole = await rlsRoleAvailable();
          const [, result] = await basePrisma.$transaction([securityContext(basePrisma, { orgId }, useRole), query(scoped as typeof args)]);
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
          const useRole = await rlsRoleAvailable();
          const [, result] = await basePrisma.$transaction([securityContext(basePrisma, 'system', useRole), query(args)]);
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
  const useRole = await rlsRoleAvailable();
  return basePrisma.$transaction(
    async (tx) => {
      await securityContext(tx, { orgId }, useRole);
      return fn(tx);
    },
    { timeout: opts?.timeout ?? 15_000 },
  );
}

/** Transação interativa em modo sistema (bypass de RLS). */
export async function withSystem<T>(fn: (tx: Tx) => Promise<T>, opts?: { timeout?: number }): Promise<T> {
  const useRole = await rlsRoleAvailable();
  return basePrisma.$transaction(
    async (tx) => {
      await securityContext(tx, 'system', useRole);
      return fn(tx);
    },
    { timeout: opts?.timeout ?? 15_000 },
  );
}

export interface DbRoleStatus {
  ok: boolean;
  role: string;
  /** "app_role": transações usam o papel restrito; "login_role": dependem dos atributos do usuário de conexão. */
  mode: 'app_role' | 'login_role';
  loginBypassesRls: boolean;
  reason?: string;
}

/** Diagnóstico do Row-Level Security (exibido no painel /admin e usado nos testes). */
export async function checkDatabaseRole(): Promise<DbRoleStatus> {
  const rows = await basePrisma.$queryRaw<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
  const r = rows[0];
  if (!r) return { ok: false, role: 'unknown', mode: 'login_role', loginBypassesRls: true, reason: 'Papel do banco não encontrado.' };
  const loginBypassesRls = r.rolsuper || r.rolbypassrls;
  if (await rlsRoleAvailable()) {
    const app = await basePrisma.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = ${RLS_ROLE}`;
    if (app[0] && !app[0].rolsuper && !app[0].rolbypassrls) return { ok: true, role: r.rolname, mode: 'app_role', loginBypassesRls };
    return { ok: false, role: r.rolname, mode: 'app_role', loginBypassesRls, reason: `O papel ${RLS_ROLE} não pode ter SUPERUSER/BYPASSRLS.` };
  }
  if (loginBypassesRls) {
    const reason = `O papel ${RLS_ROLE} não existe e o usuário "${r.rolname}" é SUPERUSER/BYPASSRLS: o Row-Level Security não será aplicado. Rode as migrations com um usuário que tenha CREATEROLE.`;
    logger.warn('db.rls_role_unsafe', { role: r.rolname });
    return { ok: false, role: r.rolname, mode: 'login_role', loginBypassesRls, reason };
  }
  return { ok: true, role: r.rolname, mode: 'login_role', loginBypassesRls };
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
