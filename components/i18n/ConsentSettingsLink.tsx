'use client';

import { REOPEN_CONSENT_EVENT } from './ConsentBanner';

/** Permite mudar ou retirar a decisão sobre cookies de análise a qualquer momento. */
export function ConsentSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(REOPEN_CONSENT_EVENT))} className="transition-colors hover:text-fg">
      {label}
    </button>
  );
}
