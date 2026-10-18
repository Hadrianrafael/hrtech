import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';
import { locales, localeSettings, xDefaultLocale, type Locale } from '@/lib/i18n/config';
import { alternatePaths, pathFor, serviceIds, type Route } from '@/lib/i18n/routes';
import { absoluteUrl } from './paths';

type PageSeo = {
  locale: Locale;
  route: Route;
  title?: string;
  description?: string;
  /** Páginas `noindex` não entram no sitemap nem recebem `hreflang`. */
  noIndex?: boolean;
};

/** Mapa `hreflang` → URL absoluta: pares idioma-país, idioma genérico e `x-default`. */
export function hreflangMap(route: Route): Record<string, string> {
  const paths = alternatePaths(route);
  const map: Record<string, string> = {};
  for (const locale of locales) {
    for (const tag of localeSettings[locale].hreflang) map[tag] = absoluteUrl(siteConfig.url, paths[locale]);
  }
  map['x-default'] = absoluteUrl(siteConfig.url, paths[xDefaultLocale]);
  return map;
}

/** Metadata padronizada por página: title, canonical, hreflang, Open Graph e Twitter/X. */
export function buildMetadata({ locale, route, title, description, noIndex }: PageSeo): Metadata {
  const dict = getDictionary(locale);
  const settings = localeSettings[locale];
  const url = absoluteUrl(siteConfig.url, pathFor(locale, route));
  const fullTitle = title ? `${title} | ${siteConfig.name}` : dict.meta.siteTitle;
  const desc = description ?? dict.meta.siteDescription;
  const image = absoluteUrl(siteConfig.url, settings.ogImage);
  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: url, ...(noIndex ? {} : { languages: hreflangMap(route) }) },
    openGraph: {
      type: 'website',
      locale: settings.ogLocale,
      alternateLocale: locales.filter((item) => item !== locale).map((item) => localeSettings[item].ogLocale),
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description: desc,
      images: [{ url: image, width: 1200, height: 630, alt: dict.meta.ogImageAlt }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description: desc, images: [image] },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

export const organizationId = `${siteConfig.url}/#organization`;

const countryNames: Record<Locale, Record<string, string>> = {
  'pt-BR': { BR: 'Brasil', US: 'Estados Unidos', ES: 'Espanha' },
  'en-US': { BR: 'Brazil', US: 'United States', ES: 'Spain' },
  'es-ES': { BR: 'Brasil', US: 'Estados Unidos', ES: 'España' },
};

/** Organização + site. A mesma entidade (`@id`) é descrita em todos os idiomas. */
export function organizationSchema(locale: Locale) {
  const dict = getDictionary(locale);
  const home = absoluteUrl(siteConfig.url, pathFor(locale, { key: 'home' }));
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'ProfessionalService'],
        '@id': organizationId,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: absoluteUrl(siteConfig.url, '/'),
        logo: absoluteUrl(siteConfig.url, '/icon-512.png'),
        image: absoluteUrl(siteConfig.url, localeSettings[locale].ogImage),
        description: dict.meta.siteDescription,
        email: siteConfig.contact.email,
        telephone: `+${siteConfig.contact.whatsappNumber}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: siteConfig.city,
          addressRegion: siteConfig.region,
          addressCountry: siteConfig.country,
        },
        areaServed: siteConfig.areaServed.map((code) => ({ '@type': 'Country', name: countryNames[locale][code] })),
        availableLanguage: locales.map((item) => ({ '@type': 'Language', name: localeSettings[item].label, alternateName: item })),
        founder: { '@type': 'Person', name: siteConfig.founder.name },
        knowsAbout: dict.hero.capabilities,
        ...(sameAs.length ? { sameAs } : {}),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: dict.servicesSection.title,
          itemListElement: serviceIds.map((id) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: dict.services[id].title,
              description: dict.services[id].summary,
              url: absoluteUrl(siteConfig.url, pathFor(locale, { key: 'service', id })),
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        url: home,
        name: siteConfig.name,
        inLanguage: locale,
        publisher: { '@id': organizationId },
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(siteConfig.url, item.path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function serviceSchema(locale: Locale, route: Extract<Route, { key: 'service' | 'industry' }>) {
  const dict = getDictionary(locale);
  const isService = route.key === 'service';
  const name = isService ? dict.services[route.id].title : dict.industries[route.id].name;
  const description = isService ? dict.services[route.id].summary : dict.industries[route.id].summary;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: absoluteUrl(siteConfig.url, pathFor(locale, route)),
    provider: { '@id': organizationId },
    areaServed: siteConfig.areaServed.map((code) => ({ '@type': 'Country', name: countryNames[locale][code] })),
    ...(isService ? { serviceType: dict.services[route.id].heading } : { audience: { '@type': 'BusinessAudience', name } }),
  };
}
