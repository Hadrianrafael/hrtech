'use server';

import type { AiMode, Channel, Prisma } from '@prisma/client';
import { z } from 'zod';
import { withOrg, withOrgSchema } from '@/lib/action-ctx';
import { audit } from '@/lib/audit';
import { testAssistant } from '@/server/ai/agent';
import { deleteKnowledgeDocument, reindexAll, retrieve, saveKnowledgeDocument } from '@/server/ai/rag';
import { deleteAutomation, saveAutomation, toggleAutomation, type AutomationInput } from '@/server/automations/service';

const docSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório.').max(200),
  category: z.string().trim().max(80).optional().nullable(),
  content: z.string().trim().min(10, 'Conteúdo muito curto.').max(100_000, 'Documento muito grande (máx. 100 mil caracteres).'),
  sourceType: z.enum(['text', 'faq', 'file']).default('text'),
});

export async function saveKnowledgeAction(id: string | null, form: FormData) {
  return withOrgSchema('knowledge.manage', docSchema, form, async (ctx, d) => {
    const r = await saveKnowledgeDocument(ctx, id, d);
    return { chunks: r.chunks, embedded: r.embedded };
  });
}

export async function deleteKnowledgeAction(id: string) {
  return withOrg('knowledge.manage', (ctx) => deleteKnowledgeDocument(ctx, id), 'Documento removido.');
}

export async function reindexKnowledgeAction() {
  return withOrg('knowledge.manage', (ctx) => reindexAll(ctx));
}

export async function searchKnowledgeAction(query: string) {
  return withOrg('knowledge.manage', async (ctx) => (await retrieve(ctx, query, 5)).map((r) => ({ title: r.title, content: r.content, score: Math.round(r.score * 100) / 100 })));
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const chatbotSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório.').max(60),
  enabled: z.boolean(),
  mode: z.enum(['OFF', 'COPILOT', 'AUTO']),
  greeting: z.string().trim().max(500),
  tone: z.string().trim().max(200),
  instructions: z.string().max(8000),
  collectFields: z.array(z.string().max(40)).max(20),
  channels: z.array(z.enum(['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'WEBCHAT'])),
  handoffKeywords: z.string().max(1000),
  maxAiTurns: z.coerce.number().int().min(0).max(100),
  handoffMessage: z.string().max(500),
  hoursEnabled: z.boolean(),
  timezone: z.string().max(60),
  days: z.record(z.enum(DAYS), z.tuple([z.string().regex(/^\d{2}:\d{2}$/), z.string().regex(/^\d{2}:\d{2}$/)]).nullable()),
  outOfHoursMessage: z.string().max(500),
  faq: z.array(z.object({ q: z.string().max(300), a: z.string().max(2000) })).max(100),
  allowedOrigins: z.array(z.string().trim().max(200)).max(20),
  widgetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  widgetPosition: z.enum(['left', 'right']),
});

export type ChatbotForm = z.input<typeof chatbotSchema>;

export async function saveChatbotAction(input: ChatbotForm) {
  return withOrgSchema('chatbot.manage', chatbotSchema, input, async (ctx, d) => {
    const bot = await ctx.db.chatbot.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!bot) throw new Error('Chatbot não encontrado.');
    await ctx.db.chatbot.update({
      where: { id: bot.id },
      data: {
        name: d.name,
        enabled: d.enabled,
        mode: d.mode as AiMode,
        greeting: d.greeting,
        tone: d.tone,
        instructions: d.instructions,
        collectFields: d.collectFields,
        channels: d.channels as Channel[],
        handoffRules: { keywords: d.handoffKeywords.split(',').map((k) => k.trim()).filter(Boolean), maxAiTurns: d.maxAiTurns || null, message: d.handoffMessage || null },
        businessHours: { enabled: d.hoursEnabled, timezone: d.timezone, days: Object.fromEntries(Object.entries(d.days).filter(([, v]) => v)), outOfHoursMessage: d.outOfHoursMessage } as Prisma.InputJsonValue,
        faq: d.faq.filter((f) => f.q.trim() && f.a.trim()),
        allowedOrigins: d.allowedOrigins.filter(Boolean),
        widgetColor: d.widgetColor,
        widgetPosition: d.widgetPosition,
      },
    });
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'chatbot.updated', entityType: 'Chatbot', entityId: bot.id, metadata: { enabled: d.enabled, mode: d.mode } });
  }, 'Configurações do assistente salvas.');
}

export async function testChatbotAction(messages: { role: 'user' | 'assistant'; content: string }[]) {
  return withOrg('chatbot.manage', (ctx) => testAssistant(ctx, messages));
}

export async function saveAutomationAction(id: string | null, input: AutomationInput) {
  return withOrg('automations.manage', async (ctx) => ({ id: (await saveAutomation(ctx, id, input)).id }), 'Automação salva.');
}

export async function toggleAutomationAction(id: string, enabled: boolean) {
  return withOrg('automations.manage', async (ctx) => {
    await toggleAutomation(ctx, id, enabled);
  }, enabled ? 'Automação ativada.' : 'Automação desativada.');
}

export async function deleteAutomationAction(id: string) {
  return withOrg('automations.manage', (ctx) => deleteAutomation(ctx, id), 'Automação excluída.');
}
