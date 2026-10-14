import { defaultLocale, localeFromPrefix, localeSettings, locales, type Locale } from './config';

/**
 * Tabela de rotas do site em todos os idiomas.
 *
 * Fica separada do conteúdo para poder ser usada no navegador (seletor de
 * idioma) sem carregar os textos das páginas. As URLs em português são as
 * históricas do site e não devem mudar.
 */

export const serviceIds = ['web', 'software', 'saas', 'ai', 'automation', 'ecommerce', 'cloud'] as const;
export type ServiceId = (typeof serviceIds)[number];

export const industryIds = ['hospitality', 'solar', 'veterinary', 'legal', 'construction'] as const;
export type IndustryId = (typeof industryIds)[number];

type Localized = Record<Locale, string>;

const sectionSlugs = {
  services: { 'pt-BR': 'solucoes', 'en-US': 'services', 'es-ES': 'servicios' },
  industries: { 'pt-BR': 'segmentos', 'en-US': 'industries', 'es-ES': 'sectores' },
  privacy: { 'pt-BR': 'privacidade', 'en-US': 'privacy-policy', 'es-ES': 'politica-de-privacidad' },
  terms: { 'pt-BR': 'termos', 'en-US': 'terms-of-use', 'es-ES': 'terminos-de-uso' },
} satisfies Record<string, Localized>;

const serviceSlugs: Record<ServiceId, Localized> = {
  web: { 'pt-BR': 'sites', 'en-US': 'web-development', 'es-ES': 'desarrollo-web' },
  software: { 'pt-BR': 'sistemas', 'en-US': 'custom-software', 'es-ES': 'software-a-medida' },
  saas: { 'pt-BR': 'saas', 'en-US': 'saas-development', 'es-ES': 'desarrollo-saas' },
  ai: { 'pt-BR': 'inteligencia-artificial', 'en-US': 'ai-chatbots', 'es-ES': 'chatbots-inteligencia-artificial' },
  automation: { 'pt-BR': 'automacoes', 'en-US': 'business-automation', 'es-ES': 'automatizacion-de-procesos' },
  ecommerce: { 'pt-BR': 'e-commerce', 'en-US': 'ecommerce-development', 'es-ES': 'tiendas-online' },
  cloud: { 'pt-BR': 'cloud-infraestrutura', 'en-US': 'cloud-infrastructure', 'es-ES': 'cloud-infraestructura' },
};

const industrySlugs: Record<IndustryId, Localized> = {
  hospitality: { 'pt-BR': 'hotelaria-e-pousadas', 'en-US': 'hotels-and-inns', 'es-ES': 'hoteles-y-alojamientos' },
  solar: { 'pt-BR': 'energia-solar', 'en-US': 'solar-energy', 'es-ES': 'energia-solar' },
  veterinary: { 'pt-BR': 'clinicas-veterinarias', 'en-US': 'veterinary-clinics', 'es-ES': 'clinicas-veterinarias' },
  legal: { 'pt-BR': 'escritorios-de-advocacia', 'en-US': 'law-firms', 'es-ES': 'despachos-de-abogados' },
  construction: { 'pt-BR': 'construcao-civil-e-reformas', 'en-US': 'construction-and-remodeling', 'es-ES': 'construccion-y-reformas' },
};

/** Âncoras das seções da Home em cada idioma. */
export const homeSections = ['top', 'services', 'industries', 'about', 'founder', 'technologies', 'process', 'faq', 'contact'] as const;
export type HomeSection = (typeof homeSections)[number];

const homeAnchors: Record<Locale, Record<HomeSection, string>> = {
  'pt-BR': {
    top: 'inicio',
    services: 'solucoes',
    industries: 'segmentos',
    about: 'sobre',
    founder: 'fundador',
    technologies: 'tecnologias',
    process: 'processo',
    faq: 'perguntas-frequentes',
    contact: 'contato',
  },
  'en-US': {
    top: 'top',
    services: 'services',
    industries: 'industries',
    about: 'about',
    founder: 'founder',
    technologies: 'technology',
    process: 'process',
    faq: 'faq',
    contact: 'contact',
  },
  'es-ES': {
    top: 'inicio',
    services: 'servicios',
    industries: 'sectores',
    about: 'sobre-nosotros',
    founder: 'fundador',
    technologies: 'tecnologia',
    process: 'proceso',
    faq: 'preguntas-frecuentes',
    contact: 'contacto',
  },
};

export type Route =
  | { key: 'home' }
  | { key: 'services' }
  | { key: 'service'; id: ServiceId }
  | { key: 'industries' }
  | { key: 'industry'; id: IndustryId }
  | { key: 'privacy' }
  | { key: 'terms' };

/** Todas as páginas do site (iguais em todos os idiomas). */
export const allRoutes: Route[] = [
  { key: 'home' },
  { key: 'services' },
  ...serviceIds.map((id) => ({ key: 'service' as const, id })),
  { key: 'industries' },
  ...industryIds.map((id) => ({ key: 'industry' as const, id })),
  { key: 'privacy' },
  { key: 'terms' },
];

/** Segmentos da URL, sem o prefixo de idioma. */
export function routeSegments(locale: Locale, route: Route): string[] {
  switch (route.key) {
    case 'home':
      return [];
    case 'services':
    case 'industries':
    case 'privacy':
    case 'terms':
      return [sectionSlugs[route.key][locale]];
    case 'service':
      return [sectionSlugs.services[locale], serviceSlugs[route.id][locale]];
    case 'industry':
      return [sectionSlugs.industries[locale], industrySlugs[route.id][locale]];
  }
}

/** Caminho da página com barra final (o site usa `trailingSlash`). */
export function pathFor(locale: Locale, route: Route): string {
  const parts = [localeSettings[locale].prefix, ...routeSegments(locale, route)].filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : '/';
}

export function homeAnchor(locale: Locale, section: HomeSection): string {
  return homeAnchors[locale][section];
}

/** Link para uma seção da Home (ex.: `/en-us/#contact`). */
export function homeSectionPath(locale: Locale, section: HomeSection): string {
  return `${pathFor(locale, { key: 'home' })}#${homeAnchor(locale, section)}`;
}

function findKey<T extends string>(table: Record<T, Localized>, locale: Locale, slug: string): T | undefined {
  return (Object.keys(table) as T[]).find((key) => table[key][locale] === slug);
}

/** Encontra a rota a partir dos segmentos da URL (sem o prefixo de idioma). */
export function matchSegments(locale: Locale, segments: string[]): Route | undefined {
  const [section, slug, ...rest] = segments;
  if (rest.length) return undefined;
  if (section === undefined) return { key: 'home' };
  const sectionKey = findKey(sectionSlugs, locale, section);
  if (!sectionKey) return undefined;
  if (slug === undefined) return { key: sectionKey };
  if (sectionKey === 'services') {
    const id = findKey(serviceSlugs, locale, slug);
    return id && { key: 'service', id };
  }
  if (sectionKey === 'industries') {
    const id = findKey(industrySlugs, locale, slug);
    return id && { key: 'industry', id };
  }
  return undefined;
}

/** Identifica idioma e rota de um caminho completo (ex.: `usePathname()`). */
export function matchPath(pathname: string): { locale: Locale; route: Route | undefined } {
  const segments = pathname.split(/[?#]/)[0]!.split('/').filter(Boolean).map(decodeURIComponent);
  const prefixed = localeFromPrefix(segments[0]);
  const locale = prefixed ?? defaultLocale;
  const rest = prefixed ? segments.slice(1) : segments;
  return { locale, route: matchSegments(locale, rest) };
}

/** A mesma página em todos os idiomas. Rotas desconhecidas (404) levam à Home de cada idioma. */
export function alternatePaths(route: Route | undefined): Record<Locale, string> {
  const target = route ?? { key: 'home' };
  return Object.fromEntries(locales.map((locale) => [locale, pathFor(locale, target)])) as Record<Locale, string>;
}
