import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { NotFoundError } from '@/lib/errors';
import { assertWithinLimit } from '../billing/limits';
import { TRIGGERS } from '../events';
import { automationDefinitionSchema } from './engine';

export const automationSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório.').max(120),
    description: z.string().max(500).optional().nullable(),
    trigger: z.string().refine((t) => t in TRIGGERS, 'Gatilho inválido.'),
    enabled: z.boolean().default(true),
  })
  .and(automationDefinitionSchema);

export type AutomationInput = z.input<typeof automationSchema>;

export async function listAutomations(ctx: ServiceCtx) {
  assertCan(ctx, 'automations.manage');
  return ctx.db.automation.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function listAutomationRuns(ctx: ServiceCtx, automationId?: string) {
  assertCan(ctx, 'automations.manage');
  return ctx.db.automationRun.findMany({
    where: automationId ? { automationId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { automation: { select: { name: true } } },
  });
}

export async function saveAutomation(ctx: ServiceCtx, id: string | null, input: AutomationInput) {
  assertCan(ctx, 'automations.manage');
  const data = automationSchema.parse(input);
  const values = {
    name: data.name,
    description: data.description ?? null,
    trigger: data.trigger,
    enabled: data.enabled,
    conditions: data.conditions as Prisma.InputJsonValue,
    actions: data.actions as Prisma.InputJsonValue,
  };
  let automation;
  if (id) {
    if (!(await ctx.db.automation.findFirst({ where: { id } }))) throw new NotFoundError('Automação não encontrada.');
    automation = await ctx.db.automation.update({ where: { id }, data: values });
  } else {
    await assertWithinLimit(ctx, 'automations');
    automation = await ctx.db.automation.create({ data: { ...values, organizationId: ctx.orgId } });
  }
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: id ? 'automation.updated' : 'automation.created', entityType: 'Automation', entityId: automation.id });
  return automation;
}

export async function toggleAutomation(ctx: ServiceCtx, id: string, enabled: boolean) {
  assertCan(ctx, 'automations.manage');
  const a = await ctx.db.automation.update({ where: { id }, data: { enabled } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: enabled ? 'automation.enabled' : 'automation.disabled', entityType: 'Automation', entityId: id });
  return a;
}

export async function deleteAutomation(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'automations.manage');
  await ctx.db.automation.delete({ where: { id } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'automation.deleted', entityType: 'Automation', entityId: id, severity: 'warning' });
}
