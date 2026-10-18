import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/content';
import { locales } from '@/lib/i18n/config';
import { industryIds, serviceIds } from '@/lib/i18n/routes';
import { industryMeta, serviceMeta } from '@/data/catalog';
import { techGroups } from '@/data/technologies';

/** Estrutura (chaves e tamanhos de listas) de um valor, ignorando os textos. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => key !== 'locale' && key !== 'itemLabels' && key !== 'keywords').map(([key, item]) => [key, shape(item)]));
  }
  return typeof value;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('conteúdo por idioma', () => {
  it('as três versões têm exatamente a mesma estrutura', () => {
    const [first, ...rest] = locales.map((locale) => {
      const { form, ...dict } = getDictionary(locale);
      // orçamento estimado só existe em reais (não inventamos faixas em USD/EUR)
      return { ...dict, form: { ...form, budgetRanges: [] } };
    });
    for (const other of rest) expect(shape(other)).toEqual(shape(first));
  });

  it('todos os textos são preenchidos (sem vazios nem marcadores de pendência)', () => {
    for (const locale of locales) {
      for (const text of strings(getDictionary(locale))) {
        expect(text.trim()).not.toBe('');
        expect(text).not.toMatch(/\b(TODO|TBD|FIXME|XXX)\b|lorem ipsum|undefined|\[object/);
      }
    }
  });

  it('cada idioma tem 7 soluções e 5 segmentos com FAQ, problemas e títulos únicos', () => {
    for (const locale of locales) {
      const dict = getDictionary(locale);
      expect(serviceIds).toHaveLength(7);
      expect(industryIds).toHaveLength(5);
      for (const id of serviceIds) {
        expect(dict.services[id].faq.length).toBeGreaterThanOrEqual(2);
        expect(dict.services[id].problems).toHaveLength(3);
      }
      for (const id of industryIds) {
        expect(dict.industries[id].faq.length).toBeGreaterThanOrEqual(3);
        expect(dict.industries[id].solutions.length).toBeGreaterThanOrEqual(3);
      }
      const titles = [...serviceIds.map((id) => dict.services[id].metaTitle), ...industryIds.map((id) => dict.industries[id].metaTitle)];
      expect(new Set(titles).size).toBe(titles.length);
      const descriptions = [...serviceIds.map((id) => dict.services[id].metaDescription), ...industryIds.map((id) => dict.industries[id].metaDescription)];
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });

  it('metadescrições têm tamanho adequado para os buscadores', () => {
    for (const locale of locales) {
      const dict = getDictionary(locale);
      const all = [dict.meta.siteDescription, dict.servicesPage.metaDescription, dict.industriesPage.metaDescription, ...serviceIds.map((id) => dict.services[id].metaDescription), ...industryIds.map((id) => dict.industries[id].metaDescription)];
      for (const description of all) {
        expect(description.length).toBeGreaterThanOrEqual(70);
        expect(description.length).toBeLessThanOrEqual(330);
      }
    }
  });

  it('solucoes de segmento referenciam serviços existentes e todo serviço aparece em algum segmento', () => {
    const dict = getDictionary('pt-BR');
    const used = new Set(industryIds.flatMap((id) => dict.industries[id].solutions.map((solution) => solution.service)));
    for (const service of used) expect(serviceIds).toContain(service);
    for (const id of ['web', 'software', 'ai', 'automation'] as const) expect(used).toContain(id);
  });

  it('grupos de tecnologia têm texto em todos os idiomas', () => {
    for (const locale of locales) expect(getDictionary(locale).stack.groups).toHaveLength(techGroups.length);
    expect(Object.keys(serviceMeta).sort()).toEqual([...serviceIds].sort());
    expect(Object.keys(industryMeta).sort()).toEqual([...industryIds].sort());
  });

  it('não afirma escritório, certificação, cliente ou resultado inexistente', () => {
    const forbidden = /(escritório|office|oficina)\s+(em|in|en)\s+(são paulo|madrid|barcelona|new york|miami|spain|españa|espanha|united states)|certificad[oa]\s+(iso|aws|microsoft)|ISO\s?27001|SOC\s?2|Fortune\s?500|\d+\s?\+?\s?(clientes|clients|clientes atendidos)|testimonial|depoimento/i;
    for (const locale of locales) {
      for (const text of strings(getDictionary(locale))) {
        // frases que NEGAM ter escritório local ("não temos…") são exatamente o que queremos manter
        const withoutDenials = text.replace(/(do not have|No tenemos|Não temos)[^.]*\./g, '');
        expect(withoutDenials).not.toMatch(forbidden);
      }
    }
  });

  it('declara que não há escritório fora do Brasil nas versões internacionais', () => {
    expect(JSON.stringify(getDictionary('pt-BR').faqSection.items)).toContain('Não temos escritório fora do Brasil');
    expect(JSON.stringify(getDictionary('en-US').faqSection.items)).toContain('do not have a local office outside Brazil');
    expect(JSON.stringify(getDictionary('es-ES').faqSection.items)).toContain('No tenemos oficina en España');
  });
});
