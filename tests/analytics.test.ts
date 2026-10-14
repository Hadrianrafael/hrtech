import { describe, expect, it } from 'vitest';
import { aiSourceFrom, analyticsBootstrap } from '@/lib/analytics';

describe('aiSourceFrom', () => {
  it('identifica o ChatGPT pelo utm_source que ele acrescenta aos links', () => {
    expect(aiSourceFrom('', '?utm_source=chatgpt.com')).toBe('chatgpt');
  });

  it('identifica assistentes pelo referrer', () => {
    expect(aiSourceFrom('https://chatgpt.com/', '')).toBe('chatgpt');
    expect(aiSourceFrom('https://www.perplexity.ai/search/abc', '')).toBe('perplexity');
    expect(aiSourceFrom('https://gemini.google.com/app', '')).toBe('gemini');
    expect(aiSourceFrom('https://claude.ai/chat/1', '')).toBe('claude');
    expect(aiSourceFrom('https://copilot.microsoft.com/', '')).toBe('copilot');
  });

  it('ignora buscas comuns, redes sociais e referrers inválidos', () => {
    expect(aiSourceFrom('https://www.google.com/', '')).toBeUndefined();
    expect(aiSourceFrom('https://www.instagram.com/', '?utm_source=instagram')).toBeUndefined();
    expect(aiSourceFrom('não é url', '')).toBeUndefined();
    expect(aiSourceFrom('', '')).toBeUndefined();
  });
});

describe('analyticsBootstrap', () => {
  it('é JavaScript válido e define o consentimento padrão antes de configurar o GA', () => {
    expect(() => new Function(analyticsBootstrap)).not.toThrow();
    expect(analyticsBootstrap.indexOf("'consent','default'")).toBeLessThan(analyticsBootstrap.indexOf("'config'"));
    expect(analyticsBootstrap).toContain("ad_storage:'denied'");
  });

  it('nega a análise por padrão para fusos europeus e respeita a decisão guardada', () => {
    const run = (tz: string, stored: string) => {
      const calls: unknown[][] = [];
      const store: Record<string, string> = stored ? { 'hrtech:consent': stored } : {};
      const fakeWindow: Record<string, unknown> = { dataLayer: [] };
      const fn = new Function('window', 'localStorage', 'Intl', 'dataLayer', `${analyticsBootstrap}; return window.dataLayer;`);
      const layer = fn(
        fakeWindow,
        { getItem: (key: string) => store[key] ?? null },
        { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: tz }) }) },
        fakeWindow.dataLayer,
      ) as unknown[];
      for (const entry of layer) calls.push(Array.from(entry as ArrayLike<unknown>));
      return calls.find((call) => call[0] === 'consent' && call[1] === 'default')?.[2] as { analytics_storage: string };
    };
    expect(run('Europe/Madrid', '').analytics_storage).toBe('denied');
    expect(run('America/Sao_Paulo', '').analytics_storage).toBe('granted');
    expect(run('Europe/Madrid', 'granted').analytics_storage).toBe('granted');
    expect(run('America/Sao_Paulo', 'denied').analytics_storage).toBe('denied');
  });
});
