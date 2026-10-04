'use client';

import { useState } from 'react';
import { saveAppointmentAction, setAppointmentStatusAction } from '@/app/actions/work';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { useAction } from '@/components/ui/use-action';
import { DateTimeInput } from '@/components/shared/datetime-input';

export const APPOINTMENT_TYPES: Record<string, string> = {
  MEETING: 'Reunião',
  CALL: 'Ligação / retorno',
  VISIT: 'Visita',
  SERVICE: 'Atendimento',
  FOLLOW_UP: 'Follow-up',
  TASK: 'Tarefa',
  RETURN: 'Retorno comercial',
};

export interface AppointmentValues {
  id?: string;
  title?: string;
  type?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  contactId?: string | null;
  ownerId?: string | null;
  status?: string;
}

export function AppointmentForm({
  initial,
  members,
  contacts,
  onDone,
}: {
  initial?: AppointmentValues;
  members: { id: string; name: string }[];
  contacts?: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const defaultStart = initial?.startsAt ?? (() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString();
  })();
  const [start, setStart] = useState(defaultStart);
  const [endKey, setEndKey] = useState(0);
  const [end, setEnd] = useState(initial?.endsAt ?? new Date(new Date(defaultStart).getTime() + 3600000).toISOString());
  const { run, pending, fieldErrors } = useAction((fd: FormData) => saveAppointmentAction(initial?.id ?? null, fd), { onSuccess: onDone });
  const status = useAction((s: 'DONE' | 'CANCELED' | 'SCHEDULED') => setAppointmentStatusAction(initial!.id!, s), { onSuccess: onDone });

  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-3">
      <Field label="Título *" error={fieldErrors.title}>
        <Input name="title" defaultValue={initial?.title} required autoFocus />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <Select name="type" defaultValue={initial?.type ?? 'MEETING'}>
            {Object.entries(APPOINTMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Responsável">
          <Select name="ownerId" defaultValue={initial?.ownerId ?? ''}>
            <option value="">Eu mesmo</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Início *" error={fieldErrors.startsAt}>
          <DateTimeInput
            name="startsAt"
            defaultValue={start}
            required
            onChange={(iso) => {
              const dur = new Date(end).getTime() - new Date(start).getTime();
              setStart(iso);
              setEnd(new Date(new Date(iso).getTime() + Math.max(dur, 1800000)).toISOString());
              setEndKey((k) => k + 1);
            }}
          />
        </Field>
        <Field label="Fim *" error={fieldErrors.endsAt}>
          <DateTimeInput key={endKey} name="endsAt" defaultValue={end} required onChange={setEnd} />
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
        <Field label="Local / link">
          <Input name="location" defaultValue={initial?.location ?? ''} />
        </Field>
      </div>
      <Field label="Descrição">
        <Textarea name="description" defaultValue={initial?.description ?? ''} rows={3} />
      </Field>
      <Checkbox name="allDay" label="Dia inteiro" defaultChecked={initial?.allDay} />
      <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
        <div className="flex gap-2">
          {initial?.id && initial.status === 'SCHEDULED' && (
            <>
              <Button variant="outline" size="sm" loading={status.pending} onClick={() => status.run('DONE')}>Marcar como realizado</Button>
              <Button variant="ghost" size="sm" onClick={() => status.run('CANCELED')}>Cancelar compromisso</Button>
            </>
          )}
        </div>
        <Button type="submit" loading={pending}>{initial?.id ? 'Salvar' : 'Agendar'}</Button>
      </div>
    </form>
  );
}
