import type { Chatbot, Message, Prisma } from '@prisma/client';
import { z } from 'zod';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { LimitExceededError, NotConfiguredError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { safeTimeZone } from '@/lib/utils';
import { checkLimit, incrementUsage, USAGE_METRICS } from '../billing/limits';
import { CUSTOM_FIELD_LABELS } from '../contacts';
import { getAiProvider, type AiProvider, type ChatMessage } from './provider';
import { retrieve } from './rag';

export const INTENTS: Record<string, string> = {
  greeting: 'Saudação',
  information: 'Pedido de informação',
  pricing: 'Consulta de preço',
  booking: 'Interesse em reserva/agendamento',
  purchase: 'Intenção de compra',
  support: 'Suporte',
  complaint: 'Reclamação',
  cancellation: 'Cancelamento',
  human_request: 'Pediu atendente humano',
  other: 'Outro',
};

const FIELD_DESCRIPTIONS: Record<string, string> = {
  name: 'nome',
  phone: 'telefone/WhatsApp',
  email: 'e-mail',
  interest: 'interesse/serviço desejado',
  budget: 'orçamento',
  desiredDate: 'data desejada',
  ...Object.fromEntries(Object.entries(CUSTOM_FIELD_LABELS).map(([k, v]) => [k, v.toLowerCase()])),
};

export interface BusinessHours {
  enabled?: boolean;
  timezone?: string;
  days?: Partial<Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', [string, string]>>;
  outOfHoursMessage?: string;
}

export function isWithinBusinessHours(hours: BusinessHours | null | undefined, now = new Date(), orgTimezone?: string): boolean {
  if (!hours?.enabled || !hours.days) return true;
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: safeTimeZone(hours.timezone, orgTimezone), weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const day = (parts.weekday ?? '').toLowerCase().slice(0, 3) as keyof NonNullable<BusinessHours['days']>;
  const range = hours.days[day];
  if (!range) return false;
  const hhmm = `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
  return hhmm >= range[0] && hhmm < range[1];
}

export interface HandoffRules {
  keywords?: string[];
  maxAiTurns?: number;
  message?: string;
}

/** Regras determinísticas de transferência para humano (complementam a decisão da IA). */
export function detectHandoff(text: string, rules: HandoffRules | null | undefined, aiTurns: number): string | null {
  const t = text.toLowerCase();
  const keywords = rules?.keywords?.length ? rules.keywords : ['atendente', 'humano'];
  const hit = keywords.find((k) => k.trim() && t.includes(k.toLowerCase().trim()));
  if (hit) return `Cliente mencionou "${hit}"`;
  if (rules?.maxAiTurns && aiTurns >= rules.maxAiTurns) return `Limite de ${rules.maxAiTurns} respostas automáticas atingido`;
  return null;
}

export const assistantOutputSchema = z.object({
  reply: z.string().default(''),
  intent: z.string().default('other'),
  handoff: z.boolean().default(false),
  handoffReason: z.string().nullable().optional(),
  extracted: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
});
export type AssistantOutput = z.infer<typeof assistantOutputSchema>;

function looksLikeJson(text: string) {
  const t = text.trim();
  return t.startsWith('{') || t.startsWith('[') || t.startsWith('```');
}

/**
 * Interpreta a saída do modelo de forma tolerante: aproveita os campos válidos mesmo quando o JSON não segue
 * exatamente o esquema, e NUNCA devolve JSON cru como resposta ao cliente.
 */
export function parseAssistantOutput(text: string): AssistantOutput {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      if (raw && typeof raw === 'object') {
        const reply = typeof raw.reply === 'string' ? raw.reply : typeof raw.message === 'string' ? raw.message : '';
        const intent = typeof raw.intent === 'string' && raw.intent in INTENTS ? raw.intent : 'other';
        const handoff = raw.handoff === true || raw.handoff === 'true';
        const extracted: Record<string, string | number | null> = {};
        if (raw.extracted && typeof raw.extracted === 'object') {
          for (const [k, v] of Object.entries(raw.extracted as Record<string, unknown>)) {
            if (typeof v === 'string' || typeof v === 'number') extracted[k] = v;
            else if (v === null) extracted[k] = null;
          }
        }
        return {
          reply: looksLikeJson(reply) ? '' : reply.trim(),
          intent,
          handoff,
          handoffReason: typeof raw.handoffReason === 'string' ? raw.handoffReason : null,
          extracted,
        };
      }
    } catch {
      /* não é JSON válido: trata como texto */
    }
  }
  return { reply: looksLikeJson(text) ? '' : text.trim(), intent: 'other', handoff: false, extracted: {} };
}

export function buildSystemPrompt(input: {
  orgName: string;
  chatbot: Pick<Chatbot, 'name' | 'tone' | 'instructions' | 'collectFields' | 'faq' | 'businessHours'>;
  knowledge: { title: string; content: string }[];
  contactSummary: string;
  withinHours: boolean;
  orgTimezone?: string;
  now?: Date;
}) {
  const { chatbot } = input;
  const faq = Array.isArray(chatbot.faq) ? (chatbot.faq as { q?: string; a?: string }[]).filter((f) => f.q && f.a) : [];
  const hours = chatbot.businessHours as BusinessHours;
  const fields = chatbot.collectFields.map((f) => FIELD_DESCRIPTIONS[f] ?? f).join(', ');
  return [
    `Você é ${chatbot.name}, assistente virtual de atendimento da empresa "${input.orgName}".`,
    `Tom de voz: ${chatbot.tone}. Responda sempre em português do Brasil, de forma breve (até 3 frases), clara e cordial.`,
    'REGRAS IMPORTANTES:',
    '- Use SOMENTE as informações da BASE DE CONHECIMENTO e FAQ abaixo para dados da empresa (preços, políticas, horários, disponibilidade).',
    '- Se a informação não estiver disponível, diga que vai verificar com a equipe — NUNCA invente preços, disponibilidade ou condições.',
    '- Não confirme reservas, pagamentos ou compromissos: colete os dados e informe que a equipe confirmará.',
    '- Não solicite dados sensíveis (documentos, cartão de crédito, senhas).',
    `- Colete naturalmente, ao longo da conversa e sem interrogatório, estas informações: ${fields || 'nome e contato'}.`,
    '- Se o cliente pedir um humano, estiver insatisfeito ou o assunto exigir decisão da equipe, marque handoff=true.',
    chatbot.instructions ? `INSTRUÇÕES DA EMPRESA:\n${chatbot.instructions}` : '',
    `Data/hora atual: ${(input.now ?? new Date()).toLocaleString('pt-BR', { timeZone: safeTimeZone(hours?.timezone, input.orgTimezone) })}.`,
    input.withinHours
      ? 'A equipe humana está em horário de atendimento.'
      : `A equipe humana está FORA do horário de atendimento. ${hours?.outOfHoursMessage ?? ''}`,
    `DADOS JÁ CONHECIDOS DO CLIENTE: ${input.contactSummary || 'nenhum'}`,
    faq.length ? `FAQ:\n${faq.map((f) => `P: ${f.q}\nR: ${f.a}`).join('\n')}` : '',
    input.knowledge.length
      ? `BASE DE CONHECIMENTO:\n${input.knowledge.map((k, i) => `[${i + 1}] ${k.title}\n${k.content}`).join('\n---\n')}`
      : 'BASE DE CONHECIMENTO: (vazia)',
    'FORMATO DE SAÍDA: responda APENAS com JSON válido:',
    `{"reply": "mensagem ao cliente", "intent": "${Object.keys(INTENTS).join('|')}", "handoff": false, "handoffReason": null, "extracted": {"name": null, "phone": null, "email": null, "interest": null, "budget": null, "desiredDate": null, "checkIn": null, "checkOut": null, "guests": null, "roomType": null}}`,
    'Em "extracted", inclua apenas dados que o cliente informou explicitamente (datas em AAAA-MM-DD).',
  ]
    .filter(Boolean)
    .join('\n');
}

export function historyToMessages(history: Pick<Message, 'direction' | 'body' | 'senderType'>[]): ChatMessage[] {
  return history
    .filter((m) => m.body.trim() && m.senderType !== 'SYSTEM')
    .map((m) => ({ role: m.direction === 'INBOUND' ? ('user' as const) : ('assistant' as const), content: m.body.slice(0, 2000) }));
}

function requireProvider(): AiProvider {
  const p = getAiProvider();
  if (!p) throw new NotConfiguredError('IA não configurada. Defina OPENAI_API_KEY, ANTHROPIC_API_KEY ou GEMINI_API_KEY nas variáveis de ambiente.');
  return p;
}

export async function assertAiQuota(ctx: ServiceCtx) {
  const r = await checkLimit(ctx, 'aiMessagesPerMonth');
  if (!r.allowed) throw new LimitExceededError('Limite mensal de mensagens de IA do plano atingido.');
}

export interface TrackedChatOptions {
  json?: boolean;
  conversationId?: string | null;
  maxTokens?: number;
  effort?: 'low' | 'medium' | 'high';
  /** Provedor específico (ex.: o modelo de um agente da Equipe IA). Padrão: provedor do ambiente. */
  provider?: AiProvider;
}

/**
 * Executa uma chamada de IA registrando métricas (AiRun), consumo do plano e respeitando a cota mensal.
 * Usada pelo chatbot e pela Equipe IA (cada agente com seu provedor/modelo).
 */
export async function trackedChat(ctx: ServiceCtx, kind: string, messages: ChatMessage[], opts: TrackedChatOptions = {}) {
  const provider = opts.provider ?? requireProvider();
  await assertAiQuota(ctx);
  const started = Date.now();
  try {
    const res = await provider.chat(messages, { json: opts.json, maxTokens: opts.maxTokens, effort: opts.effort });
    const run = await ctx.db.aiRun.create({
      data: {
        organizationId: ctx.orgId,
        kind,
        provider: provider.name,
        model: res.model,
        conversationId: opts.conversationId ?? null,
        tokensIn: res.tokensIn,
        tokensOut: res.tokensOut,
        latencyMs: Date.now() - started,
      },
    });
    await incrementUsage(ctx.orgId, USAGE_METRICS.aiMessages);
    return { ...res, runId: run.id, provider: provider.name, latencyMs: Date.now() - started };
  } catch (err) {
    await ctx.db.aiRun.create({
      data: {
        organizationId: ctx.orgId,
        kind,
        provider: provider.name,
        model: provider.model,
        conversationId: opts.conversationId ?? null,
        status: 'FAILED',
        error: err instanceof Error ? err.message.slice(0, 500) : 'erro',
        latencyMs: Date.now() - started,
      },
    });
    logger.error('ai.chat_failed', { orgId: ctx.orgId, kind, err });
    throw err;
  }
}

function contactSummary(contact: { name: string; email: string | null; phone: string | null; interest: string | null; customFields: unknown }) {
  const parts = [`nome: ${contact.name}`];
  if (contact.email) parts.push(`e-mail: ${contact.email}`);
  if (contact.phone) parts.push(`telefone: ${contact.phone}`);
  if (contact.interest) parts.push(`interesse: ${contact.interest}`);
  for (const [k, v] of Object.entries((contact.customFields ?? {}) as Record<string, unknown>)) parts.push(`${CUSTOM_FIELD_LABELS[k] ?? k}: ${String(v)}`);
  return parts.join('; ');
}

export async function getChatbot(ctx: ServiceCtx) {
  return ctx.db.chatbot.findFirst({ orderBy: { createdAt: 'asc' } });
}

/**
 * Gera a resposta do assistente para uma conversa (usada no modo automático e no copiloto).
 */
export async function generateAssistantReply(ctx: ServiceCtx, conversationId: string, kind: 'auto_reply' | 'suggest' = 'auto_reply') {
  const conversation = await ctx.db.conversation.findFirst({
    where: { id: conversationId },
    include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!conversation) throw new NotFoundError('Conversa não encontrada.');
  const chatbot = await getChatbot(ctx);
  if (!chatbot) throw new NotConfiguredError('Chatbot não configurado.');
  const org = await ctx.db.organization.findFirstOrThrow({});
  const history = [...conversation.messages].reverse();
  const lastInbound = [...history].reverse().find((m) => m.direction === 'INBOUND');
  const query = history.filter((m) => m.direction === 'INBOUND').slice(-3).map((m) => m.body).join('\n');
  const knowledge = await retrieve(ctx, query || lastInbound?.body || '', 5);
  const system = buildSystemPrompt({
    orgName: org.name,
    chatbot,
    knowledge,
    contactSummary: contactSummary(conversation.contact),
    withinHours: isWithinBusinessHours(chatbot.businessHours as BusinessHours, new Date(), org.timezone),
    orgTimezone: org.timezone,
  });
  const messages: ChatMessage[] = [{ role: 'system', content: system }, ...historyToMessages(history)];
  if (kind === 'suggest') {
    messages.push({ role: 'system', content: 'Gere a próxima resposta que o ATENDENTE humano deve enviar ao cliente.' });
  }
  const res = await trackedChat(ctx, kind, messages, { json: true, conversationId, effort: 'low' }); // chat: respostas rápidas
  const output = parseAssistantOutput(res.text);
  return { ...output, runId: res.runId, sources: knowledge.map((k) => k.title) };
}

export async function summarizeConversation(ctx: ServiceCtx, conversationId: string) {
  assertCan(ctx, 'ai.use');
  const conversation = await ctx.db.conversation.findFirst({
    where: { AND: [{ id: conversationId }, ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput] },
    include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 60 } },
  });
  if (!conversation) throw new NotFoundError('Conversa não encontrada.');
  const transcript = [...conversation.messages]
    .reverse()
    .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : m.senderType === 'AI' ? 'Assistente' : 'Atendente'}: ${m.body.slice(0, 600)}`)
    .join('\n');
  const res = await trackedChat(
    ctx,
    'summarize',
    [
      {
        role: 'system',
        content:
          'Resuma a conversa de atendimento em português, em até 5 tópicos curtos: necessidade do cliente, dados coletados, objeções, status e próximo passo recomendado. Responda em JSON: {"summary": "texto com tópicos", "intent": "chave", "nextAction": "texto curto"}',
      },
      { role: 'user', content: transcript || '(sem mensagens)' },
    ],
    { json: true, conversationId, maxTokens: 500 },
  );
  let summary = res.text;
  let intent: string | null = null;
  let nextAction: string | null = null;
  try {
    const j = JSON.parse(res.text) as { summary?: string; intent?: string; nextAction?: string };
    summary = j.summary ?? summary;
    intent = j.intent && j.intent in INTENTS ? j.intent : null;
    nextAction = j.nextAction ?? null;
  } catch {
    /* texto puro */
  }
  await ctx.db.conversation.update({ where: { id: conversationId }, data: { summary, intent: intent ?? undefined } });
  return { summary, intent, nextAction };
}

/** Recomenda próxima ação comercial e categoriza o lead. */
export async function recommendNextAction(ctx: ServiceCtx, contactId: string) {
  assertCan(ctx, 'ai.use');
  const contact = await ctx.db.contact.findFirst({
    where: { AND: [{ id: contactId, anonymizedAt: null }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput] },
    include: {
      opportunities: { include: { stage: true }, where: { status: 'OPEN' } },
      timelineEvents: { orderBy: { createdAt: 'desc' }, take: 15 },
      conversations: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } }, orderBy: { lastMessageAt: 'desc' }, take: 2 },
    },
  });
  if (!contact) throw new NotFoundError('Contato não encontrado.');
  const context = [
    `Contato: ${contactSummary(contact)}; status: ${contact.status}; origem: ${contact.source}`,
    `Oportunidades: ${contact.opportunities.map((o) => `${o.title} (${o.stage.name}, valor ${o.value ?? 'n/d'})`).join('; ') || 'nenhuma'}`,
    `Histórico: ${contact.timelineEvents.map((e) => `${e.createdAt.toISOString().slice(0, 10)} ${e.title}`).join(' | ')}`,
    `Últimas mensagens: ${contact.conversations.flatMap((c) => c.messages.map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Nós'}: ${m.body.slice(0, 200)}`)).join(' | ')}`,
  ].join('\n');
  const res = await trackedChat(
    ctx,
    'next_action',
    [
      {
        role: 'system',
        content:
          'Você é um consultor comercial. Com base no contexto, responda em JSON: {"category": "quente|morno|frio", "score": 0-100, "nextAction": "ação recomendada objetiva", "followUpMessage": "mensagem curta e personalizada de follow-up para enviar ao cliente", "reasoning": "justificativa em 1 frase"}',
      },
      { role: 'user', content: context },
    ],
    { json: true, maxTokens: 500 },
  );
  try {
    return JSON.parse(res.text) as { category: string; score: number; nextAction: string; followUpMessage: string; reasoning: string };
  } catch {
    return { category: 'n/d', score: 0, nextAction: res.text, followUpMessage: '', reasoning: '' };
  }
}

/** Simulação do assistente na tela de configuração (não grava conversa). */
export async function testAssistant(ctx: ServiceCtx, messages: { role: 'user' | 'assistant'; content: string }[]) {
  assertCan(ctx, 'chatbot.manage');
  const chatbot = await getChatbot(ctx);
  if (!chatbot) throw new NotConfiguredError('Chatbot não configurado.');
  const org = await ctx.db.organization.findFirstOrThrow({});
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const knowledge = await retrieve(ctx, lastUser, 5);
  const system = buildSystemPrompt({
    orgName: org.name,
    chatbot,
    knowledge,
    contactSummary: '',
    withinHours: isWithinBusinessHours(chatbot.businessHours as BusinessHours, new Date(), org.timezone),
    orgTimezone: org.timezone,
  });
  const res = await trackedChat(ctx, 'test', [{ role: 'system', content: system }, ...messages.slice(-12)], { json: true });
  return { ...parseAssistantOutput(res.text), sources: knowledge.map((k) => k.title) };
}
