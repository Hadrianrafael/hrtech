'use server';

import type { Channel, ConversationStatus } from '@prisma/client';
import { withOrg } from '@/lib/action-ctx';
import { summarizeConversation } from '@/server/ai/agent';
import {
  assignConversation, getConversation, listConversations, markConversationRead, markSuggestionAccepted, sendMessage, setAiPaused,
  setConversationStatus, startConversation, suggestReply, type ConversationFilters,
} from '@/server/conversations';
import { syncEmailAccount } from '@/server/integrations';

export async function listConversationsAction(filters: ConversationFilters) {
  return withOrg('inbox.use', async (ctx) => {
    const items = await listConversations(ctx, filters);
    return items.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      contactName: c.contact.name,
      preview: c.lastMessagePreview,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      assigneeId: c.assigneeId,
      unread: c.unreadCount,
      awaitingReply: c.awaitingReply,
      humanRequested: c.humanRequested,
      tags: c.tags.map((t) => ({ name: t.tag.name, color: t.tag.color })),
    }));
  });
}

export async function getConversationAction(id: string) {
  return withOrg('inbox.use', async (ctx) => {
    const c = await getConversation(ctx, id);
    if (c.unreadCount) await markConversationRead(ctx, id);
    return {
      id: c.id,
      channel: c.channel,
      status: c.status,
      subject: c.subject,
      assigneeId: c.assigneeId,
      aiPaused: c.aiPaused,
      humanRequested: c.humanRequested,
      summary: c.summary,
      intent: c.intent,
      lastInboundAt: c.lastInboundAt?.toISOString() ?? null,
      integration: c.integration,
      contact: {
        id: c.contact.id,
        name: c.contact.name,
        email: c.contact.email,
        phone: c.contact.phone,
        whatsapp: c.contact.whatsapp,
        instagram: c.contact.instagram,
        city: c.contact.city,
        status: c.contact.status,
        source: c.contact.source,
        ownerId: c.contact.ownerId,
        interest: c.contact.interest,
        potentialValue: c.contact.potentialValue ? Number(c.contact.potentialValue) : null,
        customFields: c.contact.customFields as Record<string, string>,
        tags: c.contact.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
        opportunities: c.contact.opportunities.map((o) => ({ id: o.id, title: o.title, stageId: o.stageId, stageName: o.stage.name, pipelineId: o.pipelineId })),
      },
      messages: c.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        senderType: m.senderType,
        senderUserId: m.senderUserId,
        body: m.body,
        contentType: m.contentType,
        mediaIndexes: mediaIndexes(m.media),
        status: m.status,
        error: m.error,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });
}

/** Índices dos anexos que o proxy /api/app/media consegue abrir (WhatsApp: a mídia do id; Instagram: os que têm URL). */
function mediaIndexes(media: unknown): number[] {
  const m = media as { id?: string; attachments?: { url?: string }[] } | null;
  if (!m) return [];
  if (m.id) return [0];
  return Array.isArray(m.attachments) ? m.attachments.flatMap((a, i) => (a?.url ? [i] : [])) : [];
}

export async function sendMessageAction(conversationId: string, body: string, aiRunId?: string | null) {
  return withOrg('inbox.use', async (ctx) => {
    await sendMessage(ctx, conversationId, { body, senderType: 'USER', metadata: aiRunId ? { aiRunId, fromSuggestion: true } : {} });
    if (aiRunId) await markSuggestionAccepted(ctx, aiRunId, true);
  });
}

export async function sendTemplateAction(conversationId: string, templateName: string, language: string, params: string[]) {
  return withOrg('inbox.use', async (ctx) => {
    await sendMessage(ctx, conversationId, { body: params.join(' | '), senderType: 'USER', template: { name: templateName, language, params } });
  }, 'Template enviado.');
}

export async function assignConversationAction(conversationId: string, userId: string | null) {
  return withOrg('inbox.use', (ctx) => assignConversation(ctx, conversationId, userId), 'Responsável atualizado.');
}

export async function setConversationStatusAction(conversationId: string, status: ConversationStatus) {
  return withOrg('inbox.use', (ctx) => setConversationStatus(ctx, conversationId, status), status === 'RESOLVED' ? 'Conversa resolvida.' : 'Status atualizado.');
}

export async function setAiPausedAction(conversationId: string, paused: boolean) {
  return withOrg('inbox.use', (ctx) => setAiPaused(ctx, conversationId, paused), paused ? 'IA pausada nesta conversa.' : 'IA reativada nesta conversa.');
}

export async function suggestReplyAction(conversationId: string) {
  return withOrg('ai.use', async (ctx) => {
    const r = await suggestReply(ctx, conversationId);
    return { reply: r.reply, intent: r.intent, runId: r.runId, sources: r.sources };
  });
}

export async function rejectSuggestionAction(runId: string) {
  return withOrg('ai.use', (ctx) => markSuggestionAccepted(ctx, runId, false));
}

export async function summarizeConversationAction(conversationId: string) {
  return withOrg('ai.use', (ctx) => summarizeConversation(ctx, conversationId));
}

export async function startConversationAction(contactId: string, channel: Channel, subject?: string) {
  return withOrg('inbox.use', async (ctx) => ({ id: (await startConversation(ctx, contactId, channel, subject)).id }));
}

export async function syncEmailAction(integrationId: string) {
  return withOrg('integrations.manage', (ctx) => syncEmailAccount(ctx, integrationId), 'Sincronização concluída.');
}
