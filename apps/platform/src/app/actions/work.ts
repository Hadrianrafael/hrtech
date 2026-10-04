'use server';

import type { TaskStatus } from '@prisma/client';
import { formToObject } from '@/lib/action';
import { withOrg } from '@/lib/action-ctx';
import { createAppointment, setAppointmentStatus, updateAppointment } from '@/server/calendar';
import { createTask, deleteTask, setTaskStatus, updateTask } from '@/server/tasks';

/** Converte campos datetime-local (horário local do navegador) enviados como ISO. */
export async function saveTaskAction(id: string | null, form: FormData) {
  return withOrg('tasks.manage', async (ctx) => {
    const data = formToObject(form) as Record<string, string>;
    if (id) await updateTask(ctx, id, data as never);
    else await createTask(ctx, data as never);
  }, id ? 'Tarefa atualizada.' : 'Tarefa criada.');
}

export async function setTaskStatusAction(id: string, status: TaskStatus) {
  return withOrg('tasks.manage', async (ctx) => {
    await setTaskStatus(ctx, id, status);
  }, status === 'DONE' ? 'Tarefa concluída.' : undefined);
}

export async function deleteTaskAction(id: string) {
  return withOrg('tasks.manage', (ctx) => deleteTask(ctx, id), 'Tarefa excluída.');
}

export async function saveAppointmentAction(id: string | null, form: FormData) {
  return withOrg('calendar.manage', async (ctx) => {
    const data = formToObject(form) as never;
    if (id) await updateAppointment(ctx, id, data);
    else await createAppointment(ctx, data);
  }, id ? 'Compromisso atualizado.' : 'Compromisso agendado.');
}

export async function setAppointmentStatusAction(id: string, status: 'SCHEDULED' | 'DONE' | 'CANCELED') {
  return withOrg('calendar.manage', async (ctx) => {
    await setAppointmentStatus(ctx, id, status);
  }, 'Compromisso atualizado.');
}
