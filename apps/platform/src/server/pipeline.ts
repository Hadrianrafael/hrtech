import type { Prisma, StageKind } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { AppError, NotFoundError } from '@/lib/errors';
import { optionalDate, optionalId, optionalMoney, optionalString } from '@/lib/validation';
import { assertContactAccessible, assertMember } from './contacts';
import { emitEvent } from './events';
import { addTimeline } from './timeline';

export async function listPipelines(ctx: ServiceCtx) {
  return ctx.db.pipeline.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }], include: { stages: { orderBy: { position: 'asc' } } } });
}

export async function getBoard(ctx: ServiceCtx, pipelineId?: string | null, filters: { ownerId?: string; q?: string } = {}) {
  assertCan(ctx, 'contacts.read');
  const pipelines = await listPipelines(ctx);
  const pipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];
  if (!pipeline) return { pipelines, pipeline: null, opportunities: [] };
  const where: Prisma.OpportunityWhereInput = {
    AND: [
      { pipelineId: pipeline.id },
      ownerScope(ctx, 'ownerId') as Prisma.OpportunityWhereInput,
      filters.ownerId ? { ownerId: filters.ownerId === 'none' ? null : filters.ownerId } : {},
      filters.q ? { OR: [{ title: { contains: filters.q, mode: 'insensitive' } }, { contact: { name: { contains: filters.q, mode: 'insensitive' } } }] } : {},
      // oportunidades fechadas há mais de 60 dias saem do quadro
      { OR: [{ status: 'OPEN' }, { closedAt: { gte: new Date(Date.now() - 60 * 86400000) } }] },
    ],
  };
  const opportunities = await ctx.db.opportunity.findMany({
    where,
    orderBy: [{ position: 'asc' }],
    include: { contact: { select: { id: true, name: true, source: true, phone: true, email: true, tags: { include: { tag: true } } } } },
    take: 1000,
  });
  return { pipelines, pipeline, opportunities };
}

function statusForKind(kind: StageKind) {
  return kind === 'WON' ? 'WON' : kind === 'LOST' ? 'LOST' : 'OPEN';
}

/** Move uma oportunidade de etapa, registrando histórico na timeline e disparando automações. */
export async function moveOpportunity(
  ctx: ServiceCtx,
  opportunityId: string,
  toStageId: string,
  opts: { position?: number; lostReason?: string | null; depth?: number } = {},
) {
  assertCan(ctx, 'opportunities.write');
  const opp = await ctx.db.opportunity.findFirst({
    where: { AND: [{ id: opportunityId }, ownerScope(ctx, 'ownerId') as Prisma.OpportunityWhereInput] },
    include: { stage: true },
  });
  if (!opp) throw new NotFoundError('Oportunidade não encontrada.');
  const toStage = await ctx.db.pipelineStage.findFirst({ where: { id: toStageId, pipelineId: opp.pipelineId } });
  if (!toStage) throw new NotFoundError('Etapa inválida para este funil.');

  const rules = (toStage.rules ?? {}) as { requireValue?: boolean };
  if (rules.requireValue && !opp.value) throw new AppError(`A etapa "${toStage.name}" exige que a oportunidade tenha valor.`);

  const changed = opp.stageId !== toStage.id;
  const status = statusForKind(toStage.kind);
  const updated = await ctx.db.opportunity.update({
    where: { id: opp.id },
    data: {
      stageId: toStage.id,
      position: opts.position ?? Date.now(),
      status,
      closedAt: status === 'OPEN' ? null : changed ? new Date() : opp.closedAt,
      lostReason: status === 'LOST' ? (opts.lostReason ?? opp.lostReason) : null,
      ownerId: opp.ownerId ?? toStage.defaultOwnerId,
      ...(changed ? { stageChangedAt: new Date() } : {}),
    },
  });
  if (!changed) return updated;

  if (status === 'WON') {
    await ctx.db.contact.update({ where: { id: opp.contactId }, data: { kind: 'CUSTOMER', status: 'CUSTOMER' } });
  } else if (status === 'LOST') {
    await ctx.db.contact.update({ where: { id: opp.contactId }, data: { status: 'LOST' } });
  } else if (toStage.key === 'qualified') {
    await ctx.db.contact.update({ where: { id: opp.contactId }, data: { status: 'QUALIFIED' } });
  }

  await addTimeline(ctx, {
    contactId: opp.contactId,
    type: 'stage_changed',
    title: `Oportunidade movida: ${opp.stage.name} → ${toStage.name}`,
    data: { opportunityId: opp.id, from: opp.stage.name, to: toStage.name, lostReason: opts.lostReason },
  });
  await audit({
    organizationId: ctx.orgId,
    actorUserId: ctx.userId,
    actorType: ctx.actorType,
    action: 'opportunity.moved',
    entityType: 'Opportunity',
    entityId: opp.id,
    metadata: { from: opp.stageId, to: toStage.id },
  });

  const payload = {
    contactId: opp.contactId,
    opportunityId: opp.id,
    fromStage: { id: opp.stage.id, key: opp.stage.key, name: opp.stage.name },
    toStage: { id: toStage.id, key: toStage.key, name: toStage.name, kind: toStage.kind },
  };
  const key = `${opp.id}:${toStage.id}:${updated.stageChangedAt.getTime()}`;
  await emitEvent(ctx, 'opportunity.stage_changed', payload, { eventKey: `stage:${key}`, depth: opts.depth });
  if (status === 'WON') await emitEvent(ctx, 'opportunity.won', payload, { eventKey: `won:${key}`, depth: opts.depth });
  if (status === 'LOST') await emitEvent(ctx, 'opportunity.lost', payload, { eventKey: `lost:${key}`, depth: opts.depth });
  return updated;
}

export const opportunitySchema = z.object({
  contactId: z.string().min(1, 'Selecione o contato.'),
  title: z.string().trim().min(1, 'Título é obrigatório.').max(200),
  value: optionalMoney,
  stageId: optionalId,
  pipelineId: optionalId,
  ownerId: optionalId,
  expectedCloseAt: optionalDate,
});

export async function createOpportunity(ctx: ServiceCtx, input: z.input<typeof opportunitySchema>) {
  assertCan(ctx, 'opportunities.write');
  const data = opportunitySchema.parse(input);
  const contact = await assertContactAccessible(ctx, data.contactId);
  const pipeline = data.pipelineId
    ? await ctx.db.pipeline.findFirst({ where: { id: data.pipelineId }, include: { stages: { orderBy: { position: 'asc' } } } })
    : await ctx.db.pipeline.findFirst({ where: { isDefault: true }, include: { stages: { orderBy: { position: 'asc' } } } });
  if (!pipeline) throw new NotFoundError('Funil não encontrado.');
  const stage = pipeline.stages.find((s) => s.id === data.stageId) ?? pipeline.stages[0];
  if (!stage) throw new AppError('O funil não possui etapas.');
  if (data.ownerId) await assertMember(ctx, data.ownerId);
  const opp = await ctx.db.opportunity.create({
    data: {
      organizationId: ctx.orgId,
      pipelineId: pipeline.id,
      stageId: stage.id,
      contactId: contact.id,
      title: data.title,
      value: data.value,
      ownerId: data.ownerId ?? contact.ownerId ?? ctx.userId,
      expectedCloseAt: data.expectedCloseAt,
      status: statusForKind(stage.kind),
      position: Date.now(),
    },
  });
  await addTimeline(ctx, { contactId: contact.id, type: 'opportunity_created', title: `Oportunidade criada: ${opp.title}`, data: { opportunityId: opp.id } });
  return opp;
}

export async function updateOpportunity(ctx: ServiceCtx, id: string, input: { title?: string; value?: string | number | null; ownerId?: string | null; expectedCloseAt?: string | null }) {
  assertCan(ctx, 'opportunities.write');
  const data = opportunitySchema.partial().parse(input);
  const opp = await ctx.db.opportunity.findFirst({ where: { AND: [{ id }, ownerScope(ctx, 'ownerId') as Prisma.OpportunityWhereInput] } });
  if (!opp) throw new NotFoundError('Oportunidade não encontrada.');
  if (data.ownerId) await assertMember(ctx, data.ownerId);
  const updated = await ctx.db.opportunity.update({
    where: { id },
    data: {
      title: data.title,
      value: 'value' in input ? data.value : undefined,
      ownerId: 'ownerId' in input ? data.ownerId : undefined,
      expectedCloseAt: 'expectedCloseAt' in input ? data.expectedCloseAt : undefined,
    },
  });
  await addTimeline(ctx, { contactId: opp.contactId, type: 'opportunity_updated', title: `Oportunidade atualizada: ${updated.title}` });
  return updated;
}

// ─────────────── Configuração do funil ───────────────

export const stageSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.').max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.').default('#64748b'),
  kind: z.enum(['OPEN', 'WON', 'LOST']).default('OPEN'),
  probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
  defaultOwnerId: optionalId,
  key: optionalString(40),
  requireValue: z.union([z.literal('on'), z.boolean()]).optional(),
});

export async function createStage(ctx: ServiceCtx, pipelineId: string, input: z.input<typeof stageSchema>) {
  assertCan(ctx, 'pipeline.manage');
  const data = stageSchema.parse(input);
  const pipeline = await ctx.db.pipeline.findFirst({ where: { id: pipelineId }, include: { stages: true } });
  if (!pipeline) throw new NotFoundError('Funil não encontrado.');
  const lastOpen = pipeline.stages.filter((s) => s.kind === 'OPEN').sort((a, b) => b.position - a.position)[0];
  const position = lastOpen ? lastOpen.position + 1 : 0;
  // abre espaço antes das etapas de fechamento
  for (const s of pipeline.stages.filter((s) => s.position >= position)) {
    await ctx.db.pipelineStage.update({ where: { id: s.id }, data: { position: s.position + 1 } });
  }
  const stage = await ctx.db.pipelineStage.create({
    data: {
      organizationId: ctx.orgId,
      pipelineId,
      name: data.name,
      color: data.color,
      kind: data.kind,
      probability: data.probability ?? null,
      defaultOwnerId: data.defaultOwnerId,
      key: data.key,
      position,
      rules: { requireValue: !!data.requireValue },
    },
  });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'pipeline.stage_created', entityType: 'PipelineStage', entityId: stage.id });
  return stage;
}

export async function updateStage(ctx: ServiceCtx, stageId: string, input: z.input<typeof stageSchema>) {
  assertCan(ctx, 'pipeline.manage');
  const data = stageSchema.parse(input);
  if (data.defaultOwnerId) await assertMember(ctx, data.defaultOwnerId);
  const stage = await ctx.db.pipelineStage.update({
    where: { id: stageId },
    data: {
      name: data.name,
      color: data.color,
      kind: data.kind,
      probability: data.probability ?? null,
      defaultOwnerId: data.defaultOwnerId,
      key: data.key,
      rules: { requireValue: !!data.requireValue },
    },
  });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'pipeline.stage_updated', entityType: 'PipelineStage', entityId: stage.id });
  return stage;
}

export async function reorderStages(ctx: ServiceCtx, pipelineId: string, orderedIds: string[]) {
  assertCan(ctx, 'pipeline.manage');
  const stages = await ctx.db.pipelineStage.findMany({ where: { pipelineId } });
  const ids = new Set(stages.map((s) => s.id));
  if (orderedIds.length !== stages.length || !orderedIds.every((id) => ids.has(id))) throw new AppError('Ordem de etapas inválida.');
  for (const [i, id] of orderedIds.entries()) await ctx.db.pipelineStage.update({ where: { id }, data: { position: i } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'pipeline.stages_reordered', entityType: 'Pipeline', entityId: pipelineId });
}

export async function deleteStage(ctx: ServiceCtx, stageId: string, moveToStageId: string) {
  assertCan(ctx, 'pipeline.manage');
  const stage = await ctx.db.pipelineStage.findFirst({ where: { id: stageId } });
  const target = await ctx.db.pipelineStage.findFirst({ where: { id: moveToStageId, pipelineId: stage?.pipelineId } });
  if (!stage || !target || stage.id === target.id) throw new AppError('Selecione uma etapa de destino válida.');
  await ctx.db.opportunity.updateMany({ where: { stageId }, data: { stageId: target.id } });
  await ctx.db.pipelineStage.delete({ where: { id: stageId } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'pipeline.stage_deleted', entityType: 'PipelineStage', entityId: stageId, severity: 'warning' });
}

export async function createPipeline(ctx: ServiceCtx, name: string) {
  assertCan(ctx, 'pipeline.manage');
  const p = await ctx.db.pipeline.create({ data: { organizationId: ctx.orgId, name: name.trim().slice(0, 80) } });
  const base = [
    { name: 'Novo', key: 'new', kind: 'OPEN' as const, color: '#64748b' },
    { name: 'Em andamento', key: 'in_progress', kind: 'OPEN' as const, color: '#6366f1' },
    { name: 'Ganho', key: 'won', kind: 'WON' as const, color: '#16a34a' },
    { name: 'Perdido', key: 'lost', kind: 'LOST' as const, color: '#dc2626' },
  ];
  await ctx.db.pipelineStage.createMany({ data: base.map((s, i) => ({ ...s, organizationId: ctx.orgId, pipelineId: p.id, position: i })) });
  return p;
}
