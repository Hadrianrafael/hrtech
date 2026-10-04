import { RateLimitError } from './errors';

/**
 * Rate limiting em memória (janela deslizante simples).
 * Adequado para instância única. Em múltiplas instâncias, troque o `store`
 * por uma implementação compartilhada (Redis/Upstash) mantendo a mesma interface.
 */
export interface RateLimitStore {
  hit(key: string, windowMs: number): number;
}

class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, number[]>();
  hit(key: string, windowMs: number): number {
    const now = Date.now();
    const arr = (this.buckets.get(key) ?? []).filter((t) => now - t < windowMs);
    arr.push(now);
    this.buckets.set(key, arr);
    if (this.buckets.size > 50_000) this.buckets.clear();
    return arr.length;
  }
}

let store: RateLimitStore = new MemoryStore();
export function setRateLimitStore(s: RateLimitStore) {
  store = s;
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; count: number } {
  const count = store.hit(key, windowMs);
  return { ok: count <= limit, count };
}

export function assertRateLimit(key: string, limit: number, windowMs: number, message?: string) {
  if (!rateLimit(key, limit, windowMs).ok) throw new RateLimitError(message);
}
