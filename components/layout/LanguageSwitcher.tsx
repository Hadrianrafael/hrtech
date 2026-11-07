'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { getUi, localeConfig, localeFromPathname, locales, localizedPath, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

const storageKey = 'hrtech-locale';

export function LanguageSwitcher({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = localeFromPathname(pathname);
  const ui = getUi(locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = localeConfig[locale].htmlLang;
    try { localStorage.setItem(storageKey, locale); } catch { /* The route still sets the language when storage is unavailable. */ }
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const choose = (nextLocale: Locale) => {
    try { localStorage.setItem(storageKey, nextLocale); } catch { /* Navigation works without persistent storage. */ }
    document.documentElement.lang = localeConfig[nextLocale].htmlLang;
    setOpen(false);
    onNavigate?.();
    router.push(localizedPath(pathname, nextLocale));
  };

  return (
    <div ref={rootRef} className={cn('relative', mobile && 'mt-6')}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ui.selectLanguage}
        onClick={() => setOpen((value) => !value)}
        className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line/[0.12] px-3 text-sm text-muted transition-colors hover:border-brand/45 hover:text-fg', mobile && 'w-full justify-between rounded-xl px-4 py-3')}
      >
        <Icon name="globe" size={16} />
        <span>{localeConfig[locale].label}</span>
        <Icon name="arrowRight" size={14} className={cn('rotate-90 transition-transform', open && '-rotate-90')} />
      </button>
      <div
        role="listbox"
        aria-label={ui.language}
        className={cn('absolute right-0 z-[70] mt-2 min-w-44 overflow-hidden rounded-xl border border-line/[0.12] bg-elevated p-1.5 shadow-2xl transition-[opacity,visibility,transform]', mobile && 'bottom-full left-0 right-0 mb-2 mt-0', open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0')}
      >
        {locales.map((item) => (
          <button key={item} type="button" role="option" aria-selected={item === locale} onClick={() => choose(item)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06]', item === locale ? 'text-brand-soft' : 'text-muted')}>
            {localeConfig[item].label}
            {item === locale && <Icon name="check" size={15} />}
          </button>
        ))}
      </div>
    </div>
  );
}
