import { describe, expect, it } from 'vitest';
import { redact } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { formatPhone, initials, normalizeEmail, normalizePhone, slugify } from '@/lib/utils';
import { resolveRange } from '@/server/analytics';
import { parseLimits } from '@/server/billing/limits';

describe('utilitários', () => {
  it('normaliza telefones brasileiros', () => {
    expect(normalizePhone('(11) 98888-7777')).toBe('5511988887777');
    expect(normalizePhone('+55 11 98888-7777')).toBe('5511988887777');
    expect(normalizePhone('123')).toBeNull();
    expect(formatPhone('5511988887777')).toBe('+55 (11) 98888-7777');
  });

  it('normaliza e-mail, slug e iniciais', () => {
    expect(normalizeEmail(' Ana@Exemplo.COM ')).toBe('ana@exemplo.com');
    expect(normalizeEmail('invalido')).toBeNull();
    expect(slugify('Pousada São João & Cia')).toBe('pousada-sao-joao-cia');
    expect(initials('Gerente da Pousada (fictício)')).toBe('GF');
  });

  it('redige campos sensíveis nos logs', () => {
    expect(redact({ password: 'x', nested: { accessToken: 'y', ok: 1 } })).toEqual({ password: '[redacted]', nested: { accessToken: '[redacted]', ok: 1 } });
  });

  it('rate limit por janela', () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 1000).ok).toBe(true);
    expect(rateLimit(key, 3, 1000).ok).toBe(false);
  });

  it('períodos do dashboard', () => {
    const now = new Date('2026-10-15T12:00:00');
    expect(resolveRange('month', null, null, now).start.getDate()).toBe(1);
    expect(resolveRange('7d', null, null, now).start.getDate()).toBe(9);
    const custom = resolveRange('custom', '2026-01-01', '2026-01-31', now);
    expect(custom.key).toBe('custom');
    expect(resolveRange('custom', '2026-02-01', '2026-01-01', now).key).toBe('30d');
  });

  it('limites de plano ignoram valores inválidos', () => {
    expect(parseLimits({ users: 3, contacts: -1, automations: 'x', unknown: 5 })).toEqual({ users: 3 });
  });
});
