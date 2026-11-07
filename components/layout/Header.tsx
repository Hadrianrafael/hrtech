'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { getUi, localeConfig, localeFromPathname } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const ui = getUi(locale);
  const home = localeConfig[locale].prefix || '/';
  const anchor = (id: string) => `${localeConfig[locale].prefix || ''}/#${id}`;
  const nav = [
    { label: ui.home, href: anchor('inicio') },
    { label: ui.solutions, href: anchor('solucoes') },
    { label: ui.about, href: anchor('sobre') },
    { label: ui.technologies, href: anchor('tecnologias') },
    { label: ui.contact, href: anchor('contato') },
  ];
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha o menu ao trocar de página.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    // Fragmento, não <header> único: o menu mobile é `fixed` fora do header
    // porque o `backdrop-blur` do header criaria um containing block para
    // filhos `fixed`, zerando a altura calculada por `top`/`bottom`.
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
          open ? 'border-b border-line/[0.08] bg-bg/95 backdrop-blur-xl' : scrolled ? 'border-b border-line/[0.08] bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent',
        )}
      >
        <div className="container flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href={home} className="shrink-0 rounded-md" aria-label={`HR Tech Sistemas — ${ui.home}`}>
            <Logo />
          </Link>

          <nav aria-label={ui.mainNav} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block"><LanguageSwitcher /></div>
            <ButtonLink href={anchor('contato')} size="sm" className="hidden sm:inline-flex">
              {ui.startProject}
              <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </ButtonLink>
            <button
              ref={toggleRef}
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-line/[0.1] text-fg transition-colors hover:bg-white/[0.05] lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? ui.closeMenu : ui.openMenu}
              onClick={() => setOpen((value) => !value)}
            >
              <Icon name={open ? 'close' : 'menu'} size={19} />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={cn(
          'fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto bg-bg/[0.98] backdrop-blur-xl transition-[opacity,visibility] duration-300 lg:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        aria-hidden={!open}
      >
        <nav aria-label={ui.mobileNav} className="container flex min-h-full flex-col pb-10 pt-6">
          <ul className="flex flex-col">
            {nav.map((item, index) => (
              <li
                key={item.href}
                className={cn('border-b border-line/[0.07] transition-[opacity,transform] duration-500', open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}
                style={{ transitionDelay: open ? `${80 + index * 40}ms` : '0ms' }}
              >
                <Link
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 text-2xl font-medium tracking-tight text-fg"
                >
                  {item.label}
                  <Icon name="arrowUpRight" size={18} className="text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
          <LanguageSwitcher mobile onNavigate={() => setOpen(false)} />
          <ButtonLink href={anchor('contato')} size="lg" className="mt-4 w-full" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            {ui.startProject}
            <Icon name="arrowRight" size={16} />
          </ButtonLink>
        </nav>
      </div>
    </>
  );
}
