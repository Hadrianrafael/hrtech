import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { locales, type Locale } from '@/lib/i18n/config';
import { allRoutes, pathFor, type Route } from '@/lib/i18n/routes';
import { hreflangMap } from '@/lib/seo';
import { absoluteUrl } from '@/lib/paths';

export const dynamic = 'force-static';

/** Páginas `noindex` (privacidade e termos) ficam fora do sitemap. */
const indexable = (route: Route) => route.key !== 'privacy' && route.key !== 'terms';

/**
 * Sitemap multilíngue: uma entrada por página e idioma, cada uma com as alternativas
 * `hreflang` (inclusive para si mesma, como exige o Google).
 *
 * Sem `lastmod`, `changefreq` ou `priority`: não temos uma data de modificação confiável por
 * página, e informar datas imprecisas faz os buscadores ignorarem o campo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes.filter(indexable).flatMap((route) => {
    const languages = hreflangMap(route);
    return locales.map((locale: Locale) => ({
      url: absoluteUrl(siteConfig.url, pathFor(locale, route)),
      alternates: { languages },
    }));
  });
}
