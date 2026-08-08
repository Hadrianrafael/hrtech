import * as React from 'react';
import { IconBrandWhatsapp, IconBrandLinkedin, IconBrandInstagram, IconMail } from '@tabler/icons-react';
import { Logo } from './Logo';

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  groups: FooterLinkGroup[];
  whatsappHref?: string;
  email?: string;
  linkedinHref?: string;
  instagramHref?: string;
}

export function Footer({ groups, whatsappHref, email, linkedinHref, instagramHref }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              Desenvolvimento de sistemas, plataformas SaaS, Inteligência Artificial e automações empresariais.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <IconBrandWhatsapp size={17} />
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  aria-label="E-mail"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <IconMail size={17} />
                </a>
              )}
              {linkedinHref && (
                <a
                  href={linkedinHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <IconBrandLinkedin size={17} />
                </a>
              )}
              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <IconBrandInstagram size={17} />
                </a>
              )}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white">{group.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-white/35 md:flex-row md:items-center">
          <span>© {year} HR Tech. Todos os direitos reservados.</span>
          <span>Feito com engenharia de software de padrão internacional.</span>
        </div>
      </div>
    </footer>
  );
}
