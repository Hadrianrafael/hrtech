/** Avaliação de condições de automação (pura, testável). */
export type ConditionOp = 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'gt' | 'lt' | 'exists' | 'not_exists';

export interface Condition {
  field: string;
  op: ConditionOp;
  value?: unknown;
}

export const CONDITION_OPS: Record<ConditionOp, string> = {
  eq: 'é igual a',
  neq: 'é diferente de',
  in: 'é um de',
  not_in: 'não é um de',
  contains: 'contém',
  gt: 'maior que',
  lt: 'menor que',
  exists: 'está preenchido',
  not_exists: 'está vazio',
};

/** Campos disponíveis para condições (exibidos no editor). */
export const CONDITION_FIELDS: Record<string, string> = {
  'contact.source': 'Origem do contato',
  'contact.status': 'Status do lead',
  'contact.city': 'Cidade do contato',
  'contact.ownerId': 'Responsável do contato',
  'contact.tags': 'Etiquetas do contato',
  'opportunity.stageKey': 'Etapa atual (chave)',
  'opportunity.value': 'Valor da oportunidade',
  'toStage.key': 'Etapa de destino (chave)',
  'toStage.kind': 'Tipo da etapa de destino',
  'fromStage.key': 'Etapa de origem (chave)',
  channel: 'Canal da conversa',
  intent: 'Intenção identificada',
  'message.body': 'Texto da mensagem',
};

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function asList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return v === undefined || v === null ? [] : [v];
}

function norm(v: unknown) {
  return typeof v === 'string' ? v.toLowerCase() : v;
}

export function evaluateCondition(facts: unknown, c: Condition): boolean {
  const actual = getPath(facts, c.field);
  switch (c.op) {
    case 'exists':
      return actual !== undefined && actual !== null && actual !== '' && !(Array.isArray(actual) && actual.length === 0);
    case 'not_exists':
      return !evaluateCondition(facts, { ...c, op: 'exists' });
    case 'eq':
      return Array.isArray(actual) ? actual.map(norm).includes(norm(c.value)) : String(norm(actual) ?? '') === String(norm(c.value) ?? '');
    case 'neq':
      return !evaluateCondition(facts, { ...c, op: 'eq' });
    case 'in': {
      const list = asList(c.value).map(norm);
      return Array.isArray(actual) ? actual.some((a) => list.includes(norm(a))) : list.includes(norm(actual));
    }
    case 'not_in':
      return !evaluateCondition(facts, { ...c, op: 'in' });
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(c.value ?? '').toLowerCase());
    case 'gt':
      return Number(actual) > Number(c.value);
    case 'lt':
      return Number(actual) < Number(c.value);
    default:
      return false;
  }
}

export function evaluateConditions(facts: unknown, conditions: Condition[]): boolean {
  return conditions.every((c) => evaluateCondition(facts, c));
}

/** Substitui {{caminho}} por valores dos fatos. */
export function renderTemplate(template: string, facts: unknown): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const v = getPath(facts, path);
    return v === undefined || v === null ? '' : String(v);
  });
}
