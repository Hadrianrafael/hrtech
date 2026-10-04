'use client';

import { saveTaskAction } from '@/app/actions/work';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useAction } from '@/components/ui/use-action';
import { DateTimeInput } from '@/components/shared/datetime-input';

export interface TaskFormValues {
  id?: string;
  title?: string;
  description?: string | null;
  type?: string;
  priority?: string;
  status?: string;
  dueAt?: string | null;
  assigneeId?: string | null;
  contactId?: string | null;
}

export function TaskForm({
  initial,
  members,
  contacts,
  onDone,
}: {
  initial?: TaskFormValues;
  members: { id: string; name: string }[];
  contacts?: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const { run, pending, fieldErrors } = useAction((fd: FormData) => saveTaskAction(initial?.id ?? null, fd), { onSuccess: onDone });
  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-3">
      <Field label="Título *" error={fieldErrors.title}>
        <Input name="title" defaultValue={initial?.title} required autoFocus />
      </Field>
      <Field label="Descrição">
        <Textarea name="description" defaultValue={initial?.description ?? ''} rows={3} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <Select name="type" defaultValue={initial?.type ?? 'TASK'}>
            <option value="TASK">Tarefa</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select name="priority" defaultValue={initial?.priority ?? 'MEDIUM'}>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </Select>
        </Field>
        <Field label="Prazo">
          <DateTimeInput name="dueAt" defaultValue={initial?.dueAt} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial?.status ?? 'TODO'}>
            <option value="TODO">A fazer</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="DONE">Concluída</option>
            <option value="CANCELED">Cancelada</option>
          </Select>
        </Field>
        <Field label="Responsável">
          <Select name="assigneeId" defaultValue={initial?.assigneeId ?? ''}>
            <option value="">Eu mesmo</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        {contacts ? (
          <Field label="Lead / cliente">
            <Select name="contactId" defaultValue={initial?.contactId ?? ''}>
              <option value="">Nenhum</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <input type="hidden" name="contactId" value={initial?.contactId ?? ''} />
        )}
      </div>
      <div className="flex justify-end border-t pt-3">
        <Button type="submit" loading={pending}>{initial?.id ? 'Salvar tarefa' : 'Criar tarefa'}</Button>
      </div>
    </form>
  );
}
