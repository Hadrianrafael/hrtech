import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { AppError, NotFoundError } from '@/lib/errors';
import { checkbox, optionalId, optionalString } from '@/lib/validation';
import { assertContactAccessible, assertMember } from './contacts';
import { emitEvent } from './events';
import { addTimeline } from './timeline';

export const APPOINTMENT_TYPES: Record<string, string> = {
  MEETING: 'Reunião',
  CALL: 'Ligação / retorno',
  VISIT: 'Visita',
  SERVICE: 'Atendimento',
  FOLLOW_UP: 'Follow-up',
  TASK: 'Tarefa',
  RETURN: 'Retorno comercial',
};

export const appointmentSchema = z
  .object({
    title: z.string().trim().min(1, 'Título é obrigatório.').max(200),
    type: z.string().refine((v) => v in APPOINTMENT_TYPES, 'Tipo inválido.').default('MEETING'),
    description: optionalString(4000),
    location: optionalString(300),
    startsAt: z.coerce.date({ invalid_type_error: 'Início inválido.' }),
    endsAt: z.coerce.date({ invalid_type_error: 'Fim inválido.' }),
    allDay: checkbox,
    contactId: optionalId,
    opportunityId: optionalId,
    ownerId: optionalId,
  })
  .refine((v) => v.endsAt >= v.startsAt, { message: 'O fim deve ser depois do início.', path: ['endsAt'] });

export type AppointmentInput = z.input<typeof appointmentSchema>;

export async function listAppointments(ctx: ServiceCtx, from: Date, to: Date, f: { ownerId?: string } = {}) {
  assertCan(ctx, 'calendar.manage');
  return ctx.db.appointment.findMany({
    where: {
      AND: [
        { startsAt: { lt: to }, endsAt: { gte: from } },
        { status: { not: 'CANCELED' } },
        ownerScope(ctx, 'ownerId') as Prisma.AppointmentWhereInput,
        f.ownerId ? { ownerId: f.ownerId } : {},
      ],
    },
    orderBy: { startsAt: 'asc' },
    include: { contact: { select: { id: true, name: true } } },
    take: 1000,
  });
}

export async function createAppointment(ctx: ServiceCtx, input: AppointmentInput) {
  assertCan(ctx, 'calendar.manage');
  const data = appointmentSchema.parse(input);
  if (data.ownerId) await assertMember(ctx, data.ownerId);
  if (data.contactId) await assertContactAccessible(ctx, data.contactId);
  const appt = await ctx.db.appointment.create({
    data: {
      organizationId: ctx.orgId,
      title: data.title,
      type: data.type,
      description: data.description,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      allDay: data.allDay,
      contactId: data.contactId,
      opportunityId: data.opportunityId,
      ownerId: data.ownerId ?? ctx.userId,
      createdById: ctx.userId,
    },
  });
  if (appt.contactId) {
    await addTimeline(ctx, {
      contactId: appt.contactId,
      type: 'appointment',
      title: `${APPOINTMENT_TYPES[appt.type] ?? 'Compromisso'} agendado: ${appt.title}`,
      data: { appointmentId: appt.id, startsAt: appt.startsAt },
    });
    await ctx.db.contact.update({ where: { id: appt.contactId }, data: { nextActionAt: appt.startsAt, nextActionNote: appt.title } });
  }
  await emitEvent(ctx, 'appointment.created', { contactId: appt.contactId, appointmentId: appt.id, type: appt.type }, { eventKey: `appt:${appt.id}` });
  return appt;
}

async function getScoped(ctx: ServiceCtx, id: string) {
  const a = await ctx.db.appointment.findFirst({ where: { AND: [{ id }, ownerScope(ctx, 'ownerId') as Prisma.AppointmentWhereInput] } });
  if (!a) throw new NotFoundError('Compromisso não encontrado.');
  return a;
}

export async function updateAppointment(ctx: ServiceCtx, id: string, input: AppointmentInput) {
  assertCan(ctx, 'calendar.manage');
  await getScoped(ctx, id);
  const data = appointmentSchema.parse(input);
  if (data.ownerId) await assertMember(ctx, data.ownerId);
  if (data.contactId) await assertContactAccessible(ctx, data.contactId);
  return ctx.db.appointment.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      description: data.description,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      allDay: data.allDay,
      contactId: data.contactId,
      ownerId: data.ownerId ?? undefined,
    },
  });
}

export async function setAppointmentStatus(ctx: ServiceCtx, id: string, status: 'SCHEDULED' | 'DONE' | 'CANCELED') {
  assertCan(ctx, 'calendar.manage');
  const a = await getScoped(ctx, id);
  if (a.status === status) throw new AppError('O compromisso já está neste status.');
  const updated = await ctx.db.appointment.update({ where: { id }, data: { status } });
  if (a.contactId) {
    await addTimeline(ctx, {
      contactId: a.contactId,
      type: 'appointment',
      title: `Compromisso ${status === 'DONE' ? 'realizado' : status === 'CANCELED' ? 'cancelado' : 'reagendado'}: ${a.title}`,
    });
  }
  return updated;
}
