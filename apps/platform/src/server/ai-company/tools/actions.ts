/** Ferramentas com efeito dentro da SaaS (riscos baixo a crítico). Todas usam os serviços de domínio existentes. */
import type { Channel, Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError, LimitExceededError, NotFoundError } from '@/lib/errors';
import { formatMoney, normalizeEmail, normalizePhone, toNumber } from '@/lib/utils';
import { createAppointment } from '../../calendar';
import { addNote, addTagByName, assertMember, createContact, updateContact } from '../../contacts';
import { sendMessage, startConversation } from '../../conversations';
import { moveOpportunity } from '../../pipeline';
import { createTask } from '../../tasks';
import { logActivity } from '../activity';
import { saveAgentMemory } from '../memory';
import { scanSensitive } from '../security';
import { delegateTask } from '../tasks';
import { findLeadsNeedingFollowup } from './data';
import { defineTool, type ToolRunContext } from './types';

const id = z.string().trim().min(5).max(60);
const PROSPECT_TAG = 'Prospecção IA';

export const memorySave = defineTool({
  key: 'memory.save',
  label: 'Registrar memória',
  description: 'Guarda um aprendizado, fato ou preferência útil para tarefas futuras (escopo do agente ou da empresa).',
  argsHint: '{"content": "Pousadas da serra preferem contato por WhatsApp à tarde", "kind": "LESSON", "scope": "AGENT"}',
  risk: 'low',
  schema: z.object({
    content: z.string().trim().min(5).max(1000),
    title: z.string().trim().max(120).optional(),
    kind: z.enum(['FACT', 'PREFERENCE', 'LESSON', 'CONTEXT', 'GOAL']).default('LESSON'),
    scope: z.enum(['AGENT', 'COMPANY']).default('AGENT'),
  }),
  describe: (a) => `Registrar memória (${a.scope === 'COMPANY' ? 'empresa' : 'agente'}): ${a.content.slice(0, 80)}`,
  async run({ ctx, agent, task }, a) {
    const m = await saveAgentMemory(ctx, { agentId: agent.id, taskId: task.id, content: a.content, title: a.title, kind: a.kind, scope: a.scope });
    return { data: { memoryId: m.id }, summary: 'Memória registrada.' };
  },
});

export const tasksCreate = defineTool({
  key: 'tasks.create',
  label: 'Criar tarefa para a equipe',
  description: 'Cria uma tarefa (ou follow-up) na lista de tarefas da equipe humana, opcionalmente ligada a um contato e a um responsável.',
  argsHint: '{"title": "Ligar para a Pousada X", "type": "FOLLOW_UP", "priority": "HIGH", "dueInHours": 24, "contactId": "..."}',
  risk: 'low',
  schema: z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(['TASK', 'FOLLOW_UP']).default('TASK'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueInHours: z.coerce.number().int().min(1).max(24 * 60).optional(),
    contactId: id.optional(),
    assigneeId: id.optional(),
  }),
  describe: (a) => `Criar ${a.type === 'FOLLOW_UP' ? 'follow-up' : 'tarefa'}: ${a.title}`,
  async run({ ctx, agent }, a) {
    if (a.assigneeId) await assertMember(ctx, a.assigneeId);
    const t = await createTask(
      ctx,
      {
        title: a.title,
        description: [a.description, `Criada por ${agent.name} (Equipe IA).`].filter(Boolean).join('\n\n'),
        type: a.type,
        priority: a.priority,
        dueAt: a.dueInHours ? new Date(Date.now() + a.dueInHours * 3_600_000).toISOString() : null,
        contactId: a.contactId ?? null,
        assigneeId: a.assigneeId ?? null,
      },
      { source: 'AI' },
    );
    return { data: { taskId: t.id }, summary: `Tarefa criada: ${t.title}.` };
  },
});

export const notesAdd = defineTool({
  key: 'notes.add',
  label: 'Registrar observação no contato',
  description: 'Adiciona uma observação na timeline do contato.',
  argsHint: '{"contactId": "...", "text": "Demonstrou interesse no plano Professional"}',
  risk: 'low',
  schema: z.object({ contactId: id, text: z.string().trim().min(3).max(2000) }),
  describe: (a) => `Registrar observação: ${a.text.slice(0, 80)}`,
  async run({ ctx, agent }, a) {
    await addNote(ctx, a.contactId, `[${agent.name}] ${a.text}`);
    return { data: { contactId: a.contactId }, summary: 'Observação registrada.' };
  },
});

export const draftsWrite = defineTool({
  key: 'drafts.write',
  label: 'Escrever rascunho',
  description: 'Escreve um rascunho (mensagem, e-mail, post, roteiro, documento) para revisão humana. Não envia nada.',
  argsHint: '{"kind": "mensagem", "title": "Follow-up Pousada X", "body": "Olá...", "contactId": "..."}',
  risk: 'low',
  schema: z.object({
    kind: z.enum(['mensagem', 'email', 'post', 'campanha', 'roteiro', 'documento', 'proposta']).default('mensagem'),
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(3).max(5000),
    contactId: id.optional(),
    channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'WEBCHAT']).optional(),
  }),
  describe: (a) => `Rascunho (${a.kind}): ${a.title}`,
  async run({ orgId, agent, task }, a) {
    const categories = scanSensitive(a.body);
    await logActivity({
      orgId,
      agentId: agent.id,
      objectiveId: task.objectiveId,
      taskId: task.id,
      type: 'draft.created',
      message: `${agent.name} escreveu um rascunho: ${a.title}`,
      data: { kind: a.kind, contactId: a.contactId ?? null, categories },
    });
    return {
      data: { rascunho: { tipo: a.kind, titulo: a.title, texto: a.body, contactId: a.contactId ?? null, canal: a.channel ?? null }, categoriasSensiveis: categories },
      summary: `Rascunho "${a.title}" pronto para revisão${categories.length ? ' (contém tema sensível: exige aprovação para envio)' : ''}.`,
    };
  },
});

export const agentsDelegate = defineTool({
  key: 'agents.delegate',
  label: 'Delegar a outro agente',
  description: 'Cria uma tarefa para um agente especializado (prospeccao, sdr, marketing, dev, financeiro, cs). Use afterPrevious=true para executar só depois da tarefa delegada anteriormente.',
  argsHint: '{"agentKey": "sdr", "title": "Follow-up dos leads parados", "instructions": "...", "priority": 7, "afterPrevious": false}',
  risk: 'low',
  schema: z.object({
    agentKey: z.enum(['prospeccao', 'sdr', 'marketing', 'dev', 'financeiro', 'cs']),
    title: z.string().trim().min(3).max(200),
    instructions: z.string().trim().min(5).max(4000),
    priority: z.coerce.number().int().min(1).max(9).default(5),
    afterPrevious: z.boolean().default(false),
  }),
  describe: (a) => `Delegar para ${a.agentKey}: ${a.title}`,
  async run(tc, a) {
    const child = await delegateTask(tc, a);
    return { data: { taskId: child.id, agentKey: a.agentKey }, summary: `Tarefa delegada para ${a.agentKey}: ${a.title}.` };
  },
});

export const followupsSchedule = defineTool({
  key: 'followups.schedule',
  label: 'Agendar follow-ups',
  description: 'Cria tarefas de follow-up (para o responsável de cada contato) para leads sem interação há N dias que ainda não têm follow-up em aberto.',
  argsHint: '{"days": 3, "max": 10, "dueInHours": 24}',
  risk: 'low',
  schema: z.object({
    days: z.coerce.number().int().min(1).max(60).default(3),
    max: z.coerce.number().int().min(1).max(25).default(10),
    dueInHours: z.coerce.number().int().min(1).max(24 * 14).default(24),
  }),
  describe: (a) => `Criar até ${a.max} follow-ups para leads sem contato há ${a.days}+ dias`,
  async run({ ctx, agent }, a) {
    const leads = await findLeadsNeedingFollowup(ctx, a.days, 60);
    const open = await ctx.db.task.findMany({
      where: { type: 'FOLLOW_UP', status: { in: ['TODO', 'IN_PROGRESS'] }, contactId: { in: leads.map((l) => l.id) } },
      select: { contactId: true },
    });
    const has = new Set(open.map((t) => t.contactId));
    const created: { contactId: string; nome: string; taskId: string }[] = [];
    for (const l of leads) {
      if (created.length >= a.max) break;
      if (has.has(l.id)) continue;
      const t = await createTask(
        ctx,
        {
          title: `Follow-up: ${l.name}`,
          description: `Lead sem interação há ${a.days}+ dias${l.opportunities[0] ? ` (oportunidade "${l.opportunities[0].title}", etapa ${l.opportunities[0].stage.name})` : ''}.\nCriado por ${agent.name} (Equipe IA).`,
          type: 'FOLLOW_UP',
          priority: l.opportunities[0] && toNumber(l.opportunities[0].value) > 0 ? 'HIGH' : 'MEDIUM',
          dueAt: new Date(Date.now() + a.dueInHours * 3_600_000).toISOString(),
          contactId: l.id,
          assigneeId: l.ownerId,
        },
        { source: 'AI' },
      );
      created.push({ contactId: l.id, nome: l.name, taskId: t.id });
    }
    return {
      data: { criados: created, jaTinhamFollowup: leads.filter((l) => has.has(l.id)).length },
      summary: created.length ? `${created.length} follow-up(s) criado(s): ${created.slice(0, 5).map((c) => c.nome).join(', ')}${created.length > 5 ? '…' : ''}.` : 'Nenhum follow-up novo necessário.',
    };
  },
});

export const devRequestChange = defineTool({
  key: 'dev.request_change',
  label: 'Registrar pedido de desenvolvimento',
  description: 'Registra um pedido de correção ou melhoria do produto como tarefa da equipe técnica (com contexto e critério de aceite). Nunca faz merge, deploy ou altera credenciais.',
  argsHint: '{"kind": "bug", "title": "...", "description": "contexto, impacto e critério de aceite", "priority": "HIGH"}',
  risk: 'low',
  schema: z.object({
    kind: z.enum(['bug', 'melhoria', 'ideia']).default('melhoria'),
    title: z.string().trim().min(5).max(160),
    description: z.string().trim().min(10).max(4000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  }),
  describe: (a) => `Pedido de desenvolvimento (${a.kind}): ${a.title}`,
  async run({ ctx, agent }, a) {
    const t = await createTask(ctx, { title: `[Dev/${a.kind}] ${a.title}`, description: `${a.description}\n\nRegistrado por ${agent.name} (Equipe IA).`, type: 'TASK', priority: a.priority }, { source: 'AI' });
    return { data: { taskId: t.id }, summary: `Pedido registrado: ${a.title}.` };
  },
});

export const leadsUpdateStatus = defineTool({
  key: 'leads.update_status',
  label: 'Atualizar status do lead',
  description: 'Atualiza o status de um lead (contatado, em conversa, qualificado, desqualificado).',
  argsHint: '{"contactId": "...", "status": "QUALIFIED", "reason": "orçamento e prazo confirmados"}',
  risk: 'medium',
  schema: z.object({ contactId: id, status: z.enum(['CONTACTED', 'IN_CONVERSATION', 'QUALIFIED', 'UNQUALIFIED']), reason: z.string().trim().max(300).optional() }),
  describe: (a) => `Alterar status do lead para ${a.status}${a.reason ? ` (${a.reason})` : ''}`,
  async run({ ctx, agent }, a) {
    await updateContact(ctx, a.contactId, { status: a.status });
    if (a.reason) await addNote(ctx, a.contactId, `[${agent.name}] Status alterado para ${a.status}: ${a.reason}`);
    return { data: { contactId: a.contactId, status: a.status }, summary: `Status atualizado para ${a.status}.` };
  },
});

export const opportunitiesMoveStage = defineTool({
  key: 'opportunities.move_stage',
  label: 'Mover oportunidade no funil',
  description: 'Move uma oportunidade para outra etapa do mesmo funil (pela chave da etapa, ex.: "qualified", "proposal"). Marcar como ganha/perdida é ação de alto risco.',
  argsHint: '{"opportunityId": "...", "stageKey": "proposal"}',
  risk: 'medium',
  schema: z.object({ opportunityId: id, stageKey: z.string().trim().min(2).max(40), lostReason: z.string().trim().max(300).optional() }),
  async assess({ ctx }, a) {
    const opp = await ctx.db.opportunity.findFirst({ where: { id: a.opportunityId }, select: { pipelineId: true } });
    const stage = opp ? await ctx.db.pipelineStage.findFirst({ where: { pipelineId: opp.pipelineId, key: a.stageKey }, select: { kind: true } }) : null;
    return stage && stage.kind !== 'OPEN' ? { risk: 'high' } : {};
  },
  describe: (a) => `Mover oportunidade para a etapa "${a.stageKey}"`,
  async run({ ctx }, a) {
    const opp = await ctx.db.opportunity.findFirst({ where: { id: a.opportunityId } });
    if (!opp) throw new NotFoundError('Oportunidade não encontrada.');
    const stage = await ctx.db.pipelineStage.findFirst({ where: { pipelineId: opp.pipelineId, key: a.stageKey } });
    if (!stage) throw new AppError(`Etapa "${a.stageKey}" não existe neste funil.`);
    await moveOpportunity(ctx, opp.id, stage.id, { lostReason: a.lostReason ?? null });
    return { data: { opportunityId: opp.id, etapa: stage.name }, summary: `Oportunidade "${opp.title}" movida para ${stage.name}.` };
  },
});

export const leadsAssignOwner = defineTool({
  key: 'leads.assign_owner',
  label: 'Atribuir responsável',
  description: 'Define o responsável (membro da equipe) por um lead.',
  argsHint: '{"contactId": "...", "userId": "..."}',
  risk: 'medium',
  schema: z.object({ contactId: id, userId: id }),
  describe: () => 'Atribuir responsável ao lead',
  async run({ ctx }, a) {
    await updateContact(ctx, a.contactId, { ownerId: a.userId });
    return { data: { contactId: a.contactId, ownerId: a.userId }, summary: 'Responsável atribuído.' };
  },
});

const prospectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(40).optional().nullable(),
  companyName: z.string().trim().max(160).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  segment: z.string().trim().max(60).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

type Prospect = z.infer<typeof prospectSchema>;

/** Cria prospects como leads (sem duplicar por telefone/e-mail/nome+cidade), com etiqueta e origem rastreáveis. */
async function importProspects(tc: Pick<ToolRunContext, 'ctx' | 'agent'>, prospects: Prospect[], origin: string) {
  const { ctx, agent } = tc;
  const created: { contactId: string; nome: string }[] = [];
  let duplicates = 0;
  let invalid = 0;
  let limitReached = false;
  for (const raw of prospects) {
    const parsed = prospectSchema.safeParse(raw);
    if (!parsed.success) {
      invalid++;
      continue;
    }
    const p = parsed.data;
    const phone = normalizePhone(p.phone);
    const email = normalizeEmail(p.email);
    const or: Prisma.ContactWhereInput[] = [
      ...(phone ? [{ phone }, { whatsapp: phone }] : []),
      ...(email ? [{ email }] : []),
      ...(p.city ? [{ name: { equals: p.name, mode: 'insensitive' as const }, city: { equals: p.city, mode: 'insensitive' as const } }] : []),
    ];
    if (or.length && (await ctx.db.contact.findFirst({ where: { anonymizedAt: null, OR: or }, select: { id: true } }))) {
      duplicates++;
      continue;
    }
    try {
      const c = await createContact(
        ctx,
        {
          name: p.name,
          phone: phone ? `+${phone}` : null,
          email: email && z.string().email().safeParse(email).success ? email : null,
          city: p.city ?? null,
          state: p.state ?? null,
          companyName: p.companyName ?? null,
          source: 'prospeccao',
          sourceDetail: `${agent.name} (${origin})`,
          notes: [p.segment ? `Segmento: ${p.segment}` : null, p.website ? `Site: ${p.website}` : null, p.notes].filter(Boolean).join('\n') || null,
        },
        { createOpportunity: false, emitLeadEvent: false },
      );
      await addTagByName(ctx, c.id, PROSPECT_TAG);
      created.push({ contactId: c.id, nome: c.name });
    } catch (err) {
      if (err instanceof LimitExceededError) {
        limitReached = true;
        break;
      }
      throw err;
    }
  }
  return { created, duplicates, invalid, limitReached };
}

export const leadsCreate = defineTool({
  key: 'leads.create',
  label: 'Cadastrar prospects',
  description: 'Cadastra até 30 prospects como leads (origem "prospeccao", etiqueta "Prospecção IA"), ignorando duplicados.',
  argsHint: '{"leads": [{"name": "Pousada Exemplo", "city": "Gramado", "state": "RS", "phone": "(54) 99999-0000"}]}',
  risk: 'medium',
  schema: z.object({ leads: z.array(prospectSchema).min(1).max(30) }),
  describe: (a) => `Cadastrar ${a.leads.length} prospect(s) como leads`,
  async run(tc, a) {
    const r = await importProspects(tc, a.leads, 'cadastro manual do agente');
    return {
      data: r,
      summary: `${r.created.length} lead(s) cadastrado(s); ${r.duplicates} duplicado(s) ignorado(s)${r.limitReached ? '; limite de contatos do plano atingido' : ''}.`,
    };
  },
});

export const leadsImportProspects = defineTool({
  key: 'leads.import_prospects',
  label: 'Importar prospects do n8n',
  description: 'Importa como leads os prospects retornados por uma busca concluída no n8n (n8n.prospect_search), ignorando duplicados.',
  argsHint: '{"dispatchId": "...", "max": 50}',
  risk: 'medium',
  schema: z.object({ dispatchId: id, max: z.coerce.number().int().min(1).max(100).default(50) }),
  describe: (a) => `Importar até ${a.max} prospects da busca ${a.dispatchId}`,
  async run(tc, a) {
    const d = await tc.ctx.db.n8nDispatch.findFirst({ where: { id: a.dispatchId, workflow: 'prospeccao' } });
    if (!d) throw new NotFoundError('Busca de prospecção não encontrada.');
    if (d.status !== 'COMPLETED') throw new AppError(`A busca ainda não foi concluída (situação: ${d.status}).`);
    const result = (d.result ?? {}) as { prospects?: unknown };
    const list = Array.isArray(result.prospects) ? result.prospects : Array.isArray(d.result) ? (d.result as unknown[]) : [];
    const r = await importProspects(tc, list.slice(0, a.max) as Prospect[], 'busca n8n');
    return {
      data: r,
      summary: `${r.created.length} prospect(s) importado(s) de ${list.length} encontrado(s); ${r.duplicates} duplicado(s), ${r.invalid} inválido(s)${r.limitReached ? '; limite de contatos do plano atingido' : ''}.`,
    };
  },
});

export const calendarSchedule = defineTool({
  key: 'calendar.schedule',
  label: 'Agendar compromisso',
  description: 'Cria um compromisso na agenda (reunião, ligação, visita), opcionalmente ligado a um contato.',
  argsHint: '{"title": "Demonstração para Pousada X", "startsAt": "2026-10-10T14:00:00-03:00", "durationMinutes": 30, "type": "MEETING", "contactId": "..."}',
  risk: 'medium',
  schema: z.object({
    title: z.string().trim().min(3).max(200),
    startsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.coerce.number().int().min(15).max(480).default(30),
    type: z.enum(['MEETING', 'CALL', 'VISIT', 'SERVICE', 'FOLLOW_UP', 'TASK', 'RETURN']).default('MEETING'),
    contactId: id.optional(),
    description: z.string().trim().max(2000).optional(),
  }),
  describe: (a) => `Agendar "${a.title}" em ${a.startsAt}`,
  async run({ ctx }, a) {
    const start = new Date(a.startsAt);
    if (start.getTime() < Date.now() - 60_000) throw new AppError('Não é possível agendar no passado.');
    const appt = await createAppointment(ctx, {
      title: a.title,
      type: a.type,
      description: a.description ?? null,
      startsAt: start,
      endsAt: new Date(start.getTime() + a.durationMinutes * 60_000),
      contactId: a.contactId ?? null,
    });
    return { data: { appointmentId: appt.id }, summary: `Compromisso agendado: ${a.title}.` };
  },
});

export const messagesSend = defineTool({
  key: 'messages.send',
  label: 'Enviar mensagem ao cliente',
  description: 'Envia uma mensagem a um contato pelo canal da conversa (WhatsApp, Instagram, e-mail ou chat do site). Sempre revisada por uma pessoa antes do envio, salvo autorização explícita da empresa.',
  argsHint: '{"contactId": "...", "text": "Olá, ...", "channel": "WHATSAPP"}',
  risk: 'high',
  schema: z.object({ contactId: id, text: z.string().trim().min(2).max(2000), channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'WEBCHAT']).optional() }),
  assess: (_tc, a) => ({ categories: scanSensitive(a.text) }),
  describe: (a) => `Enviar mensagem${a.channel ? ` (${a.channel})` : ''}: "${a.text.slice(0, 140)}"`,
  async run({ ctx, agent, task }, a) {
    const contact = await ctx.db.contact.findFirst({ where: { id: a.contactId, anonymizedAt: null } });
    if (!contact) throw new NotFoundError('Contato não encontrado.');
    let conversation = await ctx.db.conversation.findFirst({
      where: { contactId: contact.id, status: { in: ['OPEN', 'PENDING'] }, ...(a.channel ? { channel: a.channel } : {}) },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (!conversation) {
      const channel: Channel = a.channel ?? (contact.whatsapp || contact.phone ? 'WHATSAPP' : contact.email ? 'EMAIL' : 'WEBCHAT');
      if (channel === 'WEBCHAT') throw new AppError('O contato não tem canal ativo para receber mensagens.');
      conversation = await startConversation(ctx, contact.id, channel);
    }
    const msg = await sendMessage(ctx, conversation.id, { body: a.text, senderType: 'AI', metadata: { aiAgent: agent.key, aiTaskId: task.id } });
    if (msg.status === 'FAILED') throw new AppError(`Mensagem não enviada: ${msg.error ?? 'falha no canal'}.`);
    return { data: { messageId: msg.id, conversationId: conversation.id, canal: conversation.channel }, summary: `Mensagem enviada por ${conversation.channel}.` };
  },
});

export const proposalsDraft = defineTool({
  key: 'proposals.draft',
  label: 'Registrar proposta comercial',
  description: 'Registra uma proposta com itens e valores (e desconto, se houver) no contato e atualiza o valor da oportunidade. Sempre exige aprovação humana.',
  argsHint: '{"contactId": "...", "opportunityId": "...", "items": [{"description": "Plano Professional (mensal)", "amount": 397}], "discountPercent": 0, "notes": "..."}',
  risk: 'critical',
  categories: ['preco', 'contrato'],
  schema: z.object({
    contactId: id,
    opportunityId: id.optional(),
    items: z.array(z.object({ description: z.string().trim().min(2).max(200), amount: z.coerce.number().min(0).max(10_000_000) })).min(1).max(20),
    discountPercent: z.coerce.number().min(0).max(50).default(0),
    validityDays: z.coerce.number().int().min(1).max(90).default(15),
    notes: z.string().trim().max(2000).optional(),
  }),
  assess: (_tc, a) => (a.discountPercent > 0 ? { categories: ['preco', 'contrato', 'desconto'] } : {}),
  describe: (a) => {
    const subtotal = a.items.reduce((s, i) => s + i.amount, 0);
    const total = subtotal * (1 - a.discountPercent / 100);
    return `Proposta de ${formatMoney(total)}${a.discountPercent ? ` (desconto de ${a.discountPercent}%)` : ''}: ${a.items.map((i) => `${i.description} ${formatMoney(i.amount)}`).join('; ')}`;
  },
  async run({ ctx, agent }, a) {
    const contact = await ctx.db.contact.findFirst({ where: { id: a.contactId, anonymizedAt: null } });
    if (!contact) throw new NotFoundError('Contato não encontrado.');
    const subtotal = a.items.reduce((s, i) => s + i.amount, 0);
    const total = Math.round(subtotal * (1 - a.discountPercent / 100) * 100) / 100;
    if (a.opportunityId) {
      const opp = await ctx.db.opportunity.findFirst({ where: { id: a.opportunityId, contactId: contact.id } });
      if (!opp) throw new NotFoundError('Oportunidade não encontrada para este contato.');
      await ctx.db.opportunity.update({ where: { id: opp.id }, data: { value: total } });
    }
    const lines = a.items.map((i) => `- ${i.description}: ${formatMoney(i.amount)}`).join('\n');
    await addNote(
      ctx,
      contact.id,
      `[${agent.name}] Proposta aprovada por uma pessoa da equipe:\n${lines}\n${a.discountPercent ? `Desconto: ${a.discountPercent}%\n` : ''}Total: ${formatMoney(total)} — validade ${a.validityDays} dias.${a.notes ? `\n${a.notes}` : ''}`,
    );
    return { data: { contactId: contact.id, total }, summary: `Proposta de ${formatMoney(total)} registrada para ${contact.name}.` };
  },
});
