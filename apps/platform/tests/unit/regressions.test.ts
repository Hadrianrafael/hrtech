/**
 * Regressões dos problemas encontrados na revisão anterior ao merge (cada bloco cita o defeito que protege).
 */
import { createHmac } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isValidTimeZone, moneyInputValue, normalizePhone, parseMoney, safeTimeZone } from '@/lib/utils';
import { timeZoneSchema } from '@/lib/validation';
import { isWithinBusinessHours, parseAssistantOutput } from '@/server/ai/agent';
import { StripeBillingProvider } from '@/server/billing/provider';
import { stageSchema } from '@/server/pipeline';

describe('telefones brasileiros: 9º dígito', () => {
  it('wa_id sem o 9 casa com o número digitado no formulário', () => {
    expect(normalizePhone('551188887777')).toBe('5511988887777'); // wa_id antigo do WhatsApp
    expect(normalizePhone('(11) 8888-7777')).toBe('5511988887777');
    expect(normalizePhone('5511988887777')).toBe('5511988887777'); // já canônico
  });
  it('telefone fixo e números estrangeiros não mudam', () => {
    expect(normalizePhone('(11) 3333-4444')).toBe('551133334444');
    expect(normalizePhone('+1 415 555 2671')).toBe('14155552671');
    expect(normalizePhone('+14155552671')).toBe('14155552671'); // wa_id de fora do Brasil (11 dígitos)
    expect(normalizePhone('+551188887777')).toBe('5511988887777');
  });
});

describe('valores em reais', () => {
  it.each([
    ['1.500,00', 1500],
    ['R$ 1.500,50', 1500.5],
    ['1500.50', 1500.5],
    ['1500,5', 1500.5],
    ['1.500', 1500],
    ['1.500.000', 1500000],
    ['1,500.75', 1500.75],
    ['300', 300],
  ])('%s → %d', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });
  it('rejeita texto e ida e volta pelo campo de edição preserva o valor', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('')).toBeNull();
    for (const n of [1500, 1500.5, 0.99, 1234567.89]) expect(parseMoney(moneyInputValue(n))).toBe(n);
  });
});

describe('fuso horário', () => {
  it('valida fusos IANA e nunca derruba o assistente com valor inválido', () => {
    expect(isValidTimeZone('America/Manaus')).toBe(true);
    expect(isValidTimeZone('Marte/Base')).toBe(false);
    expect(safeTimeZone('Marte/Base', 'America/Recife')).toBe('America/Recife');
    expect(safeTimeZone(undefined, null)).toBe('America/Sao_Paulo');
    expect(timeZoneSchema.safeParse('Marte/Base').success).toBe(false);
    const hours = { enabled: true, timezone: 'Marte/Base', days: { mon: ['09:00', '18:00'] as [string, string] } };
    expect(() => isWithinBusinessHours(hours, new Date('2026-10-05T13:00:00Z'))).not.toThrow();
  });
  it('sem fuso no chatbot, usa o fuso da empresa', () => {
    const hours = { enabled: true, days: { mon: ['09:00', '18:00'] as [string, string] } };
    // segunda-feira 08:30 em São Paulo = 07:30 em Manaus (fora) e 08:30 em SP (fora); 12:30 UTC = 09:30 SP / 08:30 Manaus
    const at = new Date('2026-10-05T12:30:00Z');
    expect(isWithinBusinessHours(hours, at, 'America/Sao_Paulo')).toBe(true);
    expect(isWithinBusinessHours(hours, at, 'America/Manaus')).toBe(false);
  });
});

describe('resposta da IA', () => {
  it('nunca devolve JSON cru ao cliente e aproveita campos válidos', () => {
    expect(parseAssistantOutput('{"reply": "Olá", "intent": ').reply).toBe(''); // JSON truncado
    expect(parseAssistantOutput('{"message":"Oi!","handoff":"true"}')).toMatchObject({ reply: 'Oi!', handoff: true });
    expect(parseAssistantOutput('{"reply":"{\\"x\\":1}"}').reply).toBe('');
    expect(parseAssistantOutput('{"reply":"ok","extracted":{"name":"Ana","obj":{"a":1},"n":2}}').extracted).toEqual({ name: 'Ana', n: 2 });
  });
});

describe('etapas do funil', () => {
  it('probabilidade vazia fica sem valor (não 0%)', () => {
    expect(stageSchema.parse({ name: 'X', probability: '' }).probability).toBeNull();
    expect(stageSchema.parse({ name: 'X', probability: '40' }).probability).toBe(40);
  });
});

describe('todas as páginas protegidas verificam o acesso', () => {
  // O layout não roda em requisições RSC parciais: a verificação precisa estar em cada página.
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : f === 'page.tsx' ? [p] : [];
    });
  const root = path.resolve(__dirname, '../../src/app');
  it.each(walk(path.join(root, 'admin')).map((p) => [path.relative(root, p), p]))('%s', (_rel, file) => {
    expect(readFileSync(file, 'utf8')).toContain('requirePlatformAdminPage(');
  });
  it.each(walk(path.join(root, '(app)')).map((p) => [path.relative(root, p), p]))('%s', (_rel, file) => {
    expect(readFileSync(file, 'utf8')).toContain('requirePageContext(');
  });
});

describe('webhook da Stripe', () => {
  const secret = 'whsec_teste_local';
  const prev = process.env.STRIPE_WEBHOOK_SECRET;
  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = prev;
  });
  const signed = (body: object) => {
    const raw = JSON.stringify(body);
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
    return { raw, headers: new Headers({ 'stripe-signature': `t=${t},v1=${v1}` }) };
  };

  it('fatura identifica a empresa pelos metadados da assinatura (e não usa o id da fatura como assinatura)', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const p = new StripeBillingProvider();
    const legacy = signed({
      id: 'evt_1',
      type: 'invoice.paid',
      data: { object: { id: 'in_1', subscription: 'sub_1', customer: 'cus_1', metadata: {}, subscription_details: { metadata: { organizationId: 'org_a' } }, lines: { data: [{ period: { end: 1800000000 } }] } } },
    });
    expect(await p.parseWebhook(legacy.raw, legacy.headers)).toMatchObject({ type: 'subscription.renewed', organizationId: 'org_a', externalSubscriptionId: 'sub_1', periodEnd: new Date(1800000000 * 1000) });
    const basil = signed({
      id: 'evt_2',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_2', customer: 'cus_1', parent: { subscription_details: { subscription: 'sub_2', metadata: { organizationId: 'org_b' } } } } },
    });
    expect(await p.parseWebhook(basil.raw, basil.headers)).toMatchObject({ type: 'subscription.past_due', organizationId: 'org_b', externalSubscriptionId: 'sub_2' });
    const deleted = signed({ id: 'evt_3', type: 'customer.subscription.deleted', data: { object: { id: 'sub_3', metadata: { organizationId: 'org_c' } } } });
    expect(await p.parseWebhook(deleted.raw, deleted.headers)).toMatchObject({ type: 'subscription.canceled', organizationId: 'org_c', externalSubscriptionId: 'sub_3' });
  });

  it('assinatura inválida é rejeitada', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const { raw } = signed({ id: 'evt_x', type: 'invoice.paid', data: { object: {} } });
    expect(await new StripeBillingProvider().parseWebhook(raw, new Headers({ 'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=00` }))).toBeNull();
  });
});
