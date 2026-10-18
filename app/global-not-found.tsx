import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { locales, localeSettings } from '@/lib/i18n/config';
import { getDictionary } from '@/content';
import { pathFor } from '@/lib/i18n/routes';
import './globals.css';

export const metadata: Metadata = {
  title: '404 | HR Tech Sistemas',
  robots: { index: false, follow: false },
};

/**
 * Página 404 única do site (o GitHub Pages serve um só `404.html` para todos os caminhos),
 * por isso a mensagem aparece nos três idiomas, cada bloco marcado com o seu `lang`.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-16 text-center">
          <p className="font-mono text-sm text-brand-soft">404</p>
          {locales.map((locale) => {
            const text = getDictionary(locale).notFound;
            return (
              <section key={locale} lang={locale} className="max-w-md">
                <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{text.title}</h1>
                <p className="mt-3 text-base leading-relaxed text-muted">{text.text}</p>
                <a
                  href={pathFor(locale, { key: 'home' })}
                  hrefLang={locale}
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-strong px-6 text-sm font-medium text-white hover:bg-[#9a3412]"
                >
                  {text.cta} · {localeSettings[locale].label}
                </a>
              </section>
            );
          })}
        </main>
      </body>
    </html>
  );
}
