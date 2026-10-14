import { siteConfig } from '@/config/site';

/**
 * Medição (GA4) com Consent Mode v2.
 *
 * - Fora da Europa, a medição funciona como antes.
 * - Para visitantes com fuso horário europeu (indicador aproximado do EEE/Reino Unido/Suíça),
 *   `analytics_storage` começa "denied" e só muda após o clique em "Aceitar".
 *   Sem consentimento, o Google Analytics não grava cookies.
 * - A decisão fica em `localStorage` (`hrtech:consent`).
 */
export const CONSENT_KEY = 'hrtech:consent';

/** Executado antes do GA, no <head> (JavaScript puro, sem dependências). */
export const analyticsBootstrap = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;(function(){var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}var eu=/^(Europe\\/|Atlantic\\/(Canary|Madeira|Azores|Faroe|Reykjavik)|Africa\\/Ceuta)/.test(tz);var c='';try{c=localStorage.getItem('${CONSENT_KEY}')||''}catch(e){}var granted=c==='granted'||(!eu&&c!=='denied');gtag('consent','default',{analytics_storage:granted?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${siteConfig.googleAnalyticsId}');})();`;

type Gtag = (command: string, ...args: unknown[]) => void;

function gtag(): Gtag | undefined {
  return typeof window === 'undefined' ? undefined : (window as unknown as { gtag?: Gtag }).gtag;
}

export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  gtag()?.('event', event, params);
}

export function setConsent(granted: boolean): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    // Armazenamento bloqueado: a decisão vale apenas para esta página.
  }
  gtag()?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
}

export function getConsent(): 'granted' | 'denied' | undefined {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Assistentes de IA e buscadores que enviam visitas identificáveis.
 * ChatGPT acrescenta `utm_source=chatgpt.com` aos links; os demais aparecem no `referrer`.
 * Isso mede cliques vindos das respostas — não prova que a página foi "indexada" por eles.
 */
const aiReferrers: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'gemini'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)you\.com$/, 'you'],
  [/(^|\.)poe\.com$/, 'poe'],
];

export function aiSourceFrom(referrer: string, search: string): string | undefined {
  const utm = new URLSearchParams(search).get('utm_source')?.toLowerCase() ?? '';
  for (const [pattern, name] of aiReferrers) {
    if (utm && pattern.test(utm)) return name;
  }
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname : '';
  } catch {
    host = '';
  }
  for (const [pattern, name] of aiReferrers) {
    if (host && pattern.test(host)) return name;
  }
  return undefined;
}
