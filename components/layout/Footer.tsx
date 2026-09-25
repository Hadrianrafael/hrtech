import Link from 'next/link';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { Logo } from '@/components/ui/Logo';
import { siteConfig } from '@/config/site';
import { services } from '@/data/services';
import { whatsappLink } from '@/lib/whatsapp';
import { CurrentYear } from './CurrentYear';

const socialLinks = [
  { label: 'GitHub', href: siteConfig.social.github, icon: 'github' as const },
  { label: 'LinkedIn', href: siteConfig.social.linkedin, icon: 'linkedin' as const },
  { label: 'Instagram', href: siteConfig.social.instagram, icon: 'instagram' as const },
].filter((link) => link.href);

const columns = [
  {
    title: 'Soluções',
    links: services.map((service) => ({ label: service.title, href: `/solucoes/${service.slug}/` })),
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre a HR Tech', href: '/#sobre' },
      { label: 'Como trabalhamos', href: '/#processo' },
      { label: 'Tecnologias', href: '/#tecnologias' },
      { label: 'Segmentos', href: '/#segmentos' },
      { label: 'Contato', href: '/#contato' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line/[0.08] bg-surface/40">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* Sem aria-label customizado: o nome acessível vem do texto visível (marca + "Software house"). */}
            <Link href="/" className="inline-block rounded-md">
              <Logo showTagline />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Sites, sistemas, plataformas SaaS, automações e Inteligência Artificial para empresas que querem crescer com tecnologia.
            </p>
            {socialLinks.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label="Redes sociais">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} da HR Tech (abre em nova aba)`}
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
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">Contato</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 break-all text-muted transition-colors hover:text-fg">
                    <Icon name="mail" size={15} className="shrink-0" />
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li>
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg">
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
            © <CurrentYear /> {siteConfig.legalName}. Todos os direitos reservados.
            {siteConfig.cnpj && <span className="ml-1">CNPJ {siteConfig.cnpj}.</span>}
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacidade/" className="transition-colors hover:text-fg">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link href="/termos/" className="transition-colors hover:text-fg">
                Termos de Uso
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
