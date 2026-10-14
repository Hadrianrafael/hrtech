'use client';

import { useEffect } from 'react';
import { aiSourceFrom, track } from '@/lib/analytics';

/**
 * Eventos de medição e navegação por âncora:
 * - `ai_referral`: visita vinda de um assistente de IA (uma vez por sessão do navegador);
 * - cliques em elementos com `data-track="<evento>"` (ex.: `whatsapp_click`);
 * - cliques em links `#âncora`: desligam o adiamento de renderização das seções (`content-visibility`)
 *   para que a rolagem caia exatamente na seção (as alturas estimadas das seções puladas seriam imprecisas).
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const source = aiSourceFrom(document.referrer, window.location.search);
    if (source) {
      let alreadySent = false;
      try {
        alreadySent = window.sessionStorage.getItem('hrtech:ai-referral') === source;
        if (!alreadySent) window.sessionStorage.setItem('hrtech:ai-referral', source);
      } catch {
        // sem armazenamento: registra mesmo assim
      }
      if (!alreadySent) track('ai_referral', { ai_source: source, landing_path: window.location.pathname });
    }

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
      document.removeEventListener('click', onClick);
      document.removeEventListener('click', onAnchorClick, true);
    };
  }, []);
  return null;
}
