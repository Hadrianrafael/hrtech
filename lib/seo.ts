import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { services } from '@/data/services';
import { absoluteUrl } from './paths';

type PageSeo = {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

const defaultOgImage = '/og.png';

/** Metadata padronizada por página (title, canonical, Open Graph e Twitter/X). */
export function buildMetadata({ title, description = siteConfig.description, path, image = defaultOgImage, noIndex }: PageSeo): Metadata {
  const url = absoluteUrl(siteConfig.url, path);
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  return {
    title: title ? { absolute: fullTitle } : { absolute: siteConfig.title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [{ url: absoluteUrl(siteConfig.url, image), width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [absoluteUrl(siteConfig.url, image)],
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

const organizationId = `${siteConfig.url}/#organization`;

export function organizationSchema() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  const address = {
    '@type': 'PostalAddress',
    ...(siteConfig.city ? { addressLocality: siteConfig.city } : {}),
    addressRegion: siteConfig.region,
    addressCountry: siteConfig.country,
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'ProfessionalService'],
        '@id': organizationId,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        logo: absoluteUrl(siteConfig.url, '/icon-512.png'),
        image: absoluteUrl(siteConfig.url, defaultOgImage),
        description: siteConfig.description,
        email: siteConfig.contact.email,
        telephone: `+${siteConfig.contact.whatsappNumber}`,
        address,
        areaServed: { '@type': 'Country', name: 'Brasil' },
        founder: { '@type': 'Person', name: 'Hadrian Rafael Silva de Oliveira', jobTitle: 'Fundador & Desenvolvedor' },
        sameAs,
        knowsAbout: ['Desenvolvimento de sites', 'Desenvolvimento de sistemas', 'SaaS', 'Inteligência Artificial', 'Automação de processos', 'Cloud computing'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Soluções HR Tech',
          itemListElement: services.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.title,
              description: service.summary,
              url: absoluteUrl(siteConfig.url, `/solucoes/${service.slug}/`),
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: 'pt-BR',
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

export { organizationId };
