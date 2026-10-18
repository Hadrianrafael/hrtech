import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/content';
import { locales } from '@/lib/i18n/config';
import { mailtoLink, whatsappLink } from '@/lib/whatsapp';

describe('whatsappLink', () => {
  it('monta a URL wa.me com dígitos e mensagem codificada', () => {
    expect(whatsappLink('Olá!', '5511999998888')).toBe('https://wa.me/5511999998888?text=Ol%C3%A1!');
  });

  it('remove caracteres não numéricos do telefone', () => {
    expect(whatsappLink('Oi', '+55 (11) 99999-8888').startsWith('https://wa.me/5511999998888')).toBe(true);
  });

  it('usa a mensagem inicial do idioma da página', () => {
    const links = locales.map((locale) => whatsappLink(getDictionary(locale).whatsapp.defaultMessage));
    expect(new Set(links).size).toBe(locales.length);
    expect(decodeURIComponent(links[1]!)).toContain('Hello!');
    expect(decodeURIComponent(links[2]!)).toContain('Hola');
  });
});

describe('mailtoLink', () => {
  it('monta um mailto com assunto e corpo', () => {
    const link = mailtoLink('Orçamento', 'Olá, tudo bem?', 'contato@hrtechsistemas.com.br');
    expect(link).toContain('mailto:contato@hrtechsistemas.com.br');
    expect(link).toContain('subject=Or%C3%A7amento');
  });
});
