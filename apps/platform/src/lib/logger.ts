/**
 * Logger estruturado (JSON) com redação de dados sensíveis.
 * Nunca registre tokens, senhas ou conteúdo integral de mensagens.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE = /(pass(word)?|secret|token|authorization|cookie|api[-_]?key|signature|hash)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[depth]';
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '…';
  return value;
}

function write(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;
  if (process.env.VITEST && level !== 'error') return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...(meta ? (redact(meta) as object) : {}) });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
};
