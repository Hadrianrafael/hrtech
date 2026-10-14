'use client';

import { useEffect } from 'react';
import { CONSENT_GRANTED_EVENT, aiSourceFrom, getConsent, track } from '@/lib/analytics';

/**
 * Eventos de medição (só funcionam com consentimento — `track` ignora a chamada sem ele):
 * - `ai_referral`: visita vinda de um assistente de IA (uma vez por sessão do navegador). Se o aceite vier
 *   depois da chegada, é registrado nesse momento;
 * - cliques em elementos com `data-track="<evento>"` (ex.: `whatsapp_click`).
 * Também trata a navegação por âncora: cliques em links `#âncora` desligam o adiamento de renderização
 * das seções (`content-visibility`) para a rolagem cair exatamente na seção.
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const reportAiReferral = () => {
      if (getConsent() !== 'granted') return;
      const source = aiSourceFrom(document.referrer, window.location.search);
      if (!source) return;
      try {
        if (window.sessionStorage.getItem('hrtech:ai-referral') === source) return;
        window.sessionStorage.setItem('hrtech:ai-referral', source);
      } catch {
        // sem armazenamento: registra mesmo assim
      }
      track('ai_referral', { ai_source: source, landing_path: window.location.pathname });
    };
    reportAiReferral();
    window.addEventListener(CONSENT_GRANTED_EVENT, reportAiReferral);

    const onAnchorClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href*="#"]') : null;
      if (link) document.documentElement.classList.add('no-defer');
    };
    document.addEventListener('click', onAnchorClick, true);

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-track]') : null;
      const name = target?.dataset.track;
      if (name) track(name, { page_path: window.location.pathname, page_language: document.documentElement.lang });
    };
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener(CONSENT_GRANTED_EVENT, reportAiReferral);
      document.removeEventListener('click', onClick);
      document.removeEventListener('click', onAnchorClick, true);
    };
  }, []);
  return null;
}
