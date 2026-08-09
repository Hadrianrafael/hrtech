import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header, Footer, ToastProvider } from '@hrtech/ui';
import { siteConfig, mainNav, footerGroups } from '@/lib/site-config';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Desenvolvimento de Sistemas, SaaS e IA`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Desenvolvimento de Sistemas, SaaS e IA`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Desenvolvimento de Sistemas, SaaS e IA`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  email: siteConfig.email,
  sameAs: [siteConfig.whatsappHref, siteConfig.instagramUrl],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ToastProvider>
          <Header
            items={mainNav}
            ctaHref="/contato"
            whatsappHref={siteConfig.whatsappHref}
            instagramHref={siteConfig.instagramUrl}
          />
          <main className="flex-1">{children}</main>
          <Footer
            groups={footerGroups}
            whatsappHref={siteConfig.whatsappHref}
            email={siteConfig.email}
            instagramHref={siteConfig.instagramUrl}
          />
          <WhatsAppFloatingButton />
        </ToastProvider>
      </body>
    </html>
  );
}
