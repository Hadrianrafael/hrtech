import { describe, expect, it } from 'vitest';
import { aiSourceFrom, analyticsCookieNames, cookieDomains, isAnalyticsCookie } from '@/lib/analytics';

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

describe('cookies de análise', () => {
  it('reconhece apenas os cookies do Google Analytics', () => {
    for (const name of ['_ga', '_ga_B9NPFJ0FP5', '_gid', '_gat', '_gat_gtag_G_B9NPFJ0FP5']) expect(isAnalyticsCookie(name)).toBe(true);
    for (const name of ['session', 'hrtech', '_gaming', 'ga', '_fbp']) expect(isAnalyticsCookie(name)).toBe(false);
  });

  it('extrai de document.cookie somente os de análise, preservando os demais', () => {
    expect(analyticsCookieNames('a=1; _ga=GA1.1.2; theme=dark; _ga_B9NPFJ0FP5=GS1; _gid=x')).toEqual(['_ga', '_ga_B9NPFJ0FP5', '_gid']);
    expect(analyticsCookieNames('')).toEqual([]);
  });

  it('lista o host e os domínios-pai onde o cookie pode ter sido gravado', () => {
    expect(cookieDomains('www.hrtechsistemas.com.br')).toEqual(['www.hrtechsistemas.com.br', 'hrtechsistemas.com.br', 'com.br']);
    expect(cookieDomains('hrtechsistemas.com.br')).toEqual(['hrtechsistemas.com.br', 'com.br']);
    expect(cookieDomains('localhost')).toEqual(['localhost']);
  });
});
