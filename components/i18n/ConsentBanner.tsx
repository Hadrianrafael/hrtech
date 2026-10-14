'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n/config';
import { browserSignals, isEuropeanTimeZone } from '@/lib/i18n/detect';
import { pathFor } from '@/lib/i18n/routes';

type Props = { locale: Locale; text: { text: string; accept: string; reject: string; policy: string } };

/** Pedido de consentimento para cookies de análise — exibido apenas a visitantes com fuso horário europeu. */
export function ConsentBanner({ locale, text }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isEuropeanTimeZone(browserSignals().timeZone) && getConsent() === undefined);
  }, []);

  if (!visible) return null;
  const choose = (granted: boolean) => {
    setConsent(granted);
    setVisible(false);
  };

  return (
    <div role="dialog" aria-label={text.text} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-line/[0.16] bg-elevated/98 p-4 text-sm shadow-2xl backdrop-blur">
      <p className="text-muted">
        {text.text}{' '}
        <Link href={pathFor(locale, { key: 'privacy' })} className="text-brand-soft underline underline-offset-4 hover:no-underline">
          {text.policy}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose(true)} className="rounded-full bg-brand-strong px-4 py-2 text-xs font-medium text-white hover:bg-[#9a3412]">
          {text.accept}
        </button>
        <button type="button" onClick={() => choose(false)} className="rounded-full border border-line/[0.18] px-4 py-2 text-xs font-medium text-fg hover:bg-white/[0.05]">
          {text.reject}
        </button>
      </div>
    </div>
  );
}
