/**
 * Ferramentas que acionam o n8n (efeito fora da SaaS). Risco alto ou crítico: dependem de aprovação humana
 * conforme a política. A tarefa fica aguardando o retorno do n8n; se o n8n estiver fora do ar ou sem credenciais,
 * o envio permanece na fila e é reenviado depois.
 */
import { z } from 'zod';
import { AppError, NotFoundError } from '@/lib/errors';
import { formatMoney } from '@/lib/utils';
import { enqueueDispatch, N8N_WORKFLOWS, PENDING_CREDENTIAL, sendDispatch, type N8nWorkflow } from '../n8n';
import { scanSensitive } from '../security';
import { defineTool, type ToolResult, type ToolRunContext } from './types';

const id = z.string().trim().min(5).max(60);

async function dispatch(tc: ToolRunContext, workflow: N8nWorkflow, payload: Record<string, unknown>, label: string): Promise<ToolResult> {
  // Defesa em profundidade (invokeTool já bloqueia): a empresa precisa ter habilitado a integração.
  const company = await tc.ctx.db.aiCompany.findFirst({ select: { n8nEnabled: true } });
  if (!company?.n8nEnabled) throw new AppError('A integração com o n8n está desativada nesta empresa.');
  const d = await enqueueDispatch(tc.orgId, { workflow, payload, idempotencyKey: tc.idempotencyKey, taskId: tc.task.id, toolCallId: tc.toolCallId });
  const outcome = d.status === 'PENDING' ? await sendDispatch(d.id) : 'skipped';
  const fresh = await tc.ctx.db.n8nDispatch.findFirst({ where: { id: d.id } });
  if (fresh && ['COMPLETED', 'FAILED', 'DEAD'].includes(fresh.status)) {
    // Fluxo síncrono: o resultado já veio na resposta do n8n.
    return { data: { dispatchId: d.id, status: fresh.status, result: fresh.result ?? null, error: fresh.lastError }, summary: `${label}: ${fresh.status === 'COMPLETED' ? 'concluído' : `falhou (${fresh.lastError})`}.` };
  }
  const note = outcome === 'pending_credential' ? ` ${PENDING_CREDENTIAL}` : outcome === 'retry' ? ' n8n indisponível: nova tentativa automática agendada.' : '';
  return {
    data: { dispatchId: d.id, workflow, status: fresh?.status ?? d.status },
    summary: `${label}: enviado para o n8n (${N8N_WORKFLOWS[workflow].label}), aguardando retorno.${note}`,
    waitingExternal: { dispatchId: d.id },
  };
}

export const n8nProspectSearch = defineTool({
  key: 'n8n.prospect_search',
  label: 'Buscar prospects (n8n)',
  description: 'Pede ao fluxo de prospecção do n8n uma lista de empresas do segmento/cidade (fontes oficiais, ex.: Google Places API). Tem custo externo: exige aprovação. Depois use leads.import_prospects com o dispatchId.',
  argsHint: '{"segment": "pousadas", "city": "Gramado", "state": "RS", "quantity": 30}',
  risk: 'high',
  categories: ['gasto'],
  schema: z.object({
    segment: z.string().trim().min(3).max(80),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(40).optional(),
    quantity: z.coerce.number().int().min(1).max(100).default(30),
    notes: z.string().trim().max(500).optional(),
  }),
  describe: (a) => `Buscar ${a.quantity} prospects de "${a.segment}"${a.city ? ` em ${a.city}` : ''}${a.state ? `/${a.state}` : ''} via n8n (custo externo)`,
  run: (tc, a) => dispatch(tc, 'prospeccao', { ...a, agent: tc.agent.key }, `Busca de ${a.quantity} prospects (${a.segment})`),
});

export const n8nSalesSequence = defineTool({
  key: 'n8n.sales_sequence',
  label: 'Sequência de contato (n8n)',
  description: 'Inicia no n8n uma sequência de contato (follow-up, reativação, boas-vindas) para até 50 contatos. Comunicação com clientes: exige aprovação.',
  argsHint: '{"contactIds": ["..."], "sequence": "followup", "message": "texto base opcional"}',
  risk: 'high',
  schema: z.object({
    contactIds: z.array(id).min(1).max(50),
    sequence: z.enum(['followup', 'reativacao', 'boas_vindas']),
    message: z.string().trim().max(2000).optional(),
  }),
  assess: (_tc, a) => ({ categories: scanSensitive(a.message ?? '') }),
  describe: (a) => `Iniciar sequência "${a.sequence}" para ${a.contactIds.length} contato(s)${a.message ? `: "${a.message.slice(0, 120)}"` : ''}`,
  async run(tc, a) {
    const contacts = await tc.ctx.db.contact.findMany({
      where: { id: { in: a.contactIds }, anonymizedAt: null },
      select: { id: true, name: true, phone: true, whatsapp: true, email: true },
    });
    if (!contacts.length) throw new NotFoundError('Nenhum contato válido para a sequência.');
    return dispatch(tc, 'comercial', { sequence: a.sequence, message: a.message ?? null, contacts }, `Sequência "${a.sequence}" (${contacts.length} contato(s))`);
  },
});

export const n8nMarketingPublish = defineTool({
  key: 'n8n.marketing_publish',
  label: 'Publicar conteúdo (n8n)',
  description: 'Envia um conteúdo aprovado para publicação/agendamento pelo n8n (redes sociais, e-mail marketing, blog). Exige aprovação.',
  argsHint: '{"channel": "instagram", "content": "...", "scheduledFor": "2026-10-10T10:00:00-03:00"}',
  risk: 'high',
  schema: z.object({
    channel: z.enum(['instagram', 'facebook', 'linkedin', 'email', 'blog']),
    content: z.string().trim().min(10).max(5000),
    scheduledFor: z.string().datetime({ offset: true }).optional(),
  }),
  assess: (_tc, a) => ({ categories: scanSensitive(a.content) }),
  describe: (a) => `Publicar no canal ${a.channel}${a.scheduledFor ? ` em ${a.scheduledFor}` : ''}: "${a.content.slice(0, 140)}"`,
  run: (tc, a) => dispatch(tc, 'marketing', a, `Publicação (${a.channel})`),
});

export const n8nDevIssue = defineTool({
  key: 'n8n.dev_issue',
  label: 'Abrir issue de desenvolvimento (n8n)',
  description: 'Abre uma issue/cartão no sistema de desenvolvimento via n8n (ex.: GitHub Issues). Nunca faz merge ou deploy. Exige aprovação.',
  argsHint: '{"title": "...", "body": "contexto, passos, critério de aceite", "labels": ["bug"]}',
  risk: 'high',
  schema: z.object({ title: z.string().trim().min(5).max(200), body: z.string().trim().min(10).max(8000), labels: z.array(z.string().trim().max(40)).max(8).default([]) }),
  // Publica fora da empresa: dados de clientes, valores ou credenciais no texto exigem aprovação.
  assess: (_tc, a) => ({ categories: scanSensitive(`${a.title}\n${a.body}\n${a.labels.join(' ')}`) }),
  describe: (a) => `Abrir issue: ${a.title}`,
  run: (tc, a) => dispatch(tc, 'desenvolvimento', a, `Issue "${a.title}"`),
});

export const n8nFinanceCharge = defineTool({
  key: 'n8n.finance_charge',
  label: 'Gerar cobrança (n8n)',
  description: 'Solicita ao n8n a geração de uma cobrança (boleto/PIX/link) para um cliente. Pagamento: sempre exige aprovação.',
  argsHint: '{"contactId": "...", "amountCents": 39700, "description": "Plano Professional - outubro", "dueDate": "2026-10-15"}',
  risk: 'critical',
  categories: ['pagamento'],
  schema: z.object({
    contactId: id,
    amountCents: z.coerce.number().int().min(100).max(100_000_000),
    description: z.string().trim().min(3).max(300),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  describe: (a) => `Cobrança de ${formatMoney(a.amountCents / 100)} com vencimento em ${a.dueDate}: ${a.description}`,
  async run(tc, a) {
    const contact = await tc.ctx.db.contact.findFirst({ where: { id: a.contactId, anonymizedAt: null }, select: { id: true, name: true, email: true, phone: true, companyName: true } });
    if (!contact) throw new NotFoundError('Contato não encontrado.');
    return dispatch(tc, 'financeiro', { contact, amountCents: a.amountCents, description: a.description, dueDate: a.dueDate }, `Cobrança de ${formatMoney(a.amountCents / 100)}`);
  },
});
