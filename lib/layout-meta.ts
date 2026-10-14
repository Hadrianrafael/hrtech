import type { Metadata, Viewport } from 'next';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';

/** Metadata comum a todas as páginas de um idioma (as páginas acrescentam título, canonical e hreflang). */
export function layoutMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    keywords: dict.meta.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    formatDetection: { telephone: false },
    verification: { google: siteConfig.googleSiteVerification },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.webmanifest',
  };
}

export const siteViewport: Viewport = {
  themeColor: '#060910',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};
