import { describe, it, expect } from 'vitest';
import { normalizeContactSubmission } from './contact-submission';

describe('normalizeContactSubmission', () => {
  it('trims whitespace and lowercases the email', () => {
    const result = normalizeContactSubmission({
      name: '  Ana Silva  ',
      email: '  ANA@Example.com ',
      message: '  Preciso de um sistema.  ',
    });

    expect(result).toEqual({
      name: 'Ana Silva',
      company: undefined,
      email: 'ana@example.com',
      phone: undefined,
      message: 'Preciso de um sistema.',
    });
  });

  it('converts empty optional fields to undefined', () => {
    const result = normalizeContactSubmission({
      name: 'Ana',
      company: '   ',
      email: 'ana@example.com',
      phone: '   ',
      message: 'Olá',
    });

    expect(result.company).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });
});
