import type { Prisma } from '@prisma/client';

/** Etapas iniciais do funil comercial (cada empresa pode personalizar depois). */
export const DEFAULT_STAGES: { name: string; key: string; kind: 'OPEN' | 'WON' | 'LOST'; color: string; probability: number }[] = [
  { name: 'Novo Lead', key: 'new', kind: 'OPEN', color: '#64748b', probability: 5 },
  { name: 'Primeiro Contato', key: 'first_contact', kind: 'OPEN', color: '#0ea5e9', probability: 10 },
  { name: 'Em Conversa', key: 'in_conversation', kind: 'OPEN', color: '#6366f1', probability: 20 },
  { name: 'Qualificado', key: 'qualified', kind: 'OPEN', color: '#8b5cf6', probability: 35 },
  { name: 'Proposta Enviada', key: 'proposal', kind: 'OPEN', color: '#f59e0b', probability: 50 },
  { name: 'Follow-up', key: 'follow_up', kind: 'OPEN', color: '#f97316', probability: 55 },
  { name: 'Negociação', key: 'negotiation', kind: 'OPEN', color: '#ec4899', probability: 70 },
  { name: 'Fechado/Ganho', key: 'won', kind: 'WON', color: '#16a34a', probability: 100 },
  { name: 'Perdido', key: 'lost', kind: 'LOST', color: '#dc2626', probability: 0 },
];

export const DEFAULT_TAGS = [
  { name: 'Interessado', color: '#16a34a' },
  { name: 'VIP', color: '#a855f7' },
  { name: 'Retornar', color: '#f59e0b' },
  { name: 'Reserva', color: '#0ea5e9' },
];

export const HOSPITALITY_SEGMENTS = ['hotel', 'pousada', 'hospedagem', 'turismo'];

export function defaultCollectFields(segment?: string | null): string[] {
  const base = ['name', 'phone', 'email', 'interest'];
  return segment && HOSPITALITY_SEGMENTS.includes(segment) ? [...base, 'checkIn', 'checkOut', 'guests', 'roomType'] : [...base, 'budget', 'desiredDate'];
}

export function defaultAutomations(): {
  name: string;
  description: string;
  trigger: string;
  conditions: Prisma.InputJsonValue;
  actions: Prisma.InputJsonValue;
}[] {
  return [
    {
      name: 'Novo lead → tarefa de primeiro contato',
      description: 'Cria uma tarefa para o responsável assim que um lead entra no CRM.',
      trigger: 'lead.created',
      conditions: [],
      actions: [{ type: 'create_task', params: { title: 'Fazer primeiro contato com {{contact.name}}', dueInHours: 4, priority: 'HIGH', assignee: 'owner' } }],
    },
    {
      name: 'Proposta enviada → follow-up em 2 dias',
      description: 'Lembra o vendedor de retomar o contato após o envio da proposta.',
      trigger: 'opportunity.stage_changed',
      conditions: [{ field: 'toStage.key', op: 'eq', value: 'proposal' }],
      actions: [{ type: 'create_task', params: { title: 'Follow-up da proposta: {{contact.name}}', type: 'FOLLOW_UP', dueInHours: 48, priority: 'MEDIUM', assignee: 'owner' } }],
    },
    {
      name: 'Cliente pediu humano → atribuir atendente',
      description: 'A IA é pausada automaticamente; esta automação distribui o atendimento e cria uma tarefa urgente.',
      trigger: 'human.requested',
      conditions: [],
      actions: [
        { type: 'assign_owner', params: { mode: 'round_robin', onlyIfEmpty: true } },
        { type: 'create_task', params: { title: 'Cliente solicitou atendimento humano: {{contact.name}}', dueInHours: 1, priority: 'URGENT', assignee: 'owner' } },
      ],
    },
    {
      name: 'Intenção de compra → etiqueta "Interessado"',
      description: 'Quando a IA identifica interesse em reservar/comprar, aplica a etiqueta.',
      trigger: 'intent.detected',
      conditions: [{ field: 'intent', op: 'in', value: ['booking', 'purchase', 'pricing'] }],
      actions: [{ type: 'add_tag', params: { tag: 'Interessado' } }],
    },
    {
      name: 'Cliente respondeu → mover para "Em Conversa"',
      description: 'Leads nas etapas iniciais avançam quando o cliente responde.',
      trigger: 'message.received',
      conditions: [{ field: 'opportunity.stageKey', op: 'in', value: ['new', 'first_contact'] }],
      actions: [{ type: 'move_stage', params: { stageKey: 'in_conversation' } }],
    },
    {
      name: 'Lead sem resposta → lembrete de follow-up',
      description: 'Se o lead não responder em 48h após nossa última mensagem, cria um lembrete.',
      trigger: 'conversation.no_reply',
      conditions: [],
      actions: [{ type: 'create_task', params: { title: 'Lead sem resposta: retomar contato com {{contact.name}}', type: 'FOLLOW_UP', dueInHours: 2, priority: 'MEDIUM', assignee: 'owner' } }],
    },
  ];
}
