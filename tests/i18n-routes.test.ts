import { describe, expect, it } from 'vitest';
import { defaultLocale, locales } from '@/lib/i18n/config';
import { allRoutes, alternatePaths, homeSectionPath, industryIds, matchPath, pathFor, serviceIds } from '@/lib/i18n/routes';

describe('rotas multilíngues', () => {
  it('mantém as URLs históricas em português', () => {
    expect(pathFor('pt-BR', { key: 'home' })).toBe('/');
    expect(pathFor('pt-BR', { key: 'services' })).toBe('/solucoes/');
    expect(pathFor('pt-BR', { key: 'service', id: 'web' })).toBe('/solucoes/sites/');
    expect(pathFor('pt-BR', { key: 'service', id: 'software' })).toBe('/solucoes/sistemas/');
    expect(pathFor('pt-BR', { key: 'service', id: 'saas' })).toBe('/solucoes/saas/');
    expect(pathFor('pt-BR', { key: 'service', id: 'ai' })).toBe('/solucoes/inteligencia-artificial/');
    expect(pathFor('pt-BR', { key: 'service', id: 'automation' })).toBe('/solucoes/automacoes/');
    expect(pathFor('pt-BR', { key: 'service', id: 'ecommerce' })).toBe('/solucoes/e-commerce/');
    expect(pathFor('pt-BR', { key: 'service', id: 'cloud' })).toBe('/solucoes/cloud-infraestrutura/');
    expect(pathFor('pt-BR', { key: 'privacy' })).toBe('/privacidade/');
    expect(pathFor('pt-BR', { key: 'terms' })).toBe('/termos/');
  });

  it('usa prefixo e slugs no idioma de cada mercado', () => {
    expect(pathFor('en-US', { key: 'home' })).toBe('/en-us/');
    expect(pathFor('en-US', { key: 'service', id: 'ai' })).toBe('/en-us/services/ai-chatbots/');
    expect(pathFor('es-ES', { key: 'home' })).toBe('/es-es/');
    expect(pathFor('es-ES', { key: 'industry', id: 'legal' })).toBe('/es-es/sectores/despachos-de-abogados/');
  });

  it('não repete caminhos entre páginas nem entre idiomas', () => {
    const paths = locales.flatMap((locale) => allRoutes.map((route) => pathFor(locale, route)));
    expect(new Set(paths).size).toBe(paths.length);
    expect(allRoutes).toHaveLength(1 + 1 + serviceIds.length + 1 + industryIds.length + 2);
  });

  it('todo caminho gerado volta para a mesma rota e o mesmo idioma', () => {
    for (const locale of locales) {
      for (const route of allRoutes) {
        expect(matchPath(pathFor(locale, route))).toEqual({ locale, route });
      }
    }
  });

  it('reconhece caminhos sem barra final, com âncora e com query', () => {
    expect(matchPath('/en-us/services/ai-chatbots').route).toEqual({ key: 'service', id: 'ai' });
    expect(matchPath('/es-es/#contacto').route).toEqual({ key: 'home' });
    expect(matchPath('/solucoes/sites/?utm_source=x').route).toEqual({ key: 'service', id: 'web' });
  });

  it('caminhos desconhecidos ou de outro idioma não casam com nenhuma rota', () => {
    expect(matchPath('/en-us/solucoes/sites/').route).toBeUndefined();
    expect(matchPath('/nao-existe/').route).toBeUndefined();
    expect(matchPath('/nao-existe/').locale).toBe(defaultLocale);
  });

  it('o seletor leva à mesma página em cada idioma (e à Home quando a rota é desconhecida)', () => {
    expect(alternatePaths({ key: 'service', id: 'web' })).toEqual({
      'pt-BR': '/solucoes/sites/',
      'en-US': '/en-us/services/web-development/',
      'es-ES': '/es-es/servicios/desarrollo-web/',
    });
    expect(alternatePaths(undefined)).toEqual({ 'pt-BR': '/', 'en-US': '/en-us/', 'es-ES': '/es-es/' });
  });

  it('links para seções da Home usam âncoras no idioma da página', () => {
    expect(homeSectionPath('pt-BR', 'contact')).toBe('/#contato');
    expect(homeSectionPath('en-US', 'contact')).toBe('/en-us/#contact');
    expect(homeSectionPath('es-ES', 'faq')).toBe('/es-es/#preguntas-frecuentes');
  });
});
