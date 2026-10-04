import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { systemCtx } from '@/lib/auth/ctx';
import { encryptJson } from '@/lib/crypto';
import { systemDb, tenantDb } from '@/lib/db';
import { setAiProviderForTests, type AiProvider } from '@/server/ai/provider';
import { runAutomations } from '@/server/automations/engine';
import { sendMessage } from '@/server/conversations';
import { getPublicChatbot, postVisitorMessage, startVisitorSession, submitLeadForm } from '@/server/webchat';
import { processWhatsAppWebhook } from '@/server/webhooks';
import { createOrg, createUser, dbReachable, resetDb } from '../helpers';
import { waPayload } from '../unit/channels.test';

const ok = await dbReachable();

const mockAi: AiProvider = {
  name: 'mock',
  model: 'mock-1',
  async chat(messages) {
    const last = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    return {
      text: JSON.stringify({ reply: 'A diária custa R$ 300. Para quais datas?', intent: last.includes('reservar') ? 'booking' : 'pricing', handoff: false, extracted: { email: 'visitante@site.example', checkIn: '2026-12-10' } }),
      tokensIn: 100,
      tokensOut: 20,
      model: 'mock-1',
    };
  },
};

describe.skipIf(!ok)('canais: webhooks, widget, IA e automações', () => {
  let orgId: string, publicKey: string;
  beforeAll(async () => {
    await resetDb();
    orgId = (await createOrg('Canal Org')).id;
    await createUser('admin@canal.example', orgId);
    await tenantDb(orgId).integration.create({
      data: { organizationId: orgId, type: 'WHATSAPP', name: 'WA', status: 'CONNECTED', externalId: '1234567890', config: { phoneNumberId: '1234567890' }, secretsEnc: encryptJson({ accessToken: 'x' }) },
    });
    publicKey = (await tenantDb(orgId).chatbot.findFirstOrThrow({})).publicKey;
  });
  afterAll(() => setAiProviderForTests(undefined));

  it('mensagem do WhatsApp cria contato, conversa e mensagem; reentrega é ignorada', async () => {
    expect(await processWhatsAppWebhook(waPayload({ id: 'wamid.A1' }))).toEqual(['processed']);
    expect(await processWhatsAppWebhook(waPayload({ id: 'wamid.A1' }))).toEqual([]); // idempotente
    const db = tenantDb(orgId);
    const contact = await db.contact.findFirstOrThrow({ where: { whatsapp: '5511988887777' } });
    expect(contact).toMatchObject({ name: 'Cliente Teste', source: 'whatsapp', status: 'IN_CONVERSATION' });
    const conv = await db.conversation.findFirstOrThrow({ where: { contactId: contact.id } });
    expect(conv).toMatchObject({ channel: 'WHATSAPP', awaitingReply: true, unreadCount: 1 });
    expect(await db.message.count({ where: { conversationId: conv.id } })).toBe(1);
    // segunda mensagem do mesmo número usa a mesma conversa
    await processWhatsAppWebhook(waPayload({ id: 'wamid.A2', text: 'Alô?' }));
    expect(await db.message.count({ where: { conversationId: conv.id } })).toBe(2);
    expect(await db.conversation.count({ where: { contactId: contact.id } })).toBe(1);
  });

  it('número não vinculado é ignorado sem criar dados', async () => {
    expect(await processWhatsAppWebhook(waPayload({ id: 'wamid.Z', phoneNumberId: '999' }))).toEqual(['ignored']);
    const ev = await systemDb.webhookEvent.findFirstOrThrow({ where: { eventKey: 'msg:wamid.Z' } });
    expect(ev.status).toBe('IGNORED');
  });

  it('empresa bloqueada não recebe mensagens', async () => {
    await systemDb.organization.update({ where: { id: orgId }, data: { status: 'SUSPENDED' } });
    expect(await processWhatsAppWebhook(waPayload({ id: 'wamid.S1' }))).toEqual(['ignored']);
    await systemDb.organization.update({ where: { id: orgId }, data: { status: 'ACTIVE' } });
  });

  it('envio fora da janela de 24h do WhatsApp é bloqueado com mensagem clara', async () => {
    const db = tenantDb(orgId);
    const conv = await db.conversation.findFirstOrThrow({ where: { channel: 'WHATSAPP' } });
    await db.conversation.update({ where: { id: conv.id }, data: { lastInboundAt: new Date(Date.now() - 25 * 3600000) } });
    const admin = await systemDb.user.findUniqueOrThrow({ where: { email: 'admin@canal.example' } });
    const ctx = { ...systemCtx(orgId), userId: admin.id, actorType: 'USER' as const };
    await expect(sendMessage(ctx, conv.id, { body: 'Oi' })).rejects.toThrow('24h');
  });

  it('widget: visitante inicia sessão, vira lead e fala com a IA em modo automático', async () => {
    setAiProviderForTests(mockAi);
    await tenantDb(orgId).chatbot.updateMany({ data: { enabled: true, mode: 'AUTO' } });
    const session = await startVisitorSession(publicKey, null, { name: 'Visitante Site', phone: '21999990000', consent: true });
    expect(session.messages[0]?.from).toBe('bot'); // saudação
    const r = await postVisitorMessage(publicKey, null, session.token, 'Quanto custa? Quero reservar');
    expect(r.messages.some((m) => m.from === 'bot' && m.text.includes('R$ 300'))).toBe(true);
    const db = tenantDb(orgId);
    const contact = await db.contact.findFirstOrThrow({ where: { name: 'Visitante Site' } });
    expect(contact.source).toBe('webchat');
    expect(contact.consentAt).not.toBeNull();
    expect(contact.email).toBe('visitante@site.example'); // qualificação pela IA
    expect((contact.customFields as Record<string, string>).checkIn).toBe('2026-12-10');
    const tags = await db.contactTag.findMany({ where: { contactId: contact.id }, include: { tag: true } });
    expect(tags.map((t) => t.tag.name)).toContain('Interessado'); // automação por intenção
    expect(await db.aiRun.count({ where: { kind: 'auto_reply' } })).toBeGreaterThan(0);
  });

  it('widget: pedido de humano pausa a IA', async () => {
    const session = await startVisitorSession(publicKey, null, { name: 'Quer Humano' });
    await postVisitorMessage(publicKey, null, session.token, 'quero falar com um atendente');
    const conv = await tenantDb(orgId).conversation.findFirstOrThrow({ where: { contact: { name: 'Quer Humano' } } });
    expect(conv).toMatchObject({ humanRequested: true, aiPaused: true });
  });

  it('widget: token inválido e origem não autorizada são rejeitados', async () => {
    await expect(postVisitorMessage(publicKey, null, 'token-falso', 'oi')).rejects.toThrow();
    await tenantDb(orgId).chatbot.updateMany({ data: { allowedOrigins: ['www.cliente.example'] } });
    await expect(getPublicChatbot(publicKey, 'https://evil.example')).rejects.toThrow('Origem');
    expect((await getPublicChatbot(publicKey, 'https://www.cliente.example')).organizationId).toBe(orgId);
    await tenantDb(orgId).chatbot.updateMany({ data: { allowedOrigins: [] } });
  });

  it('formulário do site cria lead e solicitação de agendamento', async () => {
    await submitLeadForm(publicKey, null, { name: 'Lead Form', email: 'form@site.example', checkIn: '2026-11-01', guests: '2', wantsAppointment: true, consent: true });
    const db = tenantDb(orgId);
    const c = await db.contact.findFirstOrThrow({ where: { email: 'form@site.example' } });
    expect(c.source).toBe('form');
    expect((c.customFields as Record<string, string>).guests).toBe('2');
    expect(await db.task.count({ where: { contactId: c.id, type: 'FOLLOW_UP' } })).toBeGreaterThan(0);
    await expect(submitLeadForm(publicKey, null, { name: 'Sem contato' })).rejects.toThrow('e-mail ou telefone');
  });

  it('automações são idempotentes por evento e registram execuções', async () => {
    const ctx = systemCtx(orgId);
    const contact = await ctx.db.contact.findFirstOrThrow({ where: { email: 'form@site.example' } });
    const before = await ctx.db.task.count();
    const first = await runAutomations(ctx, 'lead.created', { contactId: contact.id }, { eventKey: 'teste-idem' });
    const second = await runAutomations(ctx, 'lead.created', { contactId: contact.id }, { eventKey: 'teste-idem' });
    expect(first.length).toBeGreaterThan(0);
    expect(second).toHaveLength(0);
    expect(await ctx.db.task.count()).toBe(before + 1);
  });

  it('falha de ação fica registrada como FAILED (sem falha silenciosa)', async () => {
    const ctx = systemCtx(orgId);
    await ctx.db.automation.create({
      data: { organizationId: orgId, name: 'Quebrada', trigger: 'appointment.created', conditions: [], actions: [{ type: 'move_stage', params: { stageKey: 'inexistente' } }] },
    });
    const contact = await ctx.db.contact.findFirstOrThrow({ where: { email: 'form@site.example' } });
    await runAutomations(ctx, 'appointment.created', { contactId: contact.id }, { eventKey: 'falha-1' });
    const run = await ctx.db.automationRun.findFirstOrThrow({ where: { eventKey: 'falha-1' } });
    expect(run.status).toBe('PARTIAL');
    expect(run.error).toContain('Etapa não encontrada');
  });
});
