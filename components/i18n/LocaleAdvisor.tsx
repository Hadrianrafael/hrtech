'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { track } from '@/lib/analytics';
import { localeSettings, type Locale } from '@/lib/i18n/config';
import { browserSignals, detectLocale, getStoredLocale, storeLocale } from '@/lib/i18n/detect';
import { alternatePaths, matchPath } from '@/lib/i18n/routes';

/** O aviso aparece no idioma sugerido (é nele que o visitante vai ler). */
const advisorText: Record<Locale, { message: string; action: string; dismiss: string }> = {
  'pt-BR': { message: 'Este site também está disponível em português.', action: 'Ver em português', dismiss: 'Dispensar aviso de idioma' },
  'en-US': { message: 'This website is also available in English.', action: 'View in English', dismiss: 'Dismiss language notice' },
  'es-ES': { message: 'Este sitio también está disponible en español.', action: 'Ver en español', dismiss: 'Descartar el aviso de idioma' },
};

const DISMISS_KEY = 'hrtech:locale-notice-dismissed';

type Suggestion = { locale: Locale; href: string };

/**
 * Sugestão de idioma — nunca um redirecionamento forçado.
 *
 * Ordem de prioridade:
 *   1. preferência manual guardada (`hrtech:locale`);
 *   2. detecção automática: idiomas do navegador + fuso horário (país aproximado).
 *
 * Só uma preferência **manual** pode levar o visitante, sozinho, para outro idioma, e apenas
 * ao chegar na Home da raiz (`/`). Robôs de busca não guardam preferências, então sempre
 * recebem a página que solicitaram. Em qualquer outra situação, mostramos um aviso discreto.
 */
export function LocaleAdvisor({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    const { route } = matchPath(pathname);
    const paths = alternatePaths(route);
    const stored = getStoredLocale();

    if (stored && stored !== locale) {
      if (pathname === '/' && !window.location.hash) {
        track('language_change', { from: locale, to: stored, method: 'stored_preference' });
        router.replace(paths[stored]);
        return;
      }
      setSuggestion({ locale: stored, href: paths[stored] });
      return;
    }
    if (stored) return; // já está no idioma que o visitante escolheu

    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }
    if (dismissed) return;
    const detected = detectLocale(browserSignals());
    if (detected !== locale) setSuggestion({ locale: detected, href: paths[detected] });
  }, [pathname, locale, router]);

  if (!suggestion) return null;
  const text = advisorText[suggestion.locale];
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // sem armazenamento: o aviso volta na próxima página
    }
    setSuggestion(null);
  };

  return (
    <div
      role="region"
      aria-label={localeSettings[suggestion.locale].label}
      lang={suggestion.locale}
      className="fixed inset-x-3 top-[calc(var(--header-h)+0.75rem)] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-line/[0.14] bg-elevated/95 px-4 py-3 text-sm shadow-2xl backdrop-blur sm:left-auto sm:right-6 sm:mx-0"
    >
      <p className="min-w-0 flex-1 text-muted">{text.message}</p>
      <a
        href={suggestion.href}
        hrefLang={suggestion.locale}
        onClick={() => {
          storeLocale(suggestion.locale);
          track('language_change', { from: locale, to: suggestion.locale, method: 'notice' });
        }}
        className="shrink-0 rounded-full bg-brand-strong px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#9a3412]"
      >
        {text.action}
      </a>
      <button type="button" onClick={dismiss} aria-label={text.dismiss} className="shrink-0 rounded-full p-1.5 text-subtle hover:text-fg">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
