import { ZodError, type ZodType } from 'zod';
import { AppError } from './errors';
import { logger } from './logger';

export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function zodFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Converte FormData em objeto simples (campos repetidos viram arrays). */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== 'string') continue;
    if (k in out) {
      const prev = out[k];
      out[k] = Array.isArray(prev) ? [...prev, v] : [prev, v];
    } else out[k] = v;
  }
  return out;
}

/**
 * Executa uma server action com validação e tratamento uniforme de erros.
 * Erros inesperados são registrados e retornam mensagem amigável (sem vazar detalhes).
 */
export async function runAction<S extends ZodType, T>(
  schema: S,
  input: unknown,
  handler: (data: S['_output']) => Promise<T>,
  successMessage?: string,
): Promise<ActionResult<T>> {
  try {
    const raw = input instanceof FormData ? formToObject(input) : input;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = zodFieldErrors(parsed.error);
      return { ok: false, error: Object.values(fieldErrors)[0] ?? 'Dados inválidos.', fieldErrors };
    }
    const data = await handler(parsed.data);
    return { ok: true, data, message: successMessage };
  } catch (err) {
    return actionError(err);
  }
}

export function actionError(err: unknown): { ok: false; error: string } {
  // Redirecionamentos do Next.js devem continuar propagando.
  if (err && typeof err === 'object' && 'digest' in err && String((err as { digest: unknown }).digest).startsWith('NEXT_')) {
    throw err;
  }
  if (err instanceof AppError) return { ok: false, error: err.message };
  logger.error('action.unexpected_error', { err });
  return { ok: false, error: 'Ocorreu um erro inesperado. Tente novamente; se persistir, contate o suporte.' };
}
