/**
 * Rótulos e utilitários puros (sem hooks, sem acesso a dados) usados pelas telas de objetivos e tarefas da
 * Equipe IA. Podem ser importados tanto pelas páginas (servidor) quanto pelos componentes de cliente.
 */
import type { Tone } from '@/components/ui/misc';

type StatusMap = Record<string, { label: string; tone: Tone }>;

export const TASK_KIND_LABELS: Record<string, string> = {
  plan: 'Planejamento',
  work: 'Trabalho',
  review: 'Revisão',
  briefing: 'Briefing',
};

export function kindLabel(kind: string) {
  return TASK_KIND_LABELS[kind] ?? kind;
}

export const ACTIVE_TASK_STATUSES = ['QUEUED', 'RUNNING', 'WAITING_APPROVAL'];
export const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];

/** Filtros da lista de tarefas (?status=). */
export const TASK_FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'QUEUED', label: 'Na fila' },
  { key: 'RUNNING', label: 'Em execução' },
  { key: 'WAITING_APPROVAL', label: 'Aguardando aprovação' },
  { key: 'COMPLETED', label: 'Concluídas' },
  { key: 'FAILED', label: 'Falhas' },
  { key: 'CANCELLED', label: 'Canceladas' },
];

export function isTerminal(status: string) {
  return TERMINAL_STATUSES.includes(status);
}

/** Texto curto explicando o que a tarefa aguarda (campo waitingFor). */
export function waitingHint(waitingFor: string | null | undefined): string | null {
  if (!waitingFor) return null;
  if (waitingFor.startsWith('approval')) return 'aguardando aprovação';
  if (waitingFor.startsWith('n8n')) return 'aguardando n8n';
  if (waitingFor.startsWith('task:')) return 'aguardando etapa anterior';
  if (waitingFor === 'children') return 'aguardando tarefas delegadas';
  return null;
}

/** Motivo de a tarefa estar retida na fila (campo blockedReason). */
export function blockedHint(reason: string | null | undefined): string | null {
  switch (reason) {
    case null:
    case undefined:
    case '':
      return null;
    case 'budget':
      return 'retida: orçamento de IA atingido';
    case 'quota':
      return 'retida: cota de IA do plano atingida';
    case 'paused':
      return 'retida: Equipe IA ou agente pausado';
    case 'credential':
      return 'retida: PENDENTE DE CREDENCIAL';
    default:
      return `retida (${reason})`;
  }
}

/** Execuções (AiTaskRun.status). */
export const RUN_STATUS: StatusMap = {
  RUNNING: { label: 'Em execução', tone: 'blue' },
  SUCCEEDED: { label: 'Concluída', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  WAITING_EXTERNAL: { label: 'Aguardando n8n', tone: 'yellow' },
  WAITING_CHILDREN: { label: 'Aguardando delegadas', tone: 'blue' },
  BLOCKED: { label: 'Retida', tone: 'yellow' },
  CANCELLED: { label: 'Cancelada', tone: 'gray' },
};

export const RUN_MODE_LABELS: Record<string, string> = {
  llm: 'IA (LLM)',
  playbook: 'Roteiro',
  review: 'Revisão',
  briefing: 'Briefing',
};

/** Chamadas de ferramenta (AiToolCall.status). */
export const TOOL_CALL_STATUS: StatusMap = {
  EXECUTED: { label: 'Executada', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  PENDING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  APPROVED: { label: 'Aprovada', tone: 'blue' },
  REJECTED: { label: 'Rejeitada', tone: 'red' },
  BLOCKED: { label: 'Bloqueada', tone: 'red' },
  WAITING_EXTERNAL: { label: 'Aguardando n8n', tone: 'yellow' },
};

/** Passos do histórico da tarefa (input.history[].status). */
export const STEP_STATUS: StatusMap = {
  executed: { label: 'Executado', tone: 'green' },
  failed: { label: 'Falhou', tone: 'red' },
  approval: { label: 'Aguardando aprovação', tone: 'yellow' },
  waiting: { label: 'Aguardando n8n', tone: 'yellow' },
  blocked: { label: 'Bloqueado', tone: 'red' },
  invalid: { label: 'Inválido', tone: 'red' },
  rejected: { label: 'Rejeitado', tone: 'red' },
  interrupted: { label: 'Interrompido', tone: 'gray' },
};

/** Envios ao n8n (N8nDispatch.status). */
export const DISPATCH_STATUS: StatusMap = {
  PENDING: { label: 'Na fila', tone: 'gray' },
  SENDING: { label: 'Enviando', tone: 'blue' },
  SENT: { label: 'Enviado', tone: 'blue' },
  COMPLETED: { label: 'Concluído', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  DEAD: { label: 'Tentativas esgotadas', tone: 'red' },
  CANCELLED: { label: 'Cancelado', tone: 'gray' },
};

export const SOURCE_LABELS: Record<string, string> = {
  USER: 'Comando da equipe',
  N8N: 'n8n',
  BRIEFING: 'Briefing',
  SYSTEM: 'Sistema',
};

/** "2026-10-07" → "07/10/2026" (sem passar por Date, para não deslocar o dia pelo fuso). */
export function formatDay(day: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : day;
}

/** JSON indentado e com tamanho limitado, para exibição em bloco recolhido (texto puro). */
export function jsonPreview(value: unknown, max = 3000): string | null {
  if (value === undefined || value === null) return null;
  let s: string;
  try {
    s = JSON.stringify(value, null, 2) ?? '';
  } catch {
    s = String(value);
  }
  if (!s || s === '{}' || s === '[]' || s === '""') return null;
  return s.length > max ? `${s.slice(0, max)}\n… (${s.length - max} caracteres omitidos)` : s;
}

/** Texto do JSON do Prisma → string (ou null), com limite de tamanho. */
export function jsonString(v: unknown, max = 2000): string | null {
  return typeof v === 'string' && v.trim() ? v.slice(0, max) : null;
}

/** Lista de strings do JSON do Prisma, com limites de quantidade e tamanho. */
export function jsonStringArray(v: unknown, maxItems = 30, maxLen = 500): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, maxItems).map((s) => s.slice(0, maxLen)) : [];
}

export function jsonRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function formatTokens(n: number) {
  return n.toLocaleString('pt-BR');
}

export function formatLatency(ms: number) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}
