import Link from 'next/link';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { LanguageSwitcher, type LanguageOption } from '@/components/i18n/LanguageSwitcher';
import { Logo } from '@/components/ui/Logo';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';
import { type Locale } from '@/lib/i18n/config';
import { homeSectionPath, industryIds, pathFor, serviceIds } from '@/lib/i18n/routes';
import { whatsappLink } from '@/lib/whatsapp';
import { CurrentYear } from './CurrentYear';

export function Footer({ locale, languages }: { locale: Locale; languages: LanguageOption[] }) {
  const dict = getDictionary(locale);
  const { footer } = dict;
  const socialLinks = [
    { label: 'GitHub', href: siteConfig.social.github, icon: 'github' as const },
    { label: 'LinkedIn', href: siteConfig.social.linkedin, icon: 'linkedin' as const },
    { label: 'Instagram', href: siteConfig.social.instagram, icon: 'instagram' as const },
  ].filter((link) => link.href);

  const columns = [
    {
      title: footer.servicesTitle,
      links: serviceIds.map((id) => ({ label: dict.services[id].title, href: pathFor(locale, { key: 'service', id }) })),
    },
    {
      title: footer.industriesTitle,
      links: industryIds.map((id) => ({ label: dict.industries[id].name, href: pathFor(locale, { key: 'industry', id }) })),
    },
    {
      title: footer.companyTitle,
      links: [
        { label: footer.companyLinks.about, href: homeSectionPath(locale, 'about') },
        { label: footer.companyLinks.process, href: homeSectionPath(locale, 'process') },
        { label: footer.companyLinks.technologies, href: homeSectionPath(locale, 'technologies') },
        { label: footer.companyLinks.faq, href: homeSectionPath(locale, 'faq') },
        { label: footer.companyLinks.contact, href: homeSectionPath(locale, 'contact') },
      ],
    },
  ];

  return (
    <footer className="defer-render relative border-t border-line/[0.08] bg-surface/40">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Link href={pathFor(locale, { key: 'home' })} className="inline-block rounded-md">
              <Logo showTagline />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{footer.tagline}</p>
            <p className="mt-4 text-sm text-subtle">{footer.location}</p>
            {socialLinks.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label={dict.common.socialAria}>
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} — HR Tech ${dict.common.newTab}`}
                      className="grid h-10 w-10 place-items-center rounded-full border border-line/[0.1] text-muted transition-colors hover:border-line/[0.25] hover:text-fg"
                    >
                      <BrandIcon name={link.icon} size={17} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-9">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted transition-colors hover:text-fg">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-1">
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">{footer.contactTitle}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 break-all text-muted transition-colors hover:text-fg">
                    <Icon name="mail" size={15} className="shrink-0" />
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink(dict.whatsapp.defaultMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="whatsapp_click"
                    className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
                  >
                    <BrandIcon name="whatsapp" size={15} className="shrink-0" />
                    {siteConfig.contact.whatsappDisplay}
                  </a>
                </li>
              </ul>
              <h2 className="mt-8 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">{footer.languagesTitle}</h2>
              <LanguageSwitcher current={locale} languages={languages} label={footer.languagesTitle} variant="long" className="mt-3 -ml-3" />
            </div>
          </div>
        </div>

        <div className="hairline mt-14" />
        <div className="mt-6 flex flex-col gap-4 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {siteConfig.legalName}. {footer.rights}
            {siteConfig.cnpj && <span className="ml-1">CNPJ {siteConfig.cnpj}.</span>}
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href={pathFor(locale, { key: 'privacy' })} className="transition-colors hover:text-fg">
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link href={pathFor(locale, { key: 'terms' })} className="transition-colors hover:text-fg">
                {footer.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
