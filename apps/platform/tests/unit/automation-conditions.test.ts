import { describe, expect, it } from 'vitest';
import { evaluateCondition, evaluateConditions, renderTemplate } from '@/server/automations/conditions';

const facts = { contact: { name: 'Ana Lima', source: 'whatsapp', tags: ['VIP', 'Reserva'] }, intent: 'booking', opportunity: { value: 500, stageKey: 'new' } };

describe('condições de automação', () => {
  it('operadores básicos', () => {
    expect(evaluateCondition(facts, { field: 'contact.source', op: 'eq', value: 'WhatsApp' })).toBe(true);
    expect(evaluateCondition(facts, { field: 'contact.source', op: 'neq', value: 'email' })).toBe(true);
    expect(evaluateCondition(facts, { field: 'intent', op: 'in', value: ['booking', 'pricing'] })).toBe(true);
    expect(evaluateCondition(facts, { field: 'intent', op: 'in', value: 'pricing, purchase' })).toBe(false);
    expect(evaluateCondition(facts, { field: 'contact.tags', op: 'eq', value: 'vip' })).toBe(true);
    expect(evaluateCondition(facts, { field: 'opportunity.value', op: 'gt', value: 100 })).toBe(true);
    expect(evaluateCondition(facts, { field: 'contact.email', op: 'not_exists' })).toBe(true);
    expect(evaluateCondition(facts, { field: 'contact.name', op: 'contains', value: 'lima' })).toBe(true);
  });

  it('todas as condições precisam ser verdadeiras', () => {
    expect(evaluateConditions(facts, [])).toBe(true);
    expect(evaluateConditions(facts, [{ field: 'intent', op: 'eq', value: 'booking' }, { field: 'opportunity.stageKey', op: 'eq', value: 'proposal' }])).toBe(false);
  });

  it('renderiza templates', () => {
    expect(renderTemplate('Ligar para {{contact.name}} ({{intent}}) {{x.y}}', facts)).toBe('Ligar para Ana Lima (booking) ');
  });
});
