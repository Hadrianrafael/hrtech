import { describe, expect, it } from 'vitest';
import { countryFromTimeZone, detectLocale, localeFromLanguageTag } from '@/lib/i18n/detect';

describe('detecção de idioma', () => {
  it('reconhece o idioma pela etiqueta do navegador', () => {
    expect(localeFromLanguageTag('pt-BR')).toBe('pt-BR');
    expect(localeFromLanguageTag('pt-PT')).toBe('pt-BR');
    expect(localeFromLanguageTag('en-GB')).toBe('en-US');
    expect(localeFromLanguageTag('es_MX')).toBe('es-ES');
    expect(localeFromLanguageTag('ES')).toBe('es-ES');
    expect(localeFromLanguageTag('de-DE')).toBeUndefined();
  });

  it('infere o país pelo fuso horário', () => {
    expect(countryFromTimeZone('America/Sao_Paulo')).toBe('BR');
    expect(countryFromTimeZone('America/New_York')).toBe('US');
    expect(countryFromTimeZone('America/Los_Angeles')).toBe('US');
    expect(countryFromTimeZone('Europe/Madrid')).toBe('ES');
    expect(countryFromTimeZone('Atlantic/Canary')).toBe('ES');
    expect(countryFromTimeZone('Asia/Tokyo')).toBeUndefined();
    expect(countryFromTimeZone(undefined)).toBeUndefined();
  });

  it('Brasil → português, Estados Unidos → inglês, Espanha → espanhol', () => {
    expect(detectLocale({ languages: ['pt-BR'], timeZone: 'America/Sao_Paulo' })).toBe('pt-BR');
    expect(detectLocale({ languages: ['en-US'], timeZone: 'America/Chicago' })).toBe('en-US');
    expect(detectLocale({ languages: ['es-ES'], timeZone: 'Europe/Madrid' })).toBe('es-ES');
  });

  it('segue o idioma do navegador quando ele difere do país', () => {
    expect(detectLocale({ languages: ['en-US'], timeZone: 'America/Sao_Paulo' })).toBe('en-US');
    expect(detectLocale({ languages: ['en-US', 'es'], timeZone: 'Europe/Madrid' })).toBe('es-ES');
  });

  it('usa o idioma do país quando o navegador está em outro idioma não atendido', () => {
    expect(detectLocale({ languages: ['de-DE'], timeZone: 'Europe/Madrid' })).toBe('es-ES');
    expect(detectLocale({ languages: ['fr-FR'], timeZone: 'America/Sao_Paulo' })).toBe('pt-BR');
  });

  it('cai no inglês quando nenhum sinal corresponde a um idioma atendido', () => {
    expect(detectLocale({ languages: ['ja-JP'], timeZone: 'Asia/Tokyo' })).toBe('en-US');
    expect(detectLocale({ languages: [] })).toBe('en-US');
  });

});
