'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { Logo } from '@/components/ui/Logo';
import { siteConfig } from '@/config/site';
import { services } from '@/data/services';
import { translatedService } from '@/data/service-translations';
import { whatsappLink } from '@/lib/whatsapp';
import { getUi, localeConfig, localeFromPathname, whatsappGreeting } from '@/lib/i18n';
import { CurrentYear } from './CurrentYear';

const socialLinks = [
  { label: 'GitHub', href: siteConfig.social.github, icon: 'github' as const },
  { label: 'LinkedIn', href: siteConfig.social.linkedin, icon: 'linkedin' as const },
  { label: 'Instagram', href: siteConfig.social.instagram, icon: 'instagram' as const },
].filter((link) => link.href);

export function Footer() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const ui = getUi(locale);
  const prefix = localeConfig[locale].prefix;
  const home = prefix || '/';
  const columns = [
    { title: ui.solutions, links: services.map((service) => ({ label: translatedService(service, locale).title, href: `${prefix}/solucoes/${service.slug}/` })) },
    { title: ui.company, links: [
      { label: ui.about, href: `${prefix}/#sobre` }, { label: ui.process, href: `${prefix}/#processo` },
      { label: ui.technologies, href: `${prefix}/#tecnologias` }, { label: ui.segments, href: `${prefix}/#segmentos` }, { label: ui.contact, href: `${prefix}/#contato` },
    ] },
  ];
  return (
    <footer className="relative border-t border-line/[0.08] bg-surface/40">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* Sem aria-label customizado: o nome acessível vem do texto visível (marca + "Software house"). */}
            <Link href={home} className="inline-block rounded-md">
              <Logo showTagline />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {ui.footerDescription}
            </p>
            {socialLinks.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label={ui.social}>
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} — ${ui.newTab}`}
                      className="grid h-10 w-10 place-items-center rounded-full border border-line/[0.1] text-muted transition-colors hover:border-line/[0.25] hover:text-fg"
                    >
                      <BrandIcon name={link.icon} size={17} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
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
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">{ui.contact}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 break-all text-muted transition-colors hover:text-fg">
                    <Icon name="mail" size={15} className="shrink-0" />
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li>
                  <a href={whatsappLink(whatsappGreeting(locale))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                    <BrandIcon name="whatsapp" size={15} className="shrink-0" />
                    {siteConfig.contact.whatsappDisplay}
                  </a>
                </li>
                {siteConfig.social.github && (
                  <li>
                    <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                      <BrandIcon name="github" size={15} className="shrink-0" />
                      GitHub
                    </a>
                  </li>
                )}
                {siteConfig.social.linkedin && (
                  <li>
                    <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
                      <BrandIcon name="linkedin" size={15} className="shrink-0" />
                      LinkedIn
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="hairline mt-14" />
        <div className="mt-6 flex flex-col gap-4 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {siteConfig.legalName}. {ui.rights}
            {siteConfig.cnpj && <span className="ml-1">CNPJ {siteConfig.cnpj}.</span>}
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href={`${prefix}/privacidade/`} className="transition-colors hover:text-fg">
                {ui.privacy}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/termos/`} className="transition-colors hover:text-fg">
                {ui.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
