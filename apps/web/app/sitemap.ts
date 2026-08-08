import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/sobre',
    '/servicos',
    '/portfolio',
    '/solucoes',
    '/solucoes/juridico',
    '/contato',
    '/privacidade',
    '/termos',
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/solucoes/juridico' ? 0.9 : 0.7,
  }));
}
