import type { ServiceCtx } from '@/lib/auth/ctx';
import { logger } from '@/lib/logger';

/** Gatilhos de automação suportados. */
export const TRIGGERS = {
  'lead.created': 'Quando um lead entrar',
  'message.received': 'Quando o cliente enviar mensagem',
  'opportunity.stage_changed': 'Quando a oportunidade mudar de etapa',
  'opportunity.won': 'Quando uma venda for ganha',
  'opportunity.lost': 'Quando uma oportunidade for perdida',
  'human.requested': 'Quando o cliente solicitar atendimento humano',
  'intent.detected': 'Quando a IA identificar uma intenção',
  'appointment.created': 'Quando um agendamento for criado',
  'conversation.no_reply': 'Quando o lead não responder (48h)',
  'task.overdue': 'Quando uma tarefa atrasar',
} as const;

export type TriggerKey = keyof typeof TRIGGERS;

export interface EventPayload {
  contactId?: string | null;
  conversationId?: string | null;
  opportunityId?: string | null;
  [key: string]: unknown;
}

/**
 * Publica um evento de domínio para o motor de automações.
 * Falhas nas automações nunca interrompem a operação de origem (ficam registradas em AutomationRun).
 */
export async function emitEvent(ctx: ServiceCtx, trigger: TriggerKey, payload: EventPayload, opts: { eventKey: string; depth?: number }) {
  try {
    const { runAutomations } = await import('./automations/engine');
    await runAutomations(ctx, trigger, payload, opts);
  } catch (err) {
    logger.error('events.emit_failed', { trigger, orgId: ctx.orgId, err });
  }
}
