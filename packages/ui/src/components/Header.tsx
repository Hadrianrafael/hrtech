'use client';

import * as React from 'react';
import { IconMenu2 } from '@tabler/icons-react';
import { cn } from '../lib/cn';
import { Button } from './Button';
import { Menu, type MenuItem } from './Menu';
import { Logo } from './Logo';

export interface HeaderProps {
  items: MenuItem[];
  activeHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
  whatsappHref?: string;
  instagramHref?: string;
}

export function Header({
  items,
  activeHref,
  ctaLabel = 'Solicitar Orçamento',
  ctaHref = '/contato',
  whatsappHref,
  instagramHref,
}: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full transition-colors duration-300',
        scrolled ? 'bg-bg/80 backdrop-blur-md border-b border-border' : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="/" aria-label="HR Tech — Início" className="flex items-center gap-2">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-ink/60 transition-colors hover:text-ink',
                activeHref === item.href && 'text-ink',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href={ctaHref} size="sm">
            {ctaLabel}
          </Button>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink/70 hover:bg-ink/[0.05] lg:hidden"
        >
          <IconMenu2 size={22} />
        </button>
      </div>

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        activeHref={activeHref}
        whatsappHref={whatsappHref}
        instagramHref={instagramHref}
        cta={
          <Button href={ctaHref} fullWidth>
            {ctaLabel}
          </Button>
        }
      />
    </header>
  );
}
