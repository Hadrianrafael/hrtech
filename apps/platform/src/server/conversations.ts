import type { Channel, ConversationStatus, Integration, Prisma, SenderType } from '@prisma/client';
import { audit } from '@/lib/audit';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { decryptJson } from '@/lib/crypto';
import { isUniqueViolation, withTenant } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { truncate } from '@/lib/utils';
import { generateAssistantReply, detectHandoff, getChatbot, type HandoffRules } from './ai/agent';
import { getAiProvider } from './ai/provider';
import { incrementUsage, USAGE_METRICS } from './billing/limits';
import { sendEmailMessage, type EmailAccountConfig } from './channels/email';
import { sendInstagramText, type IgConfig, type IgSecrets } from './channels/instagram';
import { isWithinServiceWindow, sendWhatsAppTemplate, sendWhatsAppText, type WaSecrets } from './channels/whatsapp';
import { applyExtractedFields, assertContactAccessible, findOrCreateContactByIdentity } from './contacts';
import { emitEvent } from './events';
import { addTimeline } from './timeline';

export const CHANNEL_LABELS: Record<Channel, string> = { WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', EMAIL: 'E-mail', WEBCHAT: 'Chat do site' };
export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = { OPEN: 'Aberta', PENDING: 'Pendente', RESOLVED: 'Resolvida' };

export interface ConversationFilters {
  channel?: string;
  status?: string;
  assignee?: string; // me | unassigned | <userId>
  q?: string;
  waiting?: boolean;
}

export async function listConversations(ctx: ServiceCtx, f: ConversationFilters = {}) {
  assertCan(ctx, 'inbox.use');
  const and: Prisma.ConversationWhereInput[] = [ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput];
  if (f.channel && f.channel in CHANNEL_LABELS) and.push({ channel: f.channel as Channel });
  if (f.status && f.status in CONVERSATION_STATUS_LABELS) and.push({ status: f.status as ConversationStatus });
  else if (f.status !== 'all') and.push({ status: { in: ['OPEN', 'PENDING'] } });
  if (f.assignee === 'me') and.push({ assigneeId: ctx.userId });
  else if (f.assignee === 'unassigned') and.push({ assigneeId: null });
  else if (f.assignee) and.push({ assigneeId: f.assignee });
  if (f.waiting) and.push({ awaitingReply: true });
  if (f.q) {
    and.push({
      OR: [
        { contact: { name: { contains: f.q, mode: 'insensitive' } } },
        { lastMessagePreview: { contains: f.q, mode: 'insensitive' } },
        { subject: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  return ctx.db.conversation.findMany({
    where: { AND: and },
    orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }],
    take: 200,
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function getConversation(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'inbox.use');
  const conversation = await ctx.db.conversation.findFirst({
    where: { AND: [{ id }, ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput] },
    include: {
      contact: { include: { tags: { include: { tag: true } }, opportunities: { where: { status: 'OPEN' }, include: { stage: true } } } },
      // As 500 mais recentes (invertidas abaixo para ordem cronológica).
      messages: { orderBy: { createdAt: 'desc' }, take: 500 },
      integration: { select: { id: true, name: true, type: true, status: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!conversation) throw new NotFoundError('Conversa não encontrada.');
  return { ...conversation, messages: conversation.messages.reverse() };
}

export async function markConversationRead(ctx: ServiceCtx, id: string) {
  await ctx.db.conversation.updateMany({ where: { id, unreadCount: { gt: 0 } }, data: { unreadCount: 0 } });
}

// ─────────────── Recebimento ───────────────

export interface InboundInput {
  channel: Channel;
  integrationId?: string | null;
  identityExternalId: string;
  contactDefaults: { name?: string | null; email?: string | null; phone?: string | null; instagram?: string | null };
  externalThreadId?: string | null;
  subject?: string | null;
  body: string;
  contentType?: string;
  media?: Record<string, unknown> | null;
  externalId?: string | null;
  receivedAt?: Date;
  metadata?: Record<string, unknown>;
  /** Para o widget: conversa já identificada pelo token do visitante. */
  conversationId?: string | null;
  runAi?: boolean;
}

const SOURCE_BY_CHANNEL: Record<Channel, string> = { WHATSAPP: 'whatsapp', INSTAGRAM: 'instagram', EMAIL: 'email', WEBCHAT: 'webchat' };

/**
 * Encontra (ou cria) a conversa do contato no canal. A busca e a criação rodam numa transação com advisory lock por
 * contato/canal/thread: mensagens simultâneas do mesmo contato esperam umas pelas outras e usam a mesma conversa,
 * sem criar duplicatas (e sem apagar conversas que outra requisição já esteja usando).
 */
async function findOrCreateConversation(ctx: ServiceCtx, contact: { id: string; ownerId: string | null }, input: InboundInput) {
  const thread = input.channel === 'EMAIL' ? (input.externalThreadId ?? null) : null;
  return withTenant(ctx.orgId, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`conversation:${ctx.orgId}:${contact.id}:${input.channel}:${thread ?? ''}`}))`;
    const base = { organizationId: ctx.orgId, contactId: contact.id, channel: input.channel };
    let conversation = await tx.conversation.findFirst({
      where: { ...base, ...(thread ? { externalThreadId: thread } : {}), ...(input.channel !== 'EMAIL' ? { status: { in: ['OPEN', 'PENDING'] } } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    // Conversas resolvidas de chat são reabertas na mesma thread do contato
    if (!conversation && input.channel !== 'EMAIL') {
      conversation = await tx.conversation.findFirst({ where: base, orderBy: { createdAt: 'desc' } });
    }
    if (conversation) return { conversation, created: false };
    const created = await tx.conversation.create({
      data: {
        ...base,
        integrationId: input.integrationId ?? null,
        externalThreadId: input.externalThreadId ?? null,
        subject: input.subject ?? null,
        assigneeId: contact.ownerId,
      },
    });
    return { conversation: created, created: true };
  });
}

/**
 * Registra mensagem recebida de qualquer canal. Idempotente pelo `externalId`
 * (reentregas de webhook não duplicam mensagens nem disparam automações duas vezes).
 */
export async function receiveInbound(ctx: ServiceCtx, input: InboundInput) {
  if (input.externalId) {
    const dup = await ctx.db.message.findFirst({ where: { externalId: input.externalId } });
    if (dup) return { duplicate: true as const, message: dup, conversation: null };
  }

  let conversation = input.conversationId ? await ctx.db.conversation.findFirst({ where: { id: input.conversationId } }) : null;
  let contactId = conversation?.contactId;
  let contactCreated = false;
  if (!conversation) {
    const { contact, created } = await findOrCreateContactByIdentity(ctx, input.channel, input.identityExternalId, {
      ...input.contactDefaults,
      source: SOURCE_BY_CHANNEL[input.channel],
    });
    contactId = contact.id;
    contactCreated = created;
    const found = await findOrCreateConversation(ctx, contact, input);
    conversation = found.conversation;
    if (found.created) await incrementUsage(ctx.orgId, USAGE_METRICS.conversations);
  }
  if (!contactId) throw new AppError('Contato não identificado.');

  let message;
  try {
    message = await ctx.db.message.create({
      data: {
        organizationId: ctx.orgId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        senderType: 'CONTACT',
        body: input.body.slice(0, 20_000),
        contentType: input.contentType ?? 'text',
        media: (input.media ?? undefined) as Prisma.InputJsonValue | undefined,
        externalId: input.externalId ?? null,
        status: 'RECEIVED',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        createdAt: input.receivedAt,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { duplicate: true as const, message: null, conversation };
    throw err;
  }

  const now = new Date();
  // Conversa resolvida que volta a receber mensagem = novo atendimento: a IA volta a atuar do zero.
  const reopened = conversation.status === 'RESOLVED';
  conversation = await ctx.db.conversation.update({
    where: { id: conversation.id },
    data: {
      ...(reopened ? { aiPaused: false, humanRequested: false, aiSessionStartedAt: now } : {}),
      status: 'OPEN',
      awaitingReply: true,
      unreadCount: { increment: 1 },
      lastMessageAt: now,
      lastInboundAt: now,
      lastMessagePreview: truncate(input.body, 120),
      integrationId: conversation.integrationId ?? input.integrationId ?? null,
    },
  });
  const contact = await ctx.db.contact.findFirst({ where: { id: contactId } });
  if (contact) {
    await ctx.db.contact.update({
      where: { id: contactId },
      data: {
        lastInteractionAt: now,
        ...(contact.status === 'NEW' || contact.status === 'CONTACTED' ? { status: 'IN_CONVERSATION' } : {}),
      },
    });
  }

  await emitEvent(
    ctx,
    'message.received',
    { contactId, conversationId: conversation.id, channel: input.channel, message: { body: input.body }, contactCreated },
    { eventKey: `msg:${message.id}` },
  );

  if (input.runAi !== false) await handleAi(ctx, conversation.id, message.body);
  return { duplicate: false as const, message, conversation };
}

/** Transfere a conversa para atendimento humano (pausa IA, registra e dispara automação). */
export async function requestHuman(ctx: ServiceCtx, conversationId: string, reason: string) {
  const conv = await ctx.db.conversation.findFirst({ where: { id: conversationId } });
  if (!conv || conv.humanRequested) return;
  await ctx.db.conversation.update({ where: { id: conversationId }, data: { aiPaused: true, humanRequested: true, status: 'OPEN' } });
  await addTimeline(ctx, { contactId: conv.contactId, type: 'handoff', actorType: ctx.actorType, title: `Transferido para atendimento humano: ${reason}` });
  await emitEvent(ctx, 'human.requested', { contactId: conv.contactId, conversationId, reason, channel: conv.channel }, { eventKey: `handoff:${conversationId}:${Date.now()}` });
}

/**
 * Decide se a IA deve agir na conversa (modo automático) e executa: resposta, qualificação,
 * identificação de intenção e transferência para humano. Nunca lança exceção para o canal.
 */
export async function handleAi(ctx: ServiceCtx, conversationId: string, lastInboundText: string) {
  try {
    const chatbot = await getChatbot(ctx);
    const conv = await ctx.db.conversation.findFirst({ where: { id: conversationId } });
    if (!chatbot || !conv || !chatbot.enabled || chatbot.mode === 'OFF') return null;
    if (!chatbot.channels.includes(conv.channel)) return null;
    if (conv.aiPaused || conv.humanRequested) return null;

    const aiCtx: ServiceCtx = { ...ctx, actorType: 'AI' };
    const aiTurns = await ctx.db.message.count({ where: { conversationId, senderType: 'AI', createdAt: { gte: conv.aiSessionStartedAt } } });
    const rules = chatbot.handoffRules as HandoffRules;
    const ruleHandoff = detectHandoff(lastInboundText, rules, aiTurns);
    if (ruleHandoff) {
      await requestHuman(aiCtx, conversationId, ruleHandoff);
      if (chatbot.mode === 'AUTO') {
        await sendMessage(aiCtx, conversationId, {
          body: rules?.message || 'Certo! Vou transferir você para um atendente da nossa equipe. Aguarde um instante, por favor.',
          senderType: 'AI',
        }).catch((err) => logger.warn('ai.handoff_message_failed', { err }));
      }
      return { handoff: true };
    }
    if (chatbot.mode !== 'AUTO' || !getAiProvider()) return null;

    const out = await generateAssistantReply(aiCtx, conversationId, 'auto_reply');
    const filled = await applyExtractedFields(aiCtx, conv.contactId, out.extracted);
    if (out.intent && out.intent !== conv.intent) {
      await ctx.db.conversation.update({ where: { id: conversationId }, data: { intent: out.intent } });
      if (!['other', 'greeting'].includes(out.intent)) {
        await emitEvent(aiCtx, 'intent.detected', { contactId: conv.contactId, conversationId, intent: out.intent, channel: conv.channel }, { eventKey: `intent:${conversationId}:${conv.aiSessionStartedAt.getTime()}:${out.intent}` });
      }
    }
    if (out.reply.trim()) await sendMessage(aiCtx, conversationId, { body: out.reply, senderType: 'AI', metadata: { aiRunId: out.runId, sources: out.sources } });
    if (out.handoff || out.intent === 'human_request') await requestHuman(aiCtx, conversationId, out.handoffReason || 'IA identificou necessidade de atendimento humano');
    return { reply: out.reply, intent: out.intent, filled };
  } catch (err) {
    logger.error('ai.auto_reply_failed', { orgId: ctx.orgId, conversationId, err });
    await audit({ organizationId: ctx.orgId, action: 'ai.auto_reply_failed', actorType: 'AI', entityType: 'Conversation', entityId: conversationId, severity: 'error', metadata: { error: err instanceof Error ? err.message : String(err) } });
    return null;
  }
}

// ─────────────── Envio ───────────────

async function resolveIntegration(ctx: ServiceCtx, channel: Channel, integrationId: string | null): Promise<Integration | null> {
  if (integrationId) {
    const i = await ctx.db.integration.findFirst({ where: { id: integrationId } });
    if (i) return i;
  }
  return ctx.db.integration.findFirst({ where: { type: channel, status: 'CONNECTED' }, orderBy: { createdAt: 'asc' } });
}

export interface SendInput {
  body: string;
  senderType?: SenderType;
  template?: { name: string; language: string; params?: string[] };
  metadata?: Record<string, unknown>;
}

/** Envia mensagem pelo canal da conversa e registra status (SENT/FAILED) — falhas nunca são silenciosas. */
export async function sendMessage(ctx: ServiceCtx, conversationId: string, input: SendInput) {
  const senderType = input.senderType ?? 'USER';
  if (senderType === 'USER') assertCan(ctx, 'inbox.use');
  const conversation = await ctx.db.conversation.findFirst({
    where: senderType === 'USER' ? { AND: [{ id: conversationId }, ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput] } : { id: conversationId },
    include: { contact: true },
  });
  if (!conversation) throw new NotFoundError('Conversa não encontrada.');
  const body = input.body.trim();
  if (!body && !input.template) throw new AppError('Digite uma mensagem.');

  if (conversation.channel === 'WHATSAPP' && !input.template && !isWithinServiceWindow(conversation.lastInboundAt)) {
    throw new AppError('Fora da janela de 24h do WhatsApp: o cliente não respondeu nas últimas 24 horas. Envie um template aprovado.');
  }

  const message = await ctx.db.message.create({
    data: {
      organizationId: ctx.orgId,
      conversationId,
      direction: 'OUTBOUND',
      senderType,
      senderUserId: senderType === 'USER' ? ctx.userId : null,
      body: input.template ? `[Template ${input.template.name}] ${body}`.trim() : body,
      contentType: input.template ? 'template' : conversation.channel === 'EMAIL' ? 'email' : 'text',
      status: 'QUEUED',
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  let externalId: string | null = null;
  let error: string | null = null;
  const integration = conversation.channel === 'WEBCHAT' ? null : await resolveIntegration(ctx, conversation.channel, conversation.integrationId);
  try {
    switch (conversation.channel) {
      case 'WEBCHAT':
        break; // entregue ao widget por polling
      case 'WHATSAPP': {
        if (!integration?.secretsEnc || integration.status !== 'CONNECTED') throw new AppError('WhatsApp não conectado. Configure em Integrações.');
        const secrets = decryptJson<WaSecrets>(integration.secretsEnc)!;
        const to = (await ctx.db.contactIdentity.findFirst({ where: { contactId: conversation.contactId, channel: 'WHATSAPP' } }))?.externalId ?? conversation.contact.whatsapp;
        if (!to) throw new AppError('Contato sem número de WhatsApp.');
        const phoneNumberId = (integration.config as { phoneNumberId?: string }).phoneNumberId ?? integration.externalId!;
        externalId = input.template ? await sendWhatsAppTemplate(secrets, phoneNumberId, to, input.template) : await sendWhatsAppText(secrets, phoneNumberId, to, body);
        break;
      }
      case 'INSTAGRAM': {
        if (!integration?.secretsEnc || integration.status !== 'CONNECTED') throw new AppError('Instagram não conectado. Configure em Integrações.');
        if (!isWithinServiceWindow(conversation.lastInboundAt)) throw new AppError('Fora da janela de 24h de mensagens do Instagram.');
        const identity = await ctx.db.contactIdentity.findFirst({ where: { contactId: conversation.contactId, channel: 'INSTAGRAM' } });
        if (!identity) throw new AppError('Contato sem identificador do Instagram.');
        externalId = await sendInstagramText(decryptJson<IgSecrets>(integration.secretsEnc)!, integration.config as unknown as IgConfig, identity.externalId, body);
        break;
      }
      case 'EMAIL': {
        if (!integration || integration.status !== 'CONNECTED') throw new AppError('Conta de e-mail não conectada. Configure em Integrações.');
        const account = await ctx.db.emailAccount.findFirst({ where: { integrationId: integration.id } });
        if (!account) throw new AppError('Conta de e-mail não configurada.');
        const to = conversation.contact.email;
        if (!to) throw new AppError('Contato sem e-mail.');
        const lastInbound = await ctx.db.message.findFirst({ where: { conversationId, direction: 'INBOUND' }, orderBy: { createdAt: 'desc' } });
        const cfg: EmailAccountConfig = { ...account, password: decryptJson<string>(account.passwordEnc)! };
        const subject = conversation.subject ? (conversation.subject.toLowerCase().startsWith('re:') ? conversation.subject : `Re: ${conversation.subject}`) : 'Contato';
        externalId = await sendEmailMessage(cfg, {
          to,
          subject,
          text: body,
          inReplyTo: lastInbound?.externalId ?? null,
          references: [conversation.externalThreadId, lastInbound?.externalId].filter((v): v is string => !!v),
        });
        if (!conversation.externalThreadId && externalId) await ctx.db.conversation.update({ where: { id: conversationId }, data: { externalThreadId: externalId, subject } });
        break;
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Falha no envio.';
  }

  const updated = await ctx.db.message.update({
    where: { id: message.id },
    data: { status: error ? 'FAILED' : 'SENT', error, externalId: externalId ?? undefined },
  });

  if (error) {
    if (integration) await ctx.db.integration.update({ where: { id: integration.id }, data: { lastError: error, lastErrorAt: new Date() } });
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, actorType: ctx.actorType, action: 'integration.send_failed', entityType: 'Message', entityId: message.id, severity: 'error', metadata: { channel: conversation.channel, error } });
    if (senderType === 'USER') throw new AppError(`Mensagem não enviada: ${error}`);
    return updated;
  }

  const now = new Date();
  await ctx.db.conversation.update({
    where: { id: conversationId },
    data: {
      awaitingReply: false,
      lastMessageAt: now,
      lastOutboundAt: now,
      lastMessagePreview: truncate(updated.body, 120),
      ...(senderType === 'USER' && !conversation.assigneeId ? { assigneeId: ctx.userId } : {}),
    },
  });
  if (conversation.contact.status === 'NEW') await ctx.db.contact.update({ where: { id: conversation.contactId }, data: { status: 'CONTACTED' } });
  await ctx.db.contact.update({ where: { id: conversation.contactId }, data: { lastInteractionAt: now } });
  return updated;
}

/** Inicia conversa ativa (ex.: e-mail para um lead, WhatsApp via template). */
export async function startConversation(ctx: ServiceCtx, contactId: string, channel: Channel, subject?: string | null) {
  assertCan(ctx, 'inbox.use');
  const contact = await assertContactAccessible(ctx, contactId);
  const existing = await ctx.db.conversation.findFirst({ where: { contactId, channel, status: { in: ['OPEN', 'PENDING'] } } });
  if (existing) return existing;
  if (channel === 'WHATSAPP' && contact.whatsapp) {
    await ctx.db.contactIdentity.upsert({
      where: { organizationId_channel_externalId: { organizationId: ctx.orgId, channel, externalId: contact.whatsapp } },
      create: { organizationId: ctx.orgId, contactId, channel, externalId: contact.whatsapp },
      update: {},
    });
  }
  const integration = await resolveIntegration(ctx, channel, null);
  const conv = await ctx.db.conversation.create({
    data: { organizationId: ctx.orgId, contactId, channel, integrationId: integration?.id ?? null, subject: subject ?? null, assigneeId: contact.ownerId ?? ctx.userId },
  });
  await incrementUsage(ctx.orgId, USAGE_METRICS.conversations);
  return conv;
}

// ─────────────── Gestão da conversa ───────────────

export async function assignConversation(ctx: ServiceCtx, conversationId: string, userId: string | null) {
  assertCan(ctx, 'inbox.use');
  if (userId !== ctx.userId) assertCan(ctx, 'inbox.assign');
  if (userId) {
    const m = await ctx.db.membership.findFirst({ where: { userId, status: 'ACTIVE' } });
    if (!m) throw new NotFoundError('Usuário não pertence à empresa.');
  }
  const conv = await getConversation(ctx, conversationId);
  await ctx.db.conversation.update({ where: { id: conversationId }, data: { assigneeId: userId } });
  await addTimeline(ctx, { contactId: conv.contactId, type: 'assigned', title: userId ? 'Conversa atribuída a atendente' : 'Conversa sem responsável', data: { userId, conversationId } });
}

export async function setConversationStatus(ctx: ServiceCtx, conversationId: string, status: ConversationStatus) {
  assertCan(ctx, 'inbox.use');
  const conv = await getConversation(ctx, conversationId);
  await ctx.db.conversation.update({
    where: { id: conversationId },
    data: { status, ...(status === 'RESOLVED' ? { awaitingReply: false, humanRequested: false, aiPaused: false, unreadCount: 0 } : {}) },
  });
  if (status === 'RESOLVED') await addTimeline(ctx, { contactId: conv.contactId, type: 'conversation_resolved', title: `Conversa (${CHANNEL_LABELS[conv.channel]}) resolvida` });
}

export async function setAiPaused(ctx: ServiceCtx, conversationId: string, paused: boolean) {
  assertCan(ctx, 'inbox.use');
  const conv = await getConversation(ctx, conversationId);
  await ctx.db.conversation.update({ where: { id: conversationId }, data: { aiPaused: paused, ...(paused ? {} : { humanRequested: false, aiSessionStartedAt: new Date() }) } });
  await addTimeline(ctx, { contactId: conv.contactId, type: 'ai_action', title: paused ? 'IA pausada nesta conversa (atendimento humano)' : 'IA reativada nesta conversa' });
}

export async function suggestReply(ctx: ServiceCtx, conversationId: string) {
  assertCan(ctx, 'ai.use');
  await getConversation(ctx, conversationId);
  return generateAssistantReply(ctx, conversationId, 'suggest');
}

/** Marca sugestão de IA como aceita (métrica de desempenho do copiloto). */
export async function markSuggestionAccepted(ctx: ServiceCtx, runId: string, accepted: boolean) {
  await ctx.db.aiRun.updateMany({ where: { id: runId }, data: { accepted } });
}

/** Atualização de status de entrega (webhooks de status). */
export async function updateMessageStatusByExternalId(ctx: ServiceCtx, externalId: string, status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED', error?: string | null) {
  const order = { QUEUED: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4, RECEIVED: 0 } as const;
  const msg = await ctx.db.message.findFirst({ where: { externalId } });
  if (!msg) return;
  if (status !== 'FAILED' && order[msg.status] >= order[status]) return;
  await ctx.db.message.update({ where: { id: msg.id }, data: { status, error: error ?? msg.error } });
}
