import { beforeAll, describe, expect, it } from 'vitest';
import { ForbiddenError, LimitExceededError, NotFoundError } from '@/lib/errors';
import { createContact, getContact, listContacts, updateContact } from '@/server/contacts';
import { anonymizeContact, exportContactData } from '@/server/lgpd';
import { createOpportunity, moveOpportunity } from '@/server/pipeline';
import { createAppointment } from '@/server/calendar';
import { startConversation } from '@/server/conversations';
import { createTask, listTasks } from '@/server/tasks';
import { getContactTimeline } from '@/server/timeline';
import { createOrg, createUser, ctxFor, dbReachable, resetDb } from '../helpers';

const ok = await dbReachable();

describe.skipIf(!ok)('CRM, funil, automações e LGPD', () => {
  let orgId: string, adminId: string, agentId: string, otherAgentId: string;
  beforeAll(async () => {
    await resetDb();
    orgId = (await createOrg('CRM Org')).id;
    adminId = (await createUser('admin@crm.example', orgId)).id;
    agentId = (await createUser('agente@crm.example', orgId, 'agent')).id;
    otherAgentId = (await createUser('agente2@crm.example', orgId, 'agent')).id;
  });

  it('novo lead entra no funil, gera timeline e tarefa automática', async () => {
    const ctx = ctxFor(orgId, adminId);
    const c = await createContact(ctx, { name: 'Lead Um', phone: '(11) 91234-5678', potentialValue: '1.500,50', customFields: { checkIn: '2026-12-01' } });
    expect(c.whatsapp).toBe('5511912345678');
    expect(Number(c.potentialValue)).toBe(1500.5);
    const full = await getContact(ctx, c.id);
    expect(full.opportunities[0]?.stage.key).toBe('new');
    const tasks = await listTasks(ctx, { contactId: c.id });
    expect(tasks.some((t) => t.source === 'AUTOMATION' && t.title.includes('Lead Um'))).toBe(true);
    const timeline = await getContactTimeline(ctx, c.id);
    expect(timeline.some((t) => t.kind === 'event' && t.type === 'lead_created')).toBe(true);
  });

  it('mover para "Proposta Enviada" registra histórico e cria follow-up', async () => {
    const ctx = ctxFor(orgId, adminId);
    const c = await createContact(ctx, { name: 'Lead Proposta' });
    const opp = (await getContact(ctx, c.id)).opportunities[0]!;
    const proposal = await ctx.db.pipelineStage.findFirstOrThrow({ where: { key: 'proposal' } });
    await moveOpportunity(ctx, opp.id, proposal.id);
    const timeline = await getContactTimeline(ctx, c.id);
    expect(timeline.some((t) => t.kind === 'event' && t.type === 'stage_changed')).toBe(true);
    const tasks = await listTasks(ctx, { contactId: c.id, view: 'followup' });
    expect(tasks.some((t) => t.type === 'FOLLOW_UP' && t.title.includes('proposta'))).toBe(true);
  });

  it('venda ganha converte o lead em cliente', async () => {
    const ctx = ctxFor(orgId, adminId);
    const c = await createContact(ctx, { name: 'Lead Ganho' });
    const opp = (await getContact(ctx, c.id)).opportunities[0]!;
    const won = await ctx.db.pipelineStage.findFirstOrThrow({ where: { kind: 'WON' } });
    await moveOpportunity(ctx, opp.id, won.id);
    const after = await getContact(ctx, c.id);
    expect(after.kind).toBe('CUSTOMER');
    expect(after.opportunities[0]?.status).toBe('WON');
  });

  it('etapa com regra "exige valor" bloqueia oportunidade sem valor', async () => {
    const ctx = ctxFor(orgId, adminId);
    const stage = await ctx.db.pipelineStage.findFirstOrThrow({ where: { key: 'negotiation' } });
    await ctx.db.pipelineStage.update({ where: { id: stage.id }, data: { rules: { requireValue: true } } });
    const c = await createContact(ctx, { name: 'Sem Valor' });
    const opp = (await getContact(ctx, c.id)).opportunities[0]!;
    await expect(moveOpportunity(ctx, opp.id, stage.id)).rejects.toThrow('exige');
  });

  it('atendente vê apenas os próprios leads e os não atribuídos', async () => {
    const mine = await createContact(ctxFor(orgId, agentId, 'agent'), { name: 'Do Agente 1' });
    const others = await createContact(ctxFor(orgId, otherAgentId, 'agent'), { name: 'Do Agente 2' });
    const agentCtx = ctxFor(orgId, agentId, 'agent');
    const names = (await listContacts(agentCtx, { pageSize: 100 })).items.map((c) => c.name);
    expect(names).toContain('Do Agente 1');
    expect(names).not.toContain('Do Agente 2');
    await expect(getContact(agentCtx, others.id)).rejects.toThrow(NotFoundError);
    await expect(updateContact(agentCtx, others.id, { name: 'x' })).rejects.toThrow(NotFoundError);
    expect((await getContact(agentCtx, mine.id)).name).toBe('Do Agente 1');
  });

  it('atendente não vincula tarefas, agenda ou conversas a leads de outro atendente', async () => {
    const others = await createContact(ctxFor(orgId, otherAgentId, 'agent'), { name: 'Exclusivo Agente 2' });
    const agentCtx = ctxFor(orgId, agentId, 'agent');
    await expect(createTask(agentCtx, { title: 'x', contactId: others.id })).rejects.toThrow(NotFoundError);
    await expect(createAppointment(agentCtx, { title: 'x', startsAt: new Date(), endsAt: new Date(), contactId: others.id })).rejects.toThrow(NotFoundError);
    await expect(startConversation(agentCtx, others.id, 'EMAIL')).rejects.toThrow(NotFoundError);
    await expect(createOpportunity(agentCtx, { contactId: others.id, title: 'x' })).rejects.toThrow(NotFoundError);
  });

  it('atendente não pode anonimizar nem exportar dados (LGPD)', async () => {
    const c = await createContact(ctxFor(orgId, agentId, 'agent'), { name: 'Protegido' });
    await expect(anonymizeContact(ctxFor(orgId, agentId, 'agent'), c.id)).rejects.toThrow(ForbiddenError);
    await expect(exportContactData(ctxFor(orgId, agentId, 'agent'), c.id)).rejects.toThrow(ForbiddenError);
  });

  it('exportação e anonimização pelo administrador', async () => {
    const ctx = ctxFor(orgId, adminId);
    const c = await createContact(ctx, { name: 'Titular', email: 'titular@crm.example', phone: '11977776666' });
    const exported = await exportContactData(ctx, c.id);
    expect(exported.contact.email).toBe('titular@crm.example');
    await anonymizeContact(ctx, c.id);
    const raw = await ctx.db.contact.findFirstOrThrow({ where: { id: c.id } });
    expect(raw).toMatchObject({ name: 'Contato anonimizado', email: null, phone: null });
    expect(raw.anonymizedAt).not.toBeNull();
    expect(await ctx.db.timelineEvent.count({ where: { contactId: c.id } })).toBe(0);
  });

  it('tarefas: responsável precisa ser membro da empresa', async () => {
    const outsider = await createUser('fora@crm.example', null);
    await expect(createTask(ctxFor(orgId, adminId), { title: 'X', assigneeId: outsider.id })).rejects.toThrow(NotFoundError);
  });

  it('limite de contatos do plano', async () => {
    const small = (await createOrg('Plano Pequeno', { contacts: 1 })).id;
    const u = (await createUser('p@p.example', small)).id;
    await createContact(ctxFor(small, u), { name: 'Primeiro' });
    await expect(createContact(ctxFor(small, u), { name: 'Segundo' })).rejects.toThrow(LimitExceededError);
  });
});
