import type { Locale } from '@/lib/i18n/config';
import { enUS } from './en-US';
import { esES } from './es-ES';
import { ptBR } from './pt-BR';
import type { Dictionary } from './types';

const dictionaries: Record<Locale, Dictionary> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': esES };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from './types';
