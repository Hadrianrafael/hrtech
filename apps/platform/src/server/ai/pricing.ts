import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Preços de referência em US$ por 1 milhão de tokens (entrada / saída), usados para ESTIMAR custo e aplicar os
 * limites de orçamento da Equipe IA. A cobrança real é a do provedor. Para ajustar sem alterar código, defina
 * AI_PRICING_JSON, ex.: {"claude-opus-5-5":[4,20],"gpt-4o-mini":[0.15,0.6]}.
 */
const BASE_PRICES: Record<string, [number, number]> = {
  // Anthropic (tabela oficial em set/2026)
  'claude-fable-5-1': [10, 50],
  'claude-opus-5-5': [4, 20],
  'claude-opus-5': [5, 25],
  'claude-sonnet-5-5': [2, 10],
  'claude-sonnet-5': [2, 10],
  'claude-haiku-4-5': [1, 5],
  // OpenAI (referência; confira a tabela vigente)
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4o': [2.5, 10],
  'gpt-4.1-mini': [0.4, 1.6],
  'gpt-4.1': [2, 8],
  // Google Gemini (referência; confira a tabela vigente)
  'gemini-2.5-flash': [0.3, 2.5],
  'gemini-2.5-flash-lite': [0.1, 0.4],
  'gemini-2.5-pro': [1.25, 10],
};

/** Preço conservador para modelos desconhecidos (evita custo "zero" escapando dos limites). */
const UNKNOWN_PRICE: [number, number] = [5, 25];

let cache: { raw: string | undefined; prices: Record<string, [number, number]> } | null = null;

function prices(): Record<string, [number, number]> {
  const raw = env.aiPricingJson();
  if (cache && cache.raw === raw) return cache.prices;
  let extra: Record<string, [number, number]> = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && n >= 0)) extra[k] = [v[0], v[1]];
      }
    } catch {
      logger.warn('ai.pricing_json_invalid');
      extra = {};
    }
  }
  cache = { raw, prices: { ...BASE_PRICES, ...extra } };
  return cache.prices;
}

export function priceFor(model: string): [number, number] {
  const table = prices();
  if (table[model]) return table[model];
  // Versões datadas/variantes (ex.: "gpt-4o-mini-2024-07-18", "models/gemini-2.5-flash-001")
  const key = Object.keys(table)
    .sort((a, b) => b.length - a.length)
    .find((k) => model.includes(k));
  return key ? table[key]! : UNKNOWN_PRICE;
}

/** Custo estimado em micro-dólares (1 US$ = 1.000.000). */
export function estimateCostMicroUsd(model: string, tokensIn: number, tokensOut: number): number {
  const [pin, pout] = priceFor(model);
  return Math.ceil(tokensIn * pin + tokensOut * pout);
}

export function microUsdToCents(micro: number) {
  return micro / 10_000;
}
