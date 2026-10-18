import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { siteConfig } from '@/config/site';
import { locales, localeSettings } from '@/lib/i18n/config';
import { allRoutes, pathFor } from '@/lib/i18n/routes';
import { buildMetadata, faqSchema, hreflangMap, organizationSchema } from '@/lib/seo';

describe('hreflang', () => {
  it('cobre cada idioma (par idioma-país e idioma genérico) e x-default', () => {
    const map = hreflangMap({ key: 'service', id: 'web' });
    expect(map['pt-BR']).toBe('https://hrtechsistemas.com.br/solucoes/sites/');
    expect(map['pt']).toBe(map['pt-BR']);
    expect(map['en-US']).toBe('https://hrtechsistemas.com.br/en-us/services/web-development/');
    expect(map['en']).toBe(map['en-US']);
    expect(map['es-ES']).toBe('https://hrtechsistemas.com.br/es-es/servicios/desarrollo-web/');
    expect(map['es']).toBe(map['es-ES']);
    expect(map['x-default']).toBe(map['en-US']);
  });

  it('é recíproco: toda página lista a si mesma e as outras versões', () => {
    for (const route of allRoutes) {
      const map = hreflangMap(route);
      for (const locale of locales) {
        const own = `https://hrtechsistemas.com.br${pathFor(locale, route)}`;
        expect(Object.values(map)).toContain(own);
        // o canonical de cada idioma é a própria URL e aparece no conjunto de alternativas
        const canonical = buildMetadata({ locale, route }).alternates?.canonical;
        expect(canonical).toBe(own);
      }
    }
  });
});

describe('metadados', () => {
  it('páginas noindex não recebem hreflang', () => {
    const meta = buildMetadata({ locale: 'en-US', route: { key: 'privacy' }, noIndex: true });
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it('Open Graph usa o idioma e a imagem do mercado', () => {
    for (const locale of locales) {
      const meta = buildMetadata({ locale, route: { key: 'home' } });
      expect(meta.openGraph?.locale).toBe(localeSettings[locale].ogLocale);
      expect(JSON.stringify(meta.openGraph?.images)).toContain(localeSettings[locale].ogImage);
    }
  });
});

describe('sitemap', () => {
  const entries = sitemap();

  it('tem uma URL por página e idioma, sem páginas noindex e sem duplicatas', () => {
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength((allRoutes.length - 2) * locales.length);
    expect(urls.some((url) => /privacidade|privacy|privacidad|termos|terms|terminos/.test(url))).toBe(false);
  });

  it('cada entrada traz as alternativas hreflang', () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages ?? {};
      expect(Object.keys(languages)).toEqual(expect.arrayContaining(['pt-BR', 'en-US', 'es-ES', 'x-default']));
      expect(Object.values(languages)).toContain(entry.url);
    }
  });

  it('não informa datas de modificação não verificadas', () => {
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});

describe('robots', () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];

  it('libera o site inteiro e aponta o sitemap', () => {
    expect(rules.every((rule) => rule?.allow === '/' && !rule?.disallow)).toBe(true);
    expect(config.sitemap).toBe('https://hrtechsistemas.com.br/sitemap.xml');
  });

  it('declara os rastreadores de busca e de assistentes documentados', () => {
    const agents = rules.map((rule) => rule?.userAgent);
    for (const agent of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot']) {
      expect(agents).toContain(agent);
    }
  });
});

describe('dados estruturados', () => {
  it('descreve a mesma organização em todos os idiomas, sem afirmar escritório fora do Brasil', () => {
    for (const locale of locales) {
      const [org] = organizationSchema(locale)['@graph'] as Record<string, unknown>[];
      expect(org?.['@id']).toBe(`${siteConfig.url}/#organization`);
      expect(org?.['@type']).toEqual(['Organization', 'ProfessionalService']);
      expect(JSON.stringify(org?.address)).toContain('"addressCountry":"BR"');
      expect(Array.isArray(org?.areaServed) ? org.areaServed : []).toHaveLength(3);
      expect(org).not.toHaveProperty('aggregateRating');
      expect(org).not.toHaveProperty('review');
    }
  });

  it('FAQPage espelha as perguntas visíveis', () => {
    const schema = faqSchema([{ question: 'Q?', answer: 'A.' }], 'en-US');
    expect(schema.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } });
  });
});
