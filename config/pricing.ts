import type { Currency, Locale } from '@/lib/i18n/config';
import { localeSettings } from '@/lib/i18n/config';
import type { ServiceId } from '@/lib/i18n/routes';

/**
 * Estrutura para a futura apresentação de preços em BRL, USD e EUR.
 *
 * REGRAS:
 * - Nenhum preço é exibido hoje (`pricingEnabled = false`) e nenhum valor foi definido.
 * - Cada moeda recebe o SEU valor, decidido comercialmente. NÃO há conversão automática de câmbio.
 * - Nenhuma cobrança internacional é feita pelo site; pagamento só após contrato.
 *
 * Para ativar: preencha `pricing`, defina `pricingEnabled = true` e crie o bloco visual nas páginas
 * de serviço (a estrutura de dados e `formatPrice` já estão prontas).
 */
export const pricingEnabled = false;

export type PriceTier = {
  service: ServiceId;
  /** Valor "a partir de", por moeda. Informe apenas as moedas em que o preço foi definido. */
  from: Partial<Record<Currency, number>>;
  billing: 'one-time' | 'monthly';
};

export const pricing: PriceTier[] = [];

/** Formata um valor na moeda informada, no formato numérico do idioma. Não converte moedas. */
export function formatPrice(amount: number, currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/** Preço de um serviço na moeda do mercado do idioma — `undefined` se não houver valor definido nessa moeda. */
export function priceFor(service: ServiceId, locale: Locale): string | undefined {
  if (!pricingEnabled) return undefined;
  const currency = localeSettings[locale].currency;
  const amount = pricing.find((tier) => tier.service === service)?.from[currency];
  return amount === undefined ? undefined : formatPrice(amount, currency, locale);
}
