import 'server-only';
import type { ZodType } from 'zod';
import { actionError, runAction, type ActionResult } from './action';
import { requireActionContext, type OrgContext } from './auth/context';
import type { Permission } from './auth/permissions';

/** Executa ação no contexto da organização ativa, com checagem de permissão no servidor. */
export async function withOrg<T>(permission: Permission | undefined, fn: (ctx: OrgContext) => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const ctx = await requireActionContext(permission);
    const data = await fn(ctx);
    return { ok: true, data, message };
  } catch (err) {
    return actionError(err);
  }
}

/** Igual a `withOrg`, validando a entrada com Zod antes. */
export async function withOrgSchema<S extends ZodType, T>(
  permission: Permission | undefined,
  schema: S,
  input: unknown,
  fn: (ctx: OrgContext, data: S['_output']) => Promise<T>,
  message?: string,
): Promise<ActionResult<T>> {
  try {
    const ctx = await requireActionContext(permission);
    return runAction(schema, input, (data) => fn(ctx, data), message);
  } catch (err) {
    return actionError(err);
  }
}
