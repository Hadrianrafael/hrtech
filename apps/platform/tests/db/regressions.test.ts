/**
 * Regressões (com banco) dos problemas encontrados na revisão anterior ao merge.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { encryptJson } from '@/lib/crypto';
import { systemDb, tenantDb } from '@/lib/db';
import { getAnalytics, getDashboard } from '@/server/analytics';
import { runAutomations } from '@/server/automations/engine';
import { applyBillingEvent } from '@/server/billing/subscriptions';
import { createContact } from '@/server/contacts';
import { runTick } from '@/server/cron';
import { BOARD_PER_STAGE, createOpportunity, createPipeline, deleteStage, getBoard, updateStage } from '@/server/pipeline';
import { getVisitorMessages, postVisitorMessage, startVisitorSession } from '@/server/webchat';
import { processWhatsAppWebhook } from '@/server/webhooks';
import { createOrg, createUser, ctxFor, dbReachable, resetDb } from '../helpers';
import { waPayload } from '../unit/channels.test';

const ok = await dbReachable();

describe.skipIf(!ok)('regressões da revisão', () => {
  let orgId: string, adminId: string, agentId: string;
  beforeAll(async () => {
    await resetDb();
    orgId = (await createOrg('Regressão Org')).id;
    adminId = (await createUser('admin@regressao.example', orgId)).id;
    agentId = (await createUser('agente@regressao.example', orgId, 'agent')).id;
    const db = tenantDb(orgId);
    await db.integration.create({
      data: { organizationId: orgId, type: 'WHATSAPP', name: 'WA', status: 'CONNECTED', externalId: 'PN1', config: { phoneNumberId: 'PN1' }, secretsEnc: encryptJson({ accessToken: 'x' }) },
    });
  });

  it('mensagens simultâneas de um número novo geram um único contato e uma única conversa', async () => {
    const from = '5511977776666';
    await Promise.all([1, 2, 3, 4].map((i) => processWhatsAppWebhook(waPayload({ id: `wamid.C${i}`, phoneNumberId: 'PN1', from }))));
    const db = tenantDb(orgId);
    expect(await db.contact.count({ where: { whatsapp: from } })).toBe(1);
    expect(await db.conversation.count({ where: { contact: { whatsapp: from } } })).toBe(1);
    expect(await db.message.count({ where: { conversation: { contact: { whatsapp: from } } } })).toBe(4);
  });

  it('wa_id sem o 9º dígito encontra o lead cadastrado pelo formulário', async () => {
    const ctx = ctxFor(orgId, adminId);
    const lead = await createContact(ctx, { name: 'Lead do Site', phone: '(11) 98888-1111', source: 'form' });
    await processWhatsAppWebhook(waPayload({ id: 'wamid.N9', phoneNumberId: 'PN1', from: '551188881111' }));
    const identity = await tenantDb(orgId).contactIdentity.findFirstOrThrow({ where: { channel: 'WHATSAPP', externalId: '551188881111' } });
    expect(identity.contactId).toBe(lead.id);
  });

  it('número de outro país (wa_id de 11 dígitos) não ganha DDI do Brasil', async () => {
    await processWhatsAppWebhook(waPayload({ id: 'wamid.US1', phoneNumberId: 'PN1', from: '14155552671' }));
    const identity = await tenantDb(orgId).contactIdentity.findFirstOrThrow({ where: { externalId: '14155552671' }, include: { contact: true } });
    expect(identity.contact.whatsapp).toBe('14155552671');
  });

  it('integração ainda não verificada não recebe mensagens do número', async () => {
    const other = (await createOrg('Outra Org')).id;
    await tenantDb(other).integration.create({
      data: { organizationId: other, type: 'WHATSAPP', name: 'WA pendente', status: 'PENDING', externalId: 'PN2', config: { phoneNumberId: 'PN2' }, secretsEnc: encryptJson({ accessToken: 'x' }) },
    });
    expect(await processWhatsAppWebhook(waPayload({ id: 'wamid.P1', phoneNumberId: 'PN2' }))).toEqual(['ignored']);
    expect(await tenantDb(other).contact.count()).toBe(0);
  });

  it('widget: devolve o id da mensagem enviada e carrega as mensagens mais recentes', async () => {
    const db = tenantDb(orgId);
    const { publicKey } = await db.chatbot.findFirstOrThrow({});
    await db.chatbot.updateMany({ data: { enabled: false } }); // sem IA: o caso que duplicava mensagens
    const session = await startVisitorSession(publicKey, null, { name: 'Visitante Longo', phone: '21999991234', consent: true });
    const sent = await postVisitorMessage(publicKey, null, session.token, 'primeira');
    expect(sent.sentId).toBeTruthy();
    expect(sent.messages.find((m) => m.id === sent.sentId)?.text).toBe('primeira');
    // conversa longa: sem "after", o widget recebe as 100 últimas (não as 100 primeiras)
    const conv = await db.conversation.findFirstOrThrow({ where: { contact: { name: 'Visitante Longo' } } });
    const base = Date.now() - 3600_000;
    await db.message.createMany({
      data: Array.from({ length: 130 }, (_, i) => ({
        organizationId: orgId,
        conversationId: conv.id,
        direction: 'OUTBOUND' as const,
        senderType: 'USER' as const,
        body: `msg ${i}`,
        status: 'SENT' as const,
        createdAt: new Date(base + i * 1000),
      })),
    });
    const last = await postVisitorMessage(publicKey, null, session.token, 'última');
    const all = await getVisitorMessages(publicKey, null, session.token);
    expect(all.messages).toHaveLength(100);
    expect(all.messages.at(-1)?.id).toBe(last.sentId);
    const after = await getVisitorMessages(publicKey, null, session.token, all.messages.at(-2)!.id);
    expect(after.messages.map((m) => m.id)).toEqual([last.sentId]);
    // Uma consulta que chega antes da resposta do envio reconhece a mensagem pelo id do eco local (sem duplicar).
    const echo = await postVisitorMessage(publicKey, null, session.token, 'com eco', after.messages.at(-1)!.id, 'local-123-abc');
    const polled = await getVisitorMessages(publicKey, null, session.token, last.sentId);
    expect(polled.messages.find((m) => m.id === echo.sentId)?.clientId).toBe('local-123-abc');
  });

  describe('funil', () => {
    let pipelineId: string, stages: { id: string; key: string | null }[], contactId: string;
    beforeAll(async () => {
      const ctx = ctxFor(orgId, adminId);
      pipelineId = (await createPipeline(ctx, 'Grupos')).id;
      stages = await tenantDb(orgId).pipelineStage.findMany({ where: { pipelineId }, orderBy: { position: 'asc' } });
      contactId = (await createContact(ctx, { name: 'Cliente Grupos', email: 'grupos@regressao.example', source: 'manual' })).id;
    });

    it('oportunidade criada a partir de uma etapa vai para o funil dessa etapa', async () => {
      const ctx = ctxFor(orgId, adminId);
      const opp = await createOpportunity(ctx, { contactId, title: 'Grupo 20 pessoas', stageId: stages[1]!.id });
      expect(opp).toMatchObject({ pipelineId, stageId: stages[1]!.id });
      const def = await tenantDb(orgId).pipeline.findFirstOrThrow({ where: { isDefault: true } });
      await expect(createOpportunity(ctx, { contactId, title: 'X', stageId: stages[1]!.id, pipelineId: def.id })).rejects.toThrow('não pertence');
    });

    it('quadro com muitas oportunidades: limite por etapa e totais reais', async () => {
      const first = stages[0]!.id;
      await tenantDb(orgId).opportunity.createMany({
        data: Array.from({ length: BOARD_PER_STAGE + 10 }, (_, i) => ({ organizationId: orgId, pipelineId, stageId: first, contactId, title: `Opp ${i}`, value: 100, position: i })),
      });
      const board = await getBoard(ctxFor(orgId, adminId), pipelineId);
      const shown = board.opportunities.filter((o) => o.stageId === first);
      expect(shown).toHaveLength(BOARD_PER_STAGE);
      // os mais recentes (maior position) aparecem; os 10 mais antigos ficam de fora
      expect(shown.some((o) => o.title === `Opp ${BOARD_PER_STAGE + 9}`)).toBe(true);
      expect(shown.some((o) => o.title === 'Opp 0')).toBe(false);
      expect(board.totals[first]).toEqual({ count: BOARD_PER_STAGE + 10, value: (BOARD_PER_STAGE + 10) * 100 });
      expect(board.opportunities.some((o) => o.stageId === stages[1]!.id)).toBe(true); // outras etapas continuam aparecendo
    });

    it('mudar o tipo da etapa ou excluí-la mantém o status das oportunidades coerente', async () => {
      const ctx = ctxFor(orgId, adminId);
      const db = tenantDb(orgId);
      const mid = stages[1]!.id;
      await updateStage(ctx, mid, { name: 'Fechado', kind: 'WON' });
      expect(await db.opportunity.findMany({ where: { stageId: mid } })).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'WON', closedAt: expect.any(Date) })]));
      await updateStage(ctx, mid, { name: 'Em andamento', kind: 'OPEN' });
      expect(await db.opportunity.count({ where: { stageId: mid, OR: [{ status: { not: 'OPEN' } }, { closedAt: { not: null } }] } })).toBe(0);
      // Trocar uma etapa de perdido para ganho não reescreve a data de fechamento original
      const lost = stages.find((s) => s.key === 'lost')!.id;
      const oldClose = new Date('2024-03-01T12:00:00Z');
      const closed = await db.opportunity.create({ data: { organizationId: orgId, pipelineId, stageId: lost, contactId, title: 'Antiga', status: 'LOST', closedAt: oldClose, position: 1 } });
      await updateStage(ctx, lost, { name: 'Perdido', kind: 'WON' });
      expect(await db.opportunity.findUniqueOrThrow({ where: { id: closed.id } })).toMatchObject({ status: 'WON', closedAt: oldClose });
      await updateStage(ctx, lost, { name: 'Perdido', kind: 'LOST' });
      await db.opportunity.delete({ where: { id: closed.id } });
      await deleteStage(ctx, stages[0]!.id, lost);
      expect(await db.opportunity.count({ where: { stageId: lost, status: 'LOST' } })).toBe(BOARD_PER_STAGE + 10);
    });
  });

  it('automação roda com contexto de sistema mesmo quando o evento vem de um atendente', async () => {
    const db = tenantDb(orgId);
    const contact = await createContact(ctxFor(orgId, adminId), { name: 'Do Admin', email: 'doadmin@regressao.example', source: 'manual', ownerId: adminId });
    const automation = await db.automation.create({
      data: { organizationId: orgId, name: 'Pediu humano', trigger: 'human.requested', conditions: [], actions: [{ type: 'create_task', params: { title: 'Retornar contato', assignee: 'none' } }] },
    });
    // O atendente não enxerga o contato do administrador, mas a automação da empresa precisa rodar mesmo assim.
    const runs = await runAutomations(ctxFor(orgId, agentId, 'agent'), 'human.requested', { contactId: contact.id }, { eventKey: 'humano-1' });
    expect(runs).toContainEqual({ automationId: automation.id, status: 'SUCCESS' });
    expect(await db.task.count({ where: { contactId: contact.id, title: 'Retornar contato' } })).toBe(1);
  });

  it('cron percorre todas as tarefas vencidas na janela (não só as 200 primeiras) e não repete', async () => {
    const db = tenantDb(orgId);
    const automation = await db.automation.create({
      data: { organizationId: orgId, name: 'Atrasou', trigger: 'task.overdue', conditions: [], actions: [{ type: 'add_note', params: { body: 'Tarefa atrasada' } }] },
    });
    const now = new Date();
    await db.task.createMany({
      data: [
        ...Array.from({ length: 230 }, (_, i) => ({ organizationId: orgId, title: `Vencida ${i}`, dueAt: new Date(now.getTime() - 3600_000 - i * 1000) })),
        { organizationId: orgId, title: 'Muito antiga', dueAt: new Date(now.getTime() - 10 * 86400_000) },
      ],
    });
    await runTick(now);
    expect(await db.automationRun.count({ where: { automationId: automation.id } })).toBe(230);
    await runTick(now);
    expect(await db.automationRun.count({ where: { automationId: automation.id } })).toBe(230);
  });

  it('cron: follow-up de "sem resposta" percorre todas as conversas mesmo quando a ação envia mensagem', async () => {
    const db = tenantDb(orgId);
    const automation = await db.automation.create({
      data: { organizationId: orgId, name: 'Sem resposta', trigger: 'conversation.no_reply', conditions: [], actions: [{ type: 'send_message', params: { text: 'Ainda tem interesse?' } }] },
    });
    const now = new Date();
    const contacts = await db.contact.createManyAndReturn({
      data: Array.from({ length: 210 }, (_, i) => ({ organizationId: orgId, name: `Sumido ${i}`, source: 'webchat' })),
      select: { id: true },
    });
    await db.conversation.createMany({
      data: contacts.map((c) => ({
        organizationId: orgId,
        contactId: c.id,
        channel: 'WEBCHAT' as const,
        status: 'OPEN' as const,
        awaitingReply: false,
        lastOutboundAt: new Date(now.getTime() - 50 * 3600_000),
        lastInboundAt: new Date(now.getTime() - 51 * 3600_000),
      })),
    });
    await runTick(now);
    expect(await db.automationRun.count({ where: { automationId: automation.id } })).toBe(210);
  });

  it('webhook de cobrança sem metadados encontra a empresa pela assinatura', async () => {
    await systemDb.subscription.update({ where: { organizationId: orgId }, data: { externalSubscriptionId: 'sub_regressao', status: 'ACTIVE' } });
    expect(await applyBillingEvent({ id: 'evt_r1', type: 'subscription.past_due', externalSubscriptionId: 'sub_regressao' })).toBe(orgId);
    expect((await systemDb.subscription.findUniqueOrThrow({ where: { organizationId: orgId } })).status).toBe('PAST_DUE');
  });

  it('cobrança: eventos de outra assinatura e entregas fora de ordem não alteram o estado atual', async () => {
    const status = async () => (await systemDb.subscription.findUniqueOrThrow({ where: { organizationId: orgId } })).status;
    const t = (iso: string) => new Date(iso);
    await applyBillingEvent({ id: 'evt_o1', type: 'subscription.renewed', organizationId: orgId, externalSubscriptionId: 'sub_regressao', occurredAt: t('2026-10-01T10:00:00Z') });
    expect(await status()).toBe('ACTIVE');
    // fatura da assinatura antiga (troca de plano) com os mesmos metadados da empresa
    await applyBillingEvent({ id: 'evt_o2', type: 'subscription.past_due', organizationId: orgId, externalSubscriptionId: 'sub_antiga', occurredAt: t('2026-10-02T10:00:00Z') });
    expect(await status()).toBe('ACTIVE');
    // reenvio de uma falha antiga, depois do pagamento
    await applyBillingEvent({ id: 'evt_o3', type: 'subscription.past_due', externalSubscriptionId: 'sub_regressao', occurredAt: t('2026-09-30T10:00:00Z') });
    expect(await status()).toBe('ACTIVE');
    // um checkout novo vincula a nova assinatura
    await applyBillingEvent({ id: 'evt_o4', type: 'subscription.activated', organizationId: orgId, externalSubscriptionId: 'sub_nova', occurredAt: t('2026-10-03T10:00:00Z') });
    expect((await systemDb.subscription.findUniqueOrThrow({ where: { organizationId: orgId } })).externalSubscriptionId).toBe('sub_nova');
  });

  it('cadastro antigo com celular sem o 9º dígito continua sendo encontrado', async () => {
    const db = tenantDb(orgId);
    const old = await db.contact.create({ data: { organizationId: orgId, name: 'Cadastro Antigo', phone: '551187776655', whatsapp: '551187776655', source: 'import' } });
    await processWhatsAppWebhook(waPayload({ id: 'wamid.L1', phoneNumberId: 'PN1', from: '551187776655' }));
    expect((await db.contactIdentity.findFirstOrThrow({ where: { externalId: '551187776655' } })).contactId).toBe(old.id);
  });

  it('tempo de resposta considera cada bloco de mensagens do cliente', async () => {
    const db = tenantDb(orgId);
    const contact = await createContact(ctxFor(orgId, adminId), { name: 'Métrica', email: 'metrica@regressao.example', source: 'manual' });
    const conv = await db.conversation.create({ data: { organizationId: orgId, contactId: contact.id, channel: 'WEBCHAT' } });
    const t0 = new Date('2020-01-06T12:00:00Z').getTime();
    const msg = (sec: number, direction: 'INBOUND' | 'OUTBOUND', senderType: 'CONTACT' | 'USER' | 'AI' | 'SYSTEM') => ({
      organizationId: orgId, conversationId: conv.id, direction, senderType, body: 'x', status: 'SENT' as const, createdAt: new Date(t0 + sec * 1000),
    });
    await db.message.createMany({ data: [msg(0, 'INBOUND', 'CONTACT'), msg(60, 'OUTBOUND', 'USER'), msg(120, 'INBOUND', 'CONTACT'), msg(125, 'OUTBOUND', 'SYSTEM'), msg(130, 'INBOUND', 'CONTACT'), msg(300, 'OUTBOUND', 'AI')] });
    const a = await getAnalytics(ctxFor(orgId, adminId), { start: new Date(t0 - 3600_000), end: new Date(t0 + 3600_000) });
    expect(a.responseTime.samples).toBe(2);
    expect(a.responseTime.overallSeconds).toBe(120);
    expect(a.responseTime.bySender).toEqual(expect.arrayContaining([{ sender: 'USER', seconds: 60, samples: 1 }, { sender: 'AI', seconds: 180, samples: 1 }]));
  });

  it('gráfico de leads usa o dia local (lead às 23h30 não cai no dia seguinte)', async () => {
    const prevTz = process.env.TZ;
    process.env.TZ = 'America/Sao_Paulo';
    try {
      const db = tenantDb(orgId);
      const c = await createContact(ctxFor(orgId, adminId), { name: 'Noturno', email: 'noturno@regressao.example', source: 'manual' });
      await db.contact.update({ where: { id: c.id }, data: { createdAt: new Date('2020-02-10T02:30:00Z') } }); // 09/02 23:30 em SP
      const d = await getDashboard(ctxFor(orgId, adminId), { start: new Date('2020-02-09T03:00:00Z'), end: new Date('2020-02-11T02:59:59Z') });
      expect(d.leadsSeries.find((p) => p.date === '2020-02-09')?.count).toBe(1);
      expect(d.leadsSeries.find((p) => p.date === '2020-02-10')?.count ?? 0).toBe(0);
    } finally {
      process.env.TZ = prevTz;
    }
  });
});
