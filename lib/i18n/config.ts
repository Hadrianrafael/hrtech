/**
 * Idiomas do site.
 *
 * Para acrescentar um novo mercado: inclua o código em `locales`, preencha
 * `localeSettings`, os slugs em `lib/i18n/routes.ts` e crie o dicionário em
 * `content/<locale>/`. O TypeScript aponta tudo o que faltar.
 */
export const locales = ['pt-BR', 'en-US', 'es-ES'] as const;
export type Locale = (typeof locales)[number];

/** Idioma servido na raiz do domínio (URLs históricas do site). */
export const defaultLocale: Locale = 'pt-BR';

/** Versão indicada em `hreflang="x-default"`: visitantes de idiomas não atendidos. */
export const xDefaultLocale: Locale = 'en-US';

export type CountryCode = 'BR' | 'US' | 'ES' | 'PT';
export type Currency = 'BRL' | 'USD' | 'EUR';

type LocaleSettings = {
  /** Primeiro segmento da URL. Vazio = raiz. */
  prefix: string;
  /** Nome do idioma no próprio idioma (seletor). */
  label: string;
  shortLabel: string;
  /** Formato do Open Graph (`og:locale`). */
  ogLocale: string;
  /**
   * Códigos `hreflang` que apontam para esta versão. Além do par idioma-país,
   * o idioma genérico cobre falantes de outros países (ex.: `es` no México,
   * `pt` em Portugal), que de outra forma cairiam no `x-default`.
   */
  hreflang: string[];
  /** Mercado principal da versão. */
  country: CountryCode;
  currency: Currency;
  ogImage: string;
};

export const localeSettings: Record<Locale, LocaleSettings> = {
  'pt-BR': {
    prefix: '',
    label: 'Português',
    shortLabel: 'PT',
    ogLocale: 'pt_BR',
    hreflang: ['pt-BR', 'pt'],
    country: 'BR',
    currency: 'BRL',
    ogImage: '/og.png',
  },
  'en-US': {
    prefix: 'en-us',
    label: 'English',
    shortLabel: 'EN',
    ogLocale: 'en_US',
    hreflang: ['en-US', 'en'],
    country: 'US',
    currency: 'USD',
    ogImage: '/og-en-us.png',
  },
  'es-ES': {
    prefix: 'es-es',
    label: 'Español',
    shortLabel: 'ES',
    ogLocale: 'es_ES',
    hreflang: ['es-ES', 'es'],
    country: 'ES',
    currency: 'EUR',
    ogImage: '/og-es-es.png',
  },
};

/** Idioma sugerido para visitantes de cada país (detecção aproximada). */
export const countryLocale: Record<CountryCode, Locale> = {
  BR: 'pt-BR',
  PT: 'pt-BR',
  US: 'en-US',
  ES: 'es-ES',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Idiomas servidos com prefixo (`/en-us/`, `/es-es/`). */
export const prefixedLocales = locales.filter((locale) => localeSettings[locale].prefix !== '');

export function localeFromPrefix(prefix: string | undefined): Locale | undefined {
  if (!prefix) return undefined;
  return prefixedLocales.find((locale) => localeSettings[locale].prefix === prefix.toLowerCase());
}
