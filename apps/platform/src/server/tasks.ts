import type { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { NotFoundError } from '@/lib/errors';
import { optionalDate, optionalId, optionalString } from '@/lib/validation';
import { assertMember } from './contacts';
import { addTimeline } from './timeline';

export const PRIORITY_LABELS: Record<TaskPriority, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' };
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { TODO: 'A fazer', IN_PROGRESS: 'Em andamento', DONE: 'Concluída', CANCELED: 'Cancelada' };

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório.').max(200),
  description: optionalString(4000),
  type: z.enum(['TASK', 'FOLLOW_UP']).default('TASK'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']).default('TODO'),
  dueAt: optionalDate,
  assigneeId: optionalId,
  contactId: optionalId,
  opportunityId: optionalId,
});

export type TaskInput = z.input<typeof taskSchema>;

export async function listTasks(ctx: ServiceCtx, f: { status?: string; assigneeId?: string; view?: string; contactId?: string } = {}) {
  assertCan(ctx, 'tasks.manage');
  const now = new Date();
  const and: Prisma.TaskWhereInput[] = [ownerScope(ctx, 'assigneeId') as Prisma.TaskWhereInput];
  if (f.status) and.push({ status: f.status as TaskStatus });
  else if (f.view !== 'all') and.push({ status: { in: ['TODO', 'IN_PROGRESS'] } });
  if (f.view === 'overdue') and.push({ dueAt: { lt: now } });
  if (f.view === 'today') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    and.push({ dueAt: { lte: end } });
  }
  if (f.view === 'followup') and.push({ type: 'FOLLOW_UP' });
  if (f.view === 'mine' && ctx.userId) and.push({ assigneeId: ctx.userId });
  if (f.assigneeId) and.push({ assigneeId: f.assigneeId });
  if (f.contactId) and.push({ contactId: f.contactId });
  return ctx.db.task.findMany({
    where: { AND: and },
    orderBy: [{ status: 'asc' }, { dueAt: { sort: 'asc', nulls: 'last' } }, { priority: 'desc' }],
    include: { contact: { select: { id: true, name: true } } },
    take: 300,
  });
}

export async function createTask(ctx: ServiceCtx, input: TaskInput, opts: { source?: string } = {}) {
  assertCan(ctx, 'tasks.manage');
  const data = taskSchema.parse(input);
  if (data.assigneeId) await assertMember(ctx, data.assigneeId);
  if (data.contactId && !(await ctx.db.contact.findFirst({ where: { id: data.contactId } }))) throw new NotFoundError('Contato não encontrado.');
  const task = await ctx.db.task.create({
    data: {
      organizationId: ctx.orgId,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: data.status,
      dueAt: data.dueAt,
      assigneeId: data.assigneeId ?? (ctx.actorType === 'USER' ? ctx.userId : null),
      contactId: data.contactId,
      opportunityId: data.opportunityId,
      source: opts.source ?? (ctx.actorType === 'USER' ? 'MANUAL' : ctx.actorType),
      createdById: ctx.userId,
    },
  });
  if (task.contactId) {
    await addTimeline(ctx, {
      contactId: task.contactId,
      type: task.type === 'FOLLOW_UP' ? 'followup_created' : 'task_created',
      title: `${task.type === 'FOLLOW_UP' ? 'Follow-up' : 'Tarefa'} criada: ${task.title}`,
      data: { taskId: task.id, dueAt: task.dueAt },
    });
  }
  return task;
}

async function getScopedTask(ctx: ServiceCtx, id: string) {
  const t = await ctx.db.task.findFirst({ where: { AND: [{ id }, ownerScope(ctx, 'assigneeId') as Prisma.TaskWhereInput] } });
  if (!t) throw new NotFoundError('Tarefa não encontrada.');
  return t;
}

export async function updateTask(ctx: ServiceCtx, id: string, input: Partial<TaskInput>) {
  assertCan(ctx, 'tasks.manage');
  const current = await getScopedTask(ctx, id);
  const data = taskSchema.partial().parse(input);
  if (data.assigneeId) await assertMember(ctx, data.assigneeId);
  const task = await ctx.db.task.update({
    where: { id },
    data: {
      title: data.title,
      description: 'description' in input ? data.description : undefined,
      type: data.type,
      priority: data.priority,
      dueAt: 'dueAt' in input ? data.dueAt : undefined,
      assigneeId: 'assigneeId' in input ? data.assigneeId : undefined,
      contactId: 'contactId' in input ? data.contactId : undefined,
      status: data.status,
      completedAt: data.status === 'DONE' ? (current.completedAt ?? new Date()) : data.status ? null : undefined,
    },
  });
  if (data.status === 'DONE' && current.status !== 'DONE' && task.contactId) {
    await addTimeline(ctx, { contactId: task.contactId, type: 'task_completed', title: `Tarefa concluída: ${task.title}`, data: { taskId: task.id } });
  }
  return task;
}

export async function setTaskStatus(ctx: ServiceCtx, id: string, status: TaskStatus) {
  return updateTask(ctx, id, { status });
}

export async function deleteTask(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'tasks.manage');
  await getScopedTask(ctx, id);
  await ctx.db.task.delete({ where: { id } });
}
