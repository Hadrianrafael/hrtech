import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';
import { allRoutes, matchSegments, routeSegments, type Route } from '@/lib/i18n/routes';
import { buildMetadata } from '@/lib/seo';
import { HomePage } from './HomePage';
import { IndustriesIndexPage } from './IndustriesIndexPage';
import { IndustryPage } from './IndustryPage';
import { LegalPage } from './LegalPage';
import { ServicePage } from './ServicePage';
import { ServicesIndexPage } from './ServicesIndexPage';

export type SlugParams = { slug?: string[] };

/** Um parâmetro estático por página do site neste idioma. */
export function staticParamsFor(locale: Locale): { slug: string[] }[] {
  return allRoutes.map((route) => ({ slug: routeSegments(locale, route) }));
}

export function resolveRoute(locale: Locale, slug: string[] | undefined): Route {
  const route = matchSegments(locale, slug ?? []);
  if (!route) notFound();
  return route;
}

export function metadataFor(locale: Locale, route: Route): Metadata {
  const dict = getDictionary(locale);
  switch (route.key) {
    case 'home':
      return buildMetadata({ locale, route });
    case 'services':
      return buildMetadata({ locale, route, title: dict.servicesPage.metaTitle, description: dict.servicesPage.metaDescription });
    case 'service': {
      const service = dict.services[route.id];
      return buildMetadata({ locale, route, title: service.metaTitle, description: service.metaDescription });
    }
    case 'industries':
      return buildMetadata({ locale, route, title: dict.industriesPage.metaTitle, description: dict.industriesPage.metaDescription });
    case 'industry': {
      const industry = dict.industries[route.id];
      return buildMetadata({ locale, route, title: industry.metaTitle, description: industry.metaDescription });
    }
    case 'privacy':
    case 'terms': {
      const doc = dict.legal[route.key];
      return buildMetadata({ locale, route, title: doc.metaTitle, description: doc.metaDescription, noIndex: true });
    }
  }
}

export function RenderRoute({ locale, route }: { locale: Locale; route: Route }) {
  switch (route.key) {
    case 'home':
      return <HomePage locale={locale} />;
    case 'services':
      return <ServicesIndexPage locale={locale} />;
    case 'service':
      return <ServicePage locale={locale} id={route.id} />;
    case 'industries':
      return <IndustriesIndexPage locale={locale} />;
    case 'industry':
      return <IndustryPage locale={locale} id={route.id} />;
    case 'privacy':
    case 'terms':
      return <LegalPage locale={locale} doc={route.key} />;
  }
}
