import { RateLimitError } from './errors';

/**
 * Rate limiting em memória (janela deslizante simples).
 * Adequado para instância única. Em múltiplas instâncias, troque o `store`
 * por uma implementação compartilhada (Redis/Upstash) mantendo a mesma interface.
 */
export interface RateLimitStore {
  hit(key: string, windowMs: number): number;
}

const MAX_KEYS = 50_000;

class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, { hits: number[]; windowMs: number }>();
  hit(key: string, windowMs: number): number {
    const now = Date.now();
    const hits = (this.buckets.get(key)?.hits ?? []).filter((t) => now - t < windowMs);
    hits.push(now);
    this.buckets.delete(key); // reinsere no fim: o Map mantém ordem de uso (LRU)
    this.buckets.set(key, { hits, windowMs });
    if (this.buckets.size > MAX_KEYS) this.evict(now);
    return hits.length;
  }
  /** Remove apenas entradas expiradas; se ainda exceder, descarta as menos usadas (nunca zera tudo). */
  private evict(now: number) {
    for (const [k, v] of this.buckets) if (!v.hits.some((t) => now - t < v.windowMs)) this.buckets.delete(k);
    for (const k of this.buckets.keys()) {
      if (this.buckets.size <= MAX_KEYS * 0.9) break;
      this.buckets.delete(k);
    }
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
