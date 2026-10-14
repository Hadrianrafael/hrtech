import { siteConfig } from '@/config/site';

/**
 * Medição (Google Analytics 4) condicionada ao consentimento — em QUALQUER país.
 *
 * - Antes do "Aceitar", o site **não carrega** o script do Google nem grava cookies de análise.
 * - "Aceitar": carrega o GA4 (sem sinais de publicidade) e passa a registrar eventos.
 * - "Recusar" / alterar depois: desativa o GA4 na página, para novos registros e apaga os cookies
 *   de análise que o site consegue controlar (`_ga`, `_ga_<ID>`, `_gid`, `_gat*`).
 * - A decisão fica no `localStorage` (`hrtech:consent`) e pode ser mudada pelo link "Preferências de cookies".
 * - O idioma escolhido (`hrtech:locale`) é uma preferência funcional, não de rastreamento.
 */
export const CONSENT_KEY = 'hrtech:consent';
/** Evento disparado quando o visitante aceita (outros componentes podem registrar dados pendentes). */
export const CONSENT_GRANTED_EVENT = 'hrtech:consent-granted';

export type Consent = 'granted' | 'denied';

type Gtag = (command: string, ...args: unknown[]) => void;
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag; [key: `ga-disable-${string}`]: boolean };

const measurementId = siteConfig.googleAnalyticsId;

/** Nomes dos cookies de análise do Google que o site controla. */
export function isAnalyticsCookie(name: string): boolean {
  return /^_ga(_[A-Za-z0-9]+)?$/.test(name) || name === '_gid' || name.startsWith('_gat');
}

/** Cookies de análise presentes em uma string `document.cookie`. */
export function analyticsCookieNames(cookieString: string): string[] {
  return cookieString
    .split(';')
    .map((part) => part.split('=')[0]?.trim() ?? '')
    .filter((name) => name && isAnalyticsCookie(name));
}

/** Domínios em que o GA pode ter gravado o cookie: o próprio host e cada domínio-pai (`a.b.c` → `a.b.c`, `b.c`). */
export function cookieDomains(hostname: string): string[] {
  const parts = hostname.split('.');
  const domains: string[] = [];
  for (let i = 0; i <= parts.length - 2; i++) domains.push(parts.slice(i).join('.'));
  return domains.length ? domains : [hostname];
}

/** Apaga os cookies de análise do Google (host atual e domínios-pai). Retorna os nomes removidos. */
export function deleteAnalyticsCookies(): string[] {
  const names = analyticsCookieNames(document.cookie);
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  for (const name of names) {
    document.cookie = `${name}=; ${expired}`;
    for (const domain of cookieDomains(window.location.hostname)) {
      document.cookie = `${name}=; ${expired}; domain=${domain}`;
      document.cookie = `${name}=; ${expired}; domain=.${domain}`;
    }
  }
  return names;
}

export function getConsent(): Consent | undefined {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : undefined;
  } catch {
    return undefined;
  }
}

function analyticsWindow(): AnalyticsWindow {
  return window as unknown as AnalyticsWindow;
}

let loaded = false;

/** Carrega o GA4 (somente após o aceite). Não faz nada se já carregado ou sem ID configurado. */
export function loadAnalytics(): void {
  if (loaded || !measurementId || typeof window === 'undefined') return;
  const w = analyticsWindow();
  w[`ga-disable-${measurementId}`] = false;
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  w.gtag('js', new Date());
  w.gtag('config', measurementId, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  loaded = true;
}

/** Interrompe o GA4 na página atual e apaga os cookies de análise. */
export function disableAnalytics(): string[] {
  if (typeof window === 'undefined') return [];
  const w = analyticsWindow();
  if (measurementId) w[`ga-disable-${measurementId}`] = true;
  w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  return deleteAnalyticsCookies();
}

/** Registra a decisão e aplica o efeito: aceitar carrega o GA4; recusar o desativa e limpa os cookies. */
export function setConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Armazenamento bloqueado: a decisão vale apenas para esta página.
  }
  if (consent === 'granted') {
    loadAnalytics();
    window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT));
  } else {
    disableAnalytics();
  }
}

/** Ao abrir a página: só carrega o GA4 se já houver aceite gravado; com recusa, garante que não sobrem cookies. */
export function initAnalytics(): void {
  const consent = getConsent();
  if (consent === 'granted') loadAnalytics();
  else if (consent === 'denied') disableAnalytics();
}

/** Registra um evento — apenas se o visitante aceitou e o GA4 está carregado. */
export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  if (getConsent() !== 'granted') return;
  analyticsWindow().gtag?.('event', event, params);
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
