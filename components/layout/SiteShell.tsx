import type { ReactNode } from 'react';
import { RevealObserver } from '@/components/ui/RevealObserver';
import { getDictionary } from '@/content';
import { locales, localeSettings, type Locale } from '@/lib/i18n/config';
import { homeSectionPath } from '@/lib/i18n/routes';
import { AnalyticsEvents } from '@/components/i18n/AnalyticsEvents';
import { ConsentBanner } from '@/components/i18n/ConsentBanner';
import { LocaleAdvisor } from '@/components/i18n/LocaleAdvisor';
import { Footer } from './Footer';
import { Header } from './Header';
import { WhatsAppButton } from './WhatsAppButton';

export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale);
  const nav = [
    { label: dict.nav.services, href: homeSectionPath(locale, 'services') },
    { label: dict.nav.industries, href: homeSectionPath(locale, 'industries') },
    { label: dict.nav.about, href: homeSectionPath(locale, 'about') },
    { label: dict.nav.technologies, href: homeSectionPath(locale, 'technologies') },
    { label: dict.nav.contact, href: homeSectionPath(locale, 'contact') },
  ];
  const languages = locales.map((item) => ({ locale: item, label: localeSettings[item].label, shortLabel: localeSettings[item].shortLabel }));
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {dict.common.skipToContent}
      </a>
      <Header
        locale={locale}
        nav={nav}
        cta={{ label: dict.nav.cta, href: homeSectionPath(locale, 'contact') }}
        languages={languages}
        labels={{
          homeAria: dict.common.homeAria,
          mainNav: dict.common.mainNav,
          mobileNav: dict.common.mobileNav,
          menuOpen: dict.common.menuOpen,
          menuClose: dict.common.menuClose,
          language: dict.common.languageLabel,
        }}
      />
      <main id="conteudo">{children}</main>
      <Footer locale={locale} languages={languages} />
      <WhatsAppButton locale={locale} />
      <LocaleAdvisor locale={locale} />
      <ConsentBanner text={dict.consent} locale={locale} />
      <AnalyticsEvents />
      <RevealObserver />
    </>
  );
}
