import { describe, expect, it } from 'vitest';
import { formatContactMessage, validateContact, type ContactPayload } from '@/lib/contact';

const base: ContactPayload = {
  name: 'Maria Silva',
  company: 'Loja da Maria',
  email: 'maria@example.com',
  whatsapp: '11999998888',
  projectType: 'Site',
  budget: 'Até R$ 5 mil',
  message: 'Preciso de um site institucional para minha loja.',
};

describe('validateContact', () => {
  it('aceita um formulário válido', () => {
    expect(validateContact(base)).toEqual({});
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

  it('exige tipo de projeto', () => {
    expect(validateContact({ ...base, projectType: '' })).toHaveProperty('projectType');
  });

  it('aceita WhatsApp vazio (campo opcional)', () => {
    expect(validateContact({ ...base, whatsapp: '' })).toEqual({});
  });

  it('rejeita WhatsApp com poucos dígitos', () => {
    expect(validateContact({ ...base, whatsapp: '123' })).toHaveProperty('whatsapp');
  });
});

describe('formatContactMessage', () => {
  it('inclui os campos preenchidos', () => {
    const message = formatContactMessage(base);
    expect(message).toContain('Maria Silva');
    expect(message).toContain('Loja da Maria');
    expect(message).toContain('Site');
  });

  it('omite campos opcionais vazios', () => {
    const message = formatContactMessage({ ...base, company: '', budget: '' });
    expect(message).not.toContain('Empresa:');
    expect(message).not.toContain('Orçamento estimado:');
  });
});
