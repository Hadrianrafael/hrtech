import { describe, expect, it } from 'vitest';
import { mailtoLink, whatsappLink } from '@/lib/whatsapp';

describe('whatsappLink', () => {
  it('monta a URL wa.me com dígitos e mensagem codificada', () => {
    const link = whatsappLink('Olá!', '5511999998888');
    expect(link).toBe('https://wa.me/5511999998888?text=Ol%C3%A1!');
  });

  it('remove caracteres não numéricos do telefone', () => {
    const link = whatsappLink('Oi', '+55 (11) 99999-8888');
    expect(link.startsWith('https://wa.me/5511999998888')).toBe(true);
  });
});

describe('mailtoLink', () => {
  it('monta um mailto com assunto e corpo', () => {
    const link = mailtoLink('Orçamento', 'Olá, tudo bem?', 'contato@hrtechsistemas.com.br');
    expect(link).toContain('mailto:contato@hrtechsistemas.com.br');
    expect(link).toContain('subject=Or%C3%A7amento');
  });
});
