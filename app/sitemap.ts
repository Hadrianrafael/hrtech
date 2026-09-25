import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { services } from '@/data/services';
import { absoluteUrl } from '@/lib/paths';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/solucoes/', '/privacidade/', '/termos/'];
  const servicePaths = services.map((service) => `/solucoes/${service.slug}/`);

  return [...staticPaths, ...servicePaths].map((path) => ({
    url: absoluteUrl(siteConfig.url, path),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/solucoes') ? 0.7 : 0.5,
  }));
}
