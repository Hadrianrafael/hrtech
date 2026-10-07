import { tenantDb, type TenantDb } from '../db';
import { ForbiddenError } from '../errors';
import { ALL_PERMISSIONS, type Permission } from './permissions';

/**
 * Contexto de execução dos serviços de domínio. Independente do Next.js
 * (pode ser criado por páginas, server actions, webhooks, cron ou testes).
 */
export interface ServiceCtx {
  orgId: string;
  db: TenantDb;
  userId: string | null;
  actorType: 'USER' | 'AI' | 'SYSTEM' | 'AUTOMATION' | 'CONTACT';
  permissions: Set<Permission>;
}

export function makeServiceCtx(
  orgId: string,
  opts: { userId?: string | null; actorType?: ServiceCtx['actorType']; permissions?: Iterable<Permission> } = {},
): ServiceCtx {
  return {
    orgId,
    db: tenantDb(orgId),
    userId: opts.userId ?? null,
    actorType: opts.actorType ?? (opts.userId ? 'USER' : 'SYSTEM'),
    permissions: new Set(opts.permissions ?? ALL_PERMISSIONS),
  };
}

/** Contexto de sistema (webhooks, automações, cron) com todas as permissões dentro do tenant. */
export function systemCtx(orgId: string, actorType: ServiceCtx['actorType'] = 'SYSTEM'): ServiceCtx {
  return makeServiceCtx(orgId, { actorType });
}

export function can(ctx: Pick<ServiceCtx, 'permissions'>, permission: Permission): boolean {
  return ctx.permissions.has(permission);
}

export function assertCan(ctx: Pick<ServiceCtx, 'permissions'>, permission: Permission) {
  if (!can(ctx, permission)) throw new ForbiddenError();
}

/**
 * Escopo de visibilidade: sem `records.view_all`, o usuário só vê registros atribuídos a ele
 * ou ainda não atribuídos. Aplicado em contatos, oportunidades, conversas, tarefas e agenda.
 */
export function ownerScope<F extends string>(ctx: ServiceCtx, field: F): Record<string, unknown> {
  if (!ctx.userId || can(ctx, 'records.view_all')) return {};
  return { OR: [{ [field]: ctx.userId }, { [field]: null }] };
}
