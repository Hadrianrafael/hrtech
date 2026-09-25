import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { absoluteUrl } from '@/lib/paths';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl(siteConfig.url, '/sitemap.xml'),
  };
}
