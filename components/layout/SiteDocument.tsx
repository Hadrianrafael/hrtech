/* eslint-disable @next/next/no-head-element -- This component renders the document for each root layout. */
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { RevealObserver } from '@/components/ui/RevealObserver';
import { siteConfig } from '@/config/site';
import { getUi, localeConfig, type Locale } from '@/lib/i18n';
import { organizationSchema } from '@/lib/seo';
import { Footer } from './Footer';
import { Header } from './Header';
import { WhatsAppButton } from './WhatsAppButton';

const revealBootstrap = `(function(){var d=document.documentElement;if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js-reveal');setTimeout(function(){if(!window.__hrRevealReady)d.classList.remove('js-reveal')},3000)})();`;

export function SiteDocument({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <html lang={localeConfig[locale].htmlLang} data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      {locale === 'en-US' && <script dangerouslySetInnerHTML={{ __html: `(function(){try{var l=localStorage.getItem('hrtech-locale');if(l!=='pt-BR'&&l!=='es')return;var p=l==='pt-BR'?'/pt-br':'/es';var u=location.pathname;if(u==='/'||u==='/solucoes/'||u.startsWith('/solucoes/')||u==='/privacidade/'||u==='/termos/')location.replace(p+u+location.search+location.hash)}catch(e){}})();` }} />}
      <JsonLd data={organizationSchema(locale)} />
      {siteConfig.googleAnalyticsId && <>
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.googleAnalyticsId}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${siteConfig.googleAnalyticsId}');`}</Script>
      </>}
    </head>
    <body>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white">{getUi(locale).skip}</a>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <WhatsAppButton locale={locale} />
      <RevealObserver />
    </body>
  </html>;
}
