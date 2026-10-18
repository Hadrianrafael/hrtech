import { countryLocale, isLocale, type CountryCode, type Locale } from './config';

/**
 * Detecção do idioma sugerido ao visitante.
 *
 * O site é estático (GitHub Pages), então não há cabeçalho de geolocalização
 * por IP. Usamos dois sinais que o próprio navegador fornece, sem enviar
 * dados a terceiros:
 *   1. idiomas preferidos do navegador (`navigator.languages`);
 *   2. fuso horário (`Intl`), como indicador aproximado do país.
 *
 * O resultado é apenas uma sugestão: nada aqui redireciona o visitante.
 */

/** Idioma usado quando nenhum sinal corresponde a um idioma atendido. */
export const fallbackLocale: Locale = 'en-US';

export function localeFromLanguageTag(tag: string): Locale | undefined {
  const language = tag.trim().toLowerCase().split(/[-_]/)[0];
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  if (language === 'es') return 'es-ES';
  return undefined;
}

const usTimeZone = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Boise|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;

const timeZoneCountries: [RegExp, CountryCode][] = [
  [/^(America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Maceio|Araguaina|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Eirunepe|Santarem|Noronha)|Brazil\/.+)$/, 'BR'],
  [/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/, 'ES'],
  [/^(Europe\/Lisbon|Atlantic\/(Madeira|Azores)|Portugal)$/, 'PT'],
  [usTimeZone, 'US'],
];

export function countryFromTimeZone(timeZone: string | undefined): CountryCode | undefined {
  if (!timeZone) return undefined;
  return timeZoneCountries.find(([pattern]) => pattern.test(timeZone))?.[1];
}

export type DetectionInput = { languages: readonly string[]; timeZone?: string };

/**
 * Regras, em ordem:
 *   1. se o idioma do país aparece entre os idiomas do navegador, ele vence
 *      (ex.: brasileiro com navegador em inglês, mas com português na lista);
 *   2. senão, o primeiro idioma atendido do navegador;
 *   3. senão, o idioma do país (ex.: navegador em alemão em Madri → espanhol);
 *   4. senão, `fallbackLocale`.
 */
export function detectLocale({ languages, timeZone }: DetectionInput): Locale {
  const country = countryFromTimeZone(timeZone);
  const fromCountry = country ? countryLocale[country] : undefined;
  const fromLanguages = languages.map(localeFromLanguageTag).filter((locale): locale is Locale => Boolean(locale));
  if (fromCountry && fromLanguages.includes(fromCountry)) return fromCountry;
  return fromLanguages[0] ?? fromCountry ?? fallbackLocale;
}

/** Lê os sinais do navegador atual. Só chamar no cliente. */
export function browserSignals(): DetectionInput {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean);
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  return { languages, timeZone };
}

const PREFERENCE_KEY = 'hrtech:locale';

/** Idioma escolhido manualmente pelo visitante (prevalece sobre a detecção). */
export function getStoredLocale(): Locale | undefined {
  try {
    const value = window.localStorage.getItem(PREFERENCE_KEY);
    return isLocale(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, locale);
  } catch {
    // Armazenamento bloqueado (modo privado, política do navegador): a escolha vale só para esta navegação.
  }
}
