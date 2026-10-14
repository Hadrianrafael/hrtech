import { describe, expect, it } from 'vitest';
import { formatPrice, priceFor, pricing, pricingEnabled } from '@/config/pricing';
import { locales } from '@/lib/i18n/config';
import { serviceIds } from '@/lib/i18n/routes';

describe('preços', () => {
  it('nenhum preço é exibido ou foi inventado enquanto a apresentação está desativada', () => {
    expect(pricingEnabled).toBe(false);
    expect(pricing).toEqual([]);
    for (const locale of locales) for (const id of serviceIds) expect(priceFor(id, locale)).toBeUndefined();
  });

  it('formata cada moeda no formato do idioma, sem converter valores', () => {
    expect(formatPrice(1500, 'BRL', 'pt-BR').replace(/\s/g, ' ')).toBe('R$ 1.500');
    expect(formatPrice(1500, 'USD', 'en-US')).toBe('$1,500');
    expect(formatPrice(1500, 'EUR', 'es-ES').replace(/\s/g, ' ')).toBe('1500 €');
  });
});
