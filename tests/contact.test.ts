import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/content';
import { emptyContact, formatContactMessage, validateContact, type ContactPayload } from '@/lib/contact';
import { locales } from '@/lib/i18n/config';

const base: ContactPayload = {
  name: 'Maria Silva',
  company: 'Loja da Maria',
  country: 'BR',
  email: 'maria@example.com',
  phone: '11999998888',
  serviceType: 'web',
  budget: 'Até R$ 5 mil',
  language: 'pt-BR',
  message: 'Preciso de um site institucional para minha loja.',
};

describe('validateContact', () => {
  it('aceita um formulário válido', () => {
    expect(validateContact(base)).toEqual({});
  });

  it('o formulário vazio começa no idioma da página e exige os demais campos', () => {
    const empty = emptyContact('es-ES');
    expect(empty.language).toBe('es-ES');
    expect(Object.keys(validateContact(empty)).sort()).toEqual(['country', 'email', 'message', 'name', 'serviceType']);
  });

  it('rejeita nome muito curto', () => {
    expect(validateContact({ ...base, name: 'A' })).toHaveProperty('name');
  });

  it('rejeita e-mail inválido', () => {
    expect(validateContact({ ...base, email: 'nao-e-email' })).toHaveProperty('email');
  });

  it('rejeita mensagem muito curta', () => {
    expect(validateContact({ ...base, message: 'oi' })).toHaveProperty('message');
  });

  it('exige país, tipo de serviço e idioma de atendimento', () => {
    expect(validateContact({ ...base, country: '' })).toHaveProperty('country');
    expect(validateContact({ ...base, serviceType: '' })).toHaveProperty('serviceType');
    expect(validateContact({ ...base, language: '' })).toHaveProperty('language');
  });

  it('aceita telefone vazio (campo opcional) e números internacionais', () => {
    expect(validateContact({ ...base, phone: '' })).toEqual({});
    expect(validateContact({ ...base, phone: '+1 (415) 555-0132' })).toEqual({});
    expect(validateContact({ ...base, phone: '+34 600 123 456' })).toEqual({});
  });

  it('rejeita telefone com poucos ou dígitos demais', () => {
    expect(validateContact({ ...base, phone: '123' })).toHaveProperty('phone');
    expect(validateContact({ ...base, phone: '1234567890123456' })).toHaveProperty('phone');
  });
});

describe('formatContactMessage', () => {
  it('inclui os campos preenchidos, nos rótulos do idioma do visitante', () => {
    const en = formatContactMessage({ ...base, country: 'US', language: 'en-US', serviceType: 'ai' }, getDictionary('en-US').form);
    expect(en).toContain('Maria Silva');
    expect(en).toContain('Country: United States');
    expect(en).toContain('Type of service: AI chatbot or assistant');
    expect(en).toContain('Preferred language: English');

    const es = formatContactMessage({ ...base, country: 'ES', language: 'es-ES', serviceType: 'web' }, getDictionary('es-ES').form);
    expect(es).toContain('País: España');
    expect(es).toContain('Idioma de atención: Español');
  });

  it('omite campos opcionais vazios', () => {
    const message = formatContactMessage({ ...base, company: '', budget: '', phone: '' }, getDictionary('pt-BR').form);
    expect(message).not.toContain('Empresa:');
    expect(message).not.toContain('Orçamento estimado:');
    expect(message).not.toContain('WhatsApp ou telefone:');
  });

  it('indica o idioma de atendimento em todas as versões', () => {
    for (const locale of locales) {
      const text = getDictionary(locale).form;
      expect(formatContactMessage(base, text)).toContain(`${text.labels.language}: ${text.languages['pt-BR']}`);
    }
  });
});
