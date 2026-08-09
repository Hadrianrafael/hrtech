import type { Metadata } from 'next';
import { siteConfig } from './site-config';

/**
 * Per-page title/description alone don't propagate into openGraph/twitter —
 * Next.js only deep-merges metadata objects, it doesn't derive one field
 * from another. Without this, every page shared on WhatsApp/LinkedIn shows
 * the homepage's generic preview card instead of its own.
 */
export function pageMetadata(title: string, description: string, path = ''): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = `${title} — ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
    },
    twitter: {
      title: fullTitle,
      description,
    },
  };
}
