import type { Metadata, Viewport } from 'next';
import { siteConfig } from '@/config/site';
import { buildMetadata } from './seo';
import { localeConfig, type Locale } from './i18n';

export function siteMetadata(locale: Locale): Metadata {
  const copy = {
    'en-US': { title: 'Websites, Business Systems, SaaS and AI', description: siteConfig.description, keywords: ['website development', 'business systems', 'software development', 'SaaS', 'Artificial Intelligence', 'automation', 'e-commerce', 'cloud infrastructure'] },
    'pt-BR': { title: 'Sites, Sistemas, SaaS e Inteligência Artificial', description: 'A HR Tech Sistemas desenvolve sites, sistemas web, plataformas SaaS, automações e soluções com Inteligência Artificial para empresas que querem crescer com tecnologia.', keywords: [...siteConfig.keywords] },
    es: { title: 'Sitios web, Sistemas, SaaS e Inteligencia Artificial', description: 'HR Tech Sistemas desarrolla sitios web, sistemas empresariales, plataformas SaaS, automatización y soluciones de Inteligencia Artificial para empresas que quieren crecer con tecnología.', keywords: ['desarrollo de sitios web', 'sistemas empresariales', 'desarrollo de software', 'SaaS', 'Inteligencia Artificial', 'automatización', 'comercio electrónico', 'infraestructura en la nube'] },
  }[locale];
  return {
    metadataBase: new URL(siteConfig.url),
    ...buildMetadata({ title: copy.title, description: copy.description, path: `${localeConfig[locale].prefix}/`, locale }),
    applicationName: siteConfig.name,
    keywords: copy.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    formatDetection: { telephone: false },
    verification: { google: 'A4QBLq7zDow9yYiYTCHeKTYR8SlVe0F8zmZBV8mtpB0' },
    icons: { icon: [{ url: '/favicon.ico', sizes: '32x32' }, { url: '/icon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
    manifest: '/manifest.webmanifest',
  };
}

export const siteViewport: Viewport = { themeColor: '#060910', colorScheme: 'dark', width: 'device-width', initialScale: 1 };
