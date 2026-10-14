'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConsent, initAnalytics, setConsent } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n/config';
import { pathFor } from '@/lib/i18n/routes';

export const REOPEN_CONSENT_EVENT = 'hrtech:open-consent';

type Props = { locale: Locale; text: { text: string; accept: string; reject: string; policy: string } };

/**
 * Pedido de consentimento para cookies de análise — para todos os visitantes, em qualquer país.
 * Recusar e aceitar têm o mesmo destaque. Enquanto não houver aceite, o Google Analytics não é carregado.
 */
export function ConsentBanner({ locale, text }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initAnalytics();
    setVisible(getConsent() === undefined);
    // O link "Preferências de cookies" do rodapé reabre o aviso para alterar ou retirar a decisão.
    const reopen = () => setVisible(true);
    window.addEventListener(REOPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!visible) return null;
  const choose = (granted: boolean) => {
    setConsent(granted ? 'granted' : 'denied');
    setVisible(false);
  };
  const buttonClass = 'rounded-full border border-line/[0.18] px-4 py-2 text-xs font-medium text-fg hover:bg-white/[0.07]';

  return (
    <div role="dialog" aria-label={text.text} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-line/[0.16] bg-elevated/98 p-4 text-sm shadow-2xl backdrop-blur">
      <p className="text-muted">
        {text.text}{' '}
        <Link href={pathFor(locale, { key: 'privacy' })} className="text-brand-soft underline underline-offset-4 hover:no-underline">
          {text.policy}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose(true)} className={buttonClass}>
          {text.accept}
        </button>
        <button type="button" onClick={() => choose(false)} className={buttonClass}>
          {text.reject}
        </button>
      </div>
    </div>
  );
}
