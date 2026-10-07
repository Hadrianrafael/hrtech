import { z } from 'zod';
import { systemCtx } from '@/lib/auth/ctx';
import { randomToken, hashToken } from '@/lib/crypto';
import { systemDb } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/errors';
import { normalizePhone } from '@/lib/utils';
import { optionalEmail, optionalString } from '@/lib/validation';
import { applyExtractedFields, createContact } from './contacts';
import { receiveInbound } from './conversations';
import { createTask } from './tasks';
import { addTimeline } from './timeline';

/**
 * Serviço público do widget de chat e do formulário de captura.
 * A empresa é identificada pela chave pública do chatbot; o visitante por um token
 * aleatório (apenas o hash é armazenado). O tenant NUNCA vem de parâmetro livre do cliente.
 */

export function originAllowed(allowed: string[], origin: string | null): boolean {
  if (!allowed.length) return true;
  if (!origin) return false;
  try {
    const host = new URL(origin).host.toLowerCase();
    return allowed.some((a) => {
      const pattern = a.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return pattern.startsWith('*.') ? host.endsWith(pattern.slice(1)) : host === pattern;
    });
  } catch {
    return false;
  }
}

export async function getPublicChatbot(publicKey: string, origin: string | null) {
  const chatbot = await systemDb.chatbot.findUnique({ where: { publicKey }, include: { organization: { select: { id: true, name: true, status: true } } } });
  if (!chatbot || chatbot.organization.status !== 'ACTIVE') throw new NotFoundError('Chat indisponível.');
  if (!originAllowed(chatbot.allowedOrigins, origin)) throw new AppError('Origem não autorizada para este chat.', 'FORBIDDEN_ORIGIN', 403);
  return chatbot;
}

export function publicConfig(chatbot: Awaited<ReturnType<typeof getPublicChatbot>>) {
  return {
    name: chatbot.name,
    company: chatbot.organization.name,
    greeting: chatbot.greeting,
    color: chatbot.widgetColor,
    position: chatbot.widgetPosition,
    active: chatbot.channels.includes('WEBCHAT'),
    collectFields: chatbot.collectFields,
  };
}

export const startSchema = z.object({
  name: optionalString(120),
  email: optionalEmail,
  phone: optionalString(40),
  consent: z.boolean().optional(),
  page: optionalString(500),
});

async function serializeMessages(conversationId: string, orgId: string, after?: string | null) {
  const ctx = systemCtx(orgId);
  const afterMsg = after ? await ctx.db.message.findFirst({ where: { id: after, conversationId } }) : null;
  // Com "after": as próximas mensagens em ordem. Sem "after": as 100 mais recentes (não trava em conversas longas).
  const found = await ctx.db.message.findMany({
    where: { conversationId, ...(afterMsg ? { createdAt: { gt: afterMsg.createdAt } } : {}), status: { not: 'FAILED' } },
    orderBy: { createdAt: afterMsg ? 'asc' : 'desc' },
    take: 100,
  });
  const messages = afterMsg ? found : found.reverse();
  return messages.map((m) => ({
    id: m.id,
    from: m.direction === 'INBOUND' ? 'visitor' : m.senderType === 'AI' ? 'bot' : 'agent',
    text: m.body,
    at: m.createdAt,
    // id do eco local enviado pelo widget: permite reconhecer a própria mensagem em qualquer resposta (sem duplicar)
    clientId: m.direction === 'INBOUND' ? ((m.metadata as { clientId?: string } | null)?.clientId ?? null) : null,
  }));
}

export async function startVisitorSession(publicKey: string, origin: string | null, input: z.input<typeof startSchema>) {
  const chatbot = await getPublicChatbot(publicKey, origin);
  if (!chatbot.channels.includes('WEBCHAT')) throw new AppError('Chat do site desativado.');
  const data = startSchema.parse(input);
  const ctx = systemCtx(chatbot.organizationId, 'CONTACT');
  const visitorId = `v_${randomToken(12)}`;
  const contact = await createContact(
    ctx,
    {
      name: data.name || 'Visitante',
      email: data.email,
      phone: data.phone,
      whatsapp: normalizePhone(data.phone),
      source: 'webchat',
      sourceDetail: data.page ?? origin ?? null,
      consent: data.consent ? 'on' : undefined,
    },
    { eventKey: `lead:webchat:${visitorId}`, inbound: true },
  );
  await ctx.db.contactIdentity.create({ data: { organizationId: ctx.orgId, contactId: contact.id, channel: 'WEBCHAT', externalId: visitorId } });
  const token = randomToken(32);
  const webchat = await ctx.db.integration.findFirst({ where: { type: 'WEBCHAT' } });
  const conversation = await ctx.db.conversation.create({
    data: { organizationId: ctx.orgId, contactId: contact.id, channel: 'WEBCHAT', integrationId: webchat?.id ?? null, visitorTokenHash: hashToken(token), assigneeId: contact.ownerId },
  });
  if (chatbot.greeting) {
    await ctx.db.message.create({
      data: { organizationId: ctx.orgId, conversationId: conversation.id, direction: 'OUTBOUND', senderType: 'AI', body: chatbot.greeting, status: 'SENT', metadata: { greeting: true } },
    });
  }
  return { token, conversationId: conversation.id, messages: await serializeMessages(conversation.id, ctx.orgId) };
}

async function visitorConversation(publicKey: string, origin: string | null, token: string) {
  const chatbot = await getPublicChatbot(publicKey, origin);
  const conversation = await systemDb.conversation.findUnique({ where: { visitorTokenHash: hashToken(token) } });
  if (!conversation || conversation.organizationId !== chatbot.organizationId) throw new NotFoundError('Sessão de chat não encontrada.');
  return { chatbot, conversation };
}

export async function postVisitorMessage(publicKey: string, origin: string | null, token: string, text: string, after?: string | null, clientId?: string | null) {
  const body = text.trim().slice(0, 2000);
  if (!body) throw new AppError('Mensagem vazia.');
  const { conversation } = await visitorConversation(publicKey, origin, token);
  const ctx = systemCtx(conversation.organizationId, 'CONTACT');
  const r = await receiveInbound(ctx, {
    channel: 'WEBCHAT',
    conversationId: conversation.id,
    identityExternalId: conversation.contactId,
    contactDefaults: {},
    body,
    metadata: clientId && /^[\w-]{1,64}$/.test(clientId) ? { clientId } : undefined,
  });
  // sentId permite ao widget substituir o "eco" local pela mensagem real (sem duplicar).
  return { sentId: r.message?.id ?? null, messages: await serializeMessages(conversation.id, conversation.organizationId, after) };
}

export async function getVisitorMessages(publicKey: string, origin: string | null, token: string, after?: string | null) {
  const { conversation } = await visitorConversation(publicKey, origin, token);
  return { messages: await serializeMessages(conversation.id, conversation.organizationId, after), humanRequested: conversation.humanRequested };
}

export async function requestHumanFromWidget(publicKey: string, origin: string | null, token: string) {
  const { conversation } = await visitorConversation(publicKey, origin, token);
  const ctx = systemCtx(conversation.organizationId, 'CONTACT');
  const { requestHuman } = await import('./conversations');
  await requestHuman(ctx, conversation.id, 'Visitante clicou em "Falar com atendente"');
  await ctx.db.message.create({
    data: { organizationId: ctx.orgId, conversationId: conversation.id, direction: 'OUTBOUND', senderType: 'SYSTEM', body: 'Um atendente foi notificado e responderá em instantes.', status: 'SENT' },
  });
  return { messages: await serializeMessages(conversation.id, conversation.organizationId) };
}

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.').max(120),
  email: optionalEmail,
  phone: optionalString(40),
  message: optionalString(2000),
  interest: optionalString(200),
  service: optionalString(200),
  budget: optionalString(60),
  desiredDate: optionalString(40),
  checkIn: optionalString(40),
  checkOut: optionalString(40),
  guests: optionalString(10),
  roomType: optionalString(80),
  wantsAppointment: z.boolean().optional(),
  consent: z.boolean().optional(),
  page: optionalString(500),
  website: z.string().max(0).optional(), // honeypot anti-spam
});

/** Formulário de captura (site do cliente → CRM). Opcionalmente gera solicitação de agendamento. */
export async function submitLeadForm(publicKey: string, origin: string | null, input: z.input<typeof leadFormSchema>) {
  const chatbot = await getPublicChatbot(publicKey, origin);
  const data = leadFormSchema.parse(input);
  if (!data.email && !data.phone) throw new AppError('Informe e-mail ou telefone para contato.');
  const ctx = systemCtx(chatbot.organizationId, 'CONTACT');
  const contact = await createContact(ctx, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    whatsapp: data.phone,
    source: 'form',
    sourceDetail: data.page ?? origin ?? null,
    interest: data.interest ?? data.service,
    notes: data.message,
    consent: data.consent ? 'on' : undefined,
  }, { inbound: true });
  await applyExtractedFields(ctx, contact.id, {
    budget: data.budget,
    desiredDate: data.desiredDate,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guests: data.guests,
    roomType: data.roomType,
    service: data.service,
  });
  if (data.message) await addTimeline(ctx, { contactId: contact.id, type: 'form_submitted', actorType: 'CONTACT', title: 'Formulário enviado pelo site', data: { message: data.message } });
  if (data.wantsAppointment) {
    await createTask(ctx, {
      title: `Agendar atendimento solicitado pelo site: ${contact.name}`,
      type: 'FOLLOW_UP',
      priority: 'HIGH',
      dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      contactId: contact.id,
      description: data.desiredDate ? `Data desejada: ${data.desiredDate}` : null,
    }, { source: 'SYSTEM' });
  }
  return { ok: true };
}
