import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import type { ServiceCtx } from '@/lib/auth/ctx';
import { isUniqueViolation } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { addTagByName } from '../contacts';
import type { EventPayload, TriggerKey } from '../events';
import { addTimeline } from '../timeline';
import { ACTIONS } from './actions';
import { evaluateConditions, renderTemplate, type Condition } from './conditions';

const MAX_DEPTH = 3;

const conditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'neq', 'in', 'not_in', 'contains', 'gt', 'lt', 'exists', 'not_exists']),
  value: z.unknown().optional(),
});
const actionSchema = z.object({ type: z.string().refine((t) => t in ACTIONS, 'Ação desconhecida.'), params: z.record(z.unknown()).default({}) });

export const automationDefinitionSchema = z.object({
  conditions: z.array(conditionSchema).max(10),
  actions: z.array(actionSchema).min(1, 'Adicione ao menos uma ação.').max(10),
});

/** Monta os "fatos" do evento, carregando contato/oportunidade/conversa para avaliação de condições. */
async function buildFacts(ctx: ServiceCtx, payload: EventPayload) {
  const facts: Record<string, unknown> = { ...payload };
  if (payload.contactId) {
    const contact = await ctx.db.contact.findFirst({ where: { id: payload.contactId }, include: { tags: { include: { tag: true } } } });
    if (contact) {
      facts.contact = {
        id: contact.id,
        name: contact.name,
        firstName: contact.name.split(' ')[0],
        email: contact.email,
        phone: contact.phone,
        source: contact.source,
        status: contact.status,
        city: contact.city,
        ownerId: contact.ownerId,
        tags: contact.tags.map((t) => t.tag.name),
      };
    }
  }
  const opp = payload.opportunityId
    ? await ctx.db.opportunity.findFirst({ where: { id: payload.opportunityId }, include: { stage: true } })
    : payload.contactId
      ? await ctx.db.opportunity.findFirst({ where: { contactId: payload.contactId, status: 'OPEN' }, include: { stage: true }, orderBy: { createdAt: 'desc' } })
      : null;
  if (opp) facts.opportunity = { id: opp.id, title: opp.title, stageKey: opp.stage.key, stageName: opp.stage.name, value: opp.value ? Number(opp.value) : null, ownerId: opp.ownerId };
  if (payload.conversationId) {
    const conv = await ctx.db.conversation.findFirst({ where: { id: payload.conversationId } });
    if (conv) {
      facts.conversation = { id: conv.id, channel: conv.channel, status: conv.status };
      facts.channel ??= conv.channel;
    }
  }
  return facts;
}

/** Distribuição automática: membro ativo com permissão de atendimento e menos contatos recentes. */
export async function pickRoundRobinUser(ctx: ServiceCtx): Promise<string | null> {
  const members = await ctx.db.membership.findMany({ where: { status: 'ACTIVE' }, include: { role: true } });
  const eligible = members.filter((m) => m.role.permissions.includes('inbox.use'));
  if (!eligible.length) return null;
  const since = new Date(Date.now() - 30 * 86400000);
  const loads = await Promise.all(
    eligible.map(async (m) => ({ userId: m.userId, load: await ctx.db.contact.count({ where: { ownerId: m.userId, updatedAt: { gte: since } } }) })),
  );
  loads.sort((a, b) => a.load - b.load);
  return loads[0]!.userId;
}

type ActionResult = { type: string; ok: boolean; detail?: string };

async function executeAction(
  ctx: ServiceCtx,
  action: { type: string; params: Record<string, unknown> },
  facts: Record<string, unknown>,
  payload: EventPayload,
  depth: number,
): Promise<ActionResult> {
  const p = action.params;
  const contactId = payload.contactId ?? null;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  switch (action.type) {
    case 'create_task': {
      if (!contactId) return { type: action.type, ok: false, detail: 'Evento sem contato.' };
      const contact = facts.contact as { ownerId?: string | null } | undefined;
      let assigneeId: string | null = contact?.ownerId ?? null;
      if (p.assignee === 'round_robin' || (!assigneeId && p.assignee !== 'none')) assigneeId = assigneeId ?? (await pickRoundRobinUser(ctx));
      const hours = Number(p.dueInHours ?? 24);
      const { createTask } = await import('../tasks');
      const task = await createTask(
        ctx,
        {
          title: renderTemplate(str(p.title) || 'Tarefa automática', facts).slice(0, 200),
          type: p.type === 'FOLLOW_UP' ? 'FOLLOW_UP' : 'TASK',
          priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(str(p.priority)) ? p.priority : 'MEDIUM') as 'MEDIUM',
          dueAt: new Date(Date.now() + (Number.isFinite(hours) ? hours : 24) * 3600000).toISOString(),
          assigneeId,
          contactId,
          opportunityId: (facts.opportunity as { id?: string } | undefined)?.id ?? null,
        },
        { source: 'AUTOMATION' },
      );
      return { type: action.type, ok: true, detail: `Tarefa ${task.id}` };
    }
    case 'add_tag': {
      if (!contactId) return { type: action.type, ok: false, detail: 'Evento sem contato.' };
      const tag = renderTemplate(str(p.tag), facts).trim().slice(0, 40);
      if (!tag) return { type: action.type, ok: false, detail: 'Etiqueta vazia.' };
      await addTagByName(ctx, contactId, tag);
      return { type: action.type, ok: true, detail: tag };
    }
    case 'assign_owner': {
      if (!contactId) return { type: action.type, ok: false, detail: 'Evento sem contato.' };
      const contact = await ctx.db.contact.findFirst({ where: { id: contactId } });
      if (!contact) return { type: action.type, ok: false, detail: 'Contato não encontrado.' };
      if (p.onlyIfEmpty && contact.ownerId) return { type: action.type, ok: true, detail: 'Já possui responsável.' };
      let userId: string | null = null;
      if (p.mode === 'user' && typeof p.userId === 'string') {
        const m = await ctx.db.membership.findFirst({ where: { userId: p.userId, status: 'ACTIVE' } });
        userId = m ? p.userId : null;
      } else userId = await pickRoundRobinUser(ctx);
      if (!userId) return { type: action.type, ok: false, detail: 'Nenhum usuário elegível.' };
      await ctx.db.contact.update({ where: { id: contactId }, data: { ownerId: userId } });
      await ctx.db.opportunity.updateMany({ where: { contactId, status: 'OPEN', ownerId: null }, data: { ownerId: userId } });
      if (payload.conversationId) await ctx.db.conversation.updateMany({ where: { id: payload.conversationId, assigneeId: null }, data: { assigneeId: userId } });
      const factContact = facts.contact as Record<string, unknown> | undefined;
      if (factContact) factContact.ownerId = userId;
      await addTimeline(ctx, { contactId, type: 'assigned', title: 'Responsável atribuído por automação', data: { userId } });
      return { type: action.type, ok: true, detail: userId };
    }
    case 'move_stage': {
      const opp = facts.opportunity as { id: string } | undefined;
      if (!opp) return { type: action.type, ok: false, detail: 'Contato sem oportunidade aberta.' };
      const o = await ctx.db.opportunity.findFirst({ where: { id: opp.id } });
      const stage = await ctx.db.pipelineStage.findFirst({
        where: { pipelineId: o?.pipelineId, OR: [{ key: str(p.stageKey) }, { id: str(p.stageKey) }] },
      });
      if (!o || !stage) return { type: action.type, ok: false, detail: 'Etapa não encontrada.' };
      if (o.stageId === stage.id) return { type: action.type, ok: true, detail: 'Já está na etapa.' };
      const { moveOpportunity } = await import('../pipeline');
      await moveOpportunity(ctx, o.id, stage.id, { depth: depth + 1 });
      return { type: action.type, ok: true, detail: stage.name };
    }
    case 'set_status': {
      if (!contactId) return { type: action.type, ok: false, detail: 'Evento sem contato.' };
      const status = str(p.status);
      if (!['CONTACTED', 'IN_CONVERSATION', 'QUALIFIED', 'UNQUALIFIED'].includes(status)) return { type: action.type, ok: false, detail: 'Status inválido.' };
      await ctx.db.contact.update({ where: { id: contactId }, data: { status: status as 'QUALIFIED' } });
      await addTimeline(ctx, { contactId, type: 'field_changed', title: `Status alterado por automação: ${status}` });
      return { type: action.type, ok: true };
    }
    case 'send_message': {
      const conversationId =
        payload.conversationId ??
        (contactId ? (await ctx.db.conversation.findFirst({ where: { contactId }, orderBy: { lastMessageAt: 'desc' } }))?.id : null);
      if (!conversationId) return { type: action.type, ok: false, detail: 'Contato sem conversa.' };
      const { sendMessage } = await import('../conversations');
      await sendMessage(ctx, conversationId, { body: renderTemplate(str(p.text), facts), senderType: 'SYSTEM' });
      return { type: action.type, ok: true };
    }
    case 'pause_ai': {
      if (!payload.conversationId) return { type: action.type, ok: false, detail: 'Evento sem conversa.' };
      await ctx.db.conversation.update({ where: { id: payload.conversationId }, data: { aiPaused: true, humanRequested: true } });
      return { type: action.type, ok: true };
    }
    case 'add_note': {
      if (!contactId) return { type: action.type, ok: false, detail: 'Evento sem contato.' };
      await addTimeline(ctx, { contactId, type: 'note', title: 'Observação automática', data: { body: renderTemplate(str(p.text), facts) } });
      return { type: action.type, ok: true };
    }
    default:
      throw new AppError(`Ação desconhecida: ${action.type}`);
  }
}

/**
 * Executa as automações habilitadas para o gatilho. Idempotente por (automação, eventKey):
 * reentregas do mesmo evento (ex.: webhook duplicado) não executam as ações novamente.
 */
export async function runAutomations(ctx: ServiceCtx, trigger: TriggerKey, payload: EventPayload, opts: { eventKey: string; depth?: number }) {
  const depth = opts.depth ?? 0;
  if (depth >= MAX_DEPTH) {
    logger.warn('automation.max_depth', { orgId: ctx.orgId, trigger });
    return [];
  }
  const automations = await ctx.db.automation.findMany({ where: { trigger, enabled: true }, orderBy: { createdAt: 'asc' } });
  if (!automations.length) return [];
  const autoCtx: ServiceCtx = { ...ctx, actorType: 'AUTOMATION' };
  const facts = await buildFacts(autoCtx, payload);
  const runs: { automationId: string; status: string }[] = [];

  for (const automation of automations) {
    let run;
    try {
      run = await ctx.db.automationRun.create({
        data: {
          organizationId: ctx.orgId,
          automationId: automation.id,
          eventKey: opts.eventKey,
          status: 'RUNNING',
          input: JSON.parse(JSON.stringify({ trigger, payload })) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) continue; // já processado
      throw err;
    }

    const parsed = automationDefinitionSchema.safeParse({ conditions: automation.conditions, actions: automation.actions });
    if (!parsed.success) {
      await ctx.db.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: 'Definição inválida.' } });
      continue;
    }
    if (!evaluateConditions(facts, parsed.data.conditions as Condition[])) {
      await ctx.db.automationRun.update({ where: { id: run.id }, data: { status: 'SKIPPED' } });
      runs.push({ automationId: automation.id, status: 'SKIPPED' });
      continue;
    }

    const results: ActionResult[] = [];
    let error: string | null = null;
    for (const action of parsed.data.actions) {
      try {
        results.push(await executeAction(autoCtx, action, facts, payload, depth));
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        results.push({ type: action.type, ok: false, detail: error });
        break;
      }
    }
    const softFailures = results.filter((r) => !r.ok);
    const status = error ? 'FAILED' : softFailures.length ? 'PARTIAL' : 'SUCCESS';
    const runError = error ?? (softFailures.length ? softFailures.map((r) => `${r.type}: ${r.detail ?? 'não executada'}`).join('; ') : null);
    await ctx.db.automationRun.update({ where: { id: run.id }, data: { status, result: results as unknown as Prisma.InputJsonValue, error: runError } });
    await ctx.db.automation.update({ where: { id: automation.id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
    if (error || softFailures.length) {
      await audit({ organizationId: ctx.orgId, action: 'automation.failed', actorType: 'AUTOMATION', entityType: 'Automation', entityId: automation.id, severity: error ? 'error' : 'warning', metadata: { error: runError, trigger } });
    }
    runs.push({ automationId: automation.id, status });
  }
  return runs;
}
