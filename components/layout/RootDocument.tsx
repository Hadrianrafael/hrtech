/* eslint-disable @next/next/no-head-element -- App Router: o <head> do documento raiz é o lugar suportado para JSON-LD e scripts de análise. */
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Locale } from '@/lib/i18n/config';
import { organizationSchema } from '@/lib/seo';
import { SiteShell } from './SiteShell';

/**
 * Esconde elementos com [data-reveal] só quando o JS está ativo, com
 * failsafe: se o JavaScript da página não carregar em 3s, tudo volta a aparecer.
 */
const revealBootstrap = `(function(){var d=document.documentElement;if(location.hash)d.classList.add('no-defer');if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js-reveal');setTimeout(function(){if(!window.__hrRevealReady)d.classList.remove('js-reveal')},3000)})();`;

/**
 * Documento HTML completo de um idioma. Cada idioma tem seu próprio layout raiz
 * (`app/(pt)/layout.tsx`, `app/en-us/layout.tsx`, `app/es-es/layout.tsx`) para que
 * o atributo `lang` esteja correto já no HTML estático, sem depender de JavaScript.
 */
export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
        <JsonLd data={organizationSchema(locale)} />
      </head>
      <body>
        <SiteShell locale={locale}>{children}</SiteShell>
      </body>
    </html>
  );
}
