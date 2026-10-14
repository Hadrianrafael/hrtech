import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const dict = getDictionary('pt-BR');
  return {
    name: dict.meta.siteTitle,
    short_name: siteConfig.shortName,
    description: dict.meta.siteDescription,
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
    background_color: '#060910',
    theme_color: '#060910',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
