'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n/config';
import { storeLocale } from '@/lib/i18n/detect';
import { alternatePaths, matchPath } from '@/lib/i18n/routes';

export type LanguageOption = { locale: Locale; label: string; shortLabel: string };

type Props = {
  current: Locale;
  languages: LanguageOption[];
  label: string;
  /** `short`: PT · EN · ES (cabeçalho). `long`: nome do idioma (menu móvel e rodapé). */
  variant?: 'short' | 'long';
  className?: string;
};

/**
 * Troca de idioma. Cada opção é um link comum para a mesma página no outro idioma
 * (presente no HTML estático, rastreável por buscadores). Ao clicar, a escolha é
 * guardada e passa a prevalecer sobre a detecção automática.
 */
export function LanguageSwitcher({ current, languages, label, variant = 'short', className }: Props) {
  const pathname = usePathname() ?? '/';
  const paths = alternatePaths(matchPath(pathname).route);
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center gap-1">
        {languages.map((item) => {
          const active = item.locale === current;
          return (
            <li key={item.locale}>
              <a
                href={paths[item.locale]}
                hrefLang={item.locale}
                lang={item.locale}
                aria-current={active ? 'true' : undefined}
                title={item.label}
                onClick={() => {
                  storeLocale(item.locale);
                  if (!active) track('language_change', { from: current, to: item.locale, method: 'switcher' });
                }}
                className={cn(
                  'rounded-full px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
                  variant === 'long' && 'px-3.5 py-2 text-xs normal-case tracking-normal',
                  active ? 'bg-brand/15 text-brand-soft' : 'text-muted hover:bg-white/[0.04] hover:text-fg',
                )}
              >
                {variant === 'short' ? item.shortLabel : item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
