import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { services } from '@/data/services';
import { absoluteUrl } from '@/lib/paths';
import { defaultLocale, locales, localizedPath } from '@/lib/i18n';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/solucoes/'];
  const servicePaths = services.map((service) => `/solucoes/${service.slug}/`);

  return [...staticPaths, ...servicePaths].flatMap((path) => locales.map((locale) => ({
    url: absoluteUrl(siteConfig.url, localizedPath(path, locale)),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/solucoes') ? 0.7 : 0.5,
    alternates: { languages: {
      ...Object.fromEntries(locales.map((item) => [item, absoluteUrl(siteConfig.url, localizedPath(path, item))])),
      'x-default': absoluteUrl(siteConfig.url, localizedPath(path, defaultLocale)),
    } },
  })));
}
