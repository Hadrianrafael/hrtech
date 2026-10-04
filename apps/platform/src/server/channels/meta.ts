import { hmacSha256Hex, safeEqual } from '@/lib/crypto';
import { env } from '@/lib/env';

/** Valida X-Hub-Signature-256 enviado pela Meta (HMAC-SHA256 do corpo bruto com o App Secret). */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string | undefined = env.metaAppSecret()): boolean {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = `sha256=${hmacSha256Hex(appSecret, rawBody)}`;
  return safeEqual(expected, header);
}

export function graphUrl(path: string, base = 'https://graph.facebook.com') {
  return `${base}/${env.metaGraphVersion()}/${path.replace(/^\//, '')}`;
}

export async function graphRequest<T>(url: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
  if (!res.ok || json.error) {
    throw new Error(`Meta Graph API: ${json.error?.message ?? res.statusText} (${json.error?.code ?? res.status})`);
  }
  return json;
}
