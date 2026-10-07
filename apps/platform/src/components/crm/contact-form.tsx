'use client';

import { useState } from 'react';
import { createContactAction, updateContactAction } from '@/app/actions/crm';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { useAction } from '@/components/ui/use-action';
import { DateTimeInput } from '@/components/shared/datetime-input';
import { cn, moneyInputValue } from '@/lib/utils';

export interface ContactFormData {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  companyName?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string;
  status?: string;
  kind?: string;
  ownerId?: string | null;
  potentialValue?: number | null;
  interest?: string | null;
  notes?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  customFields?: Record<string, string>;
  tagIds?: string[];
  consentAt?: string | null;
}

export interface FormOptions {
  members: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
  statuses: Record<string, string>;
  sources: Record<string, string>;
  hospitality: boolean;
}

export function ContactForm({ initial, options, onDone }: { initial?: ContactFormData; options: FormOptions; onDone?: (id: string) => void }) {
  const editing = !!initial?.id;
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const create = useAction(createContactAction, { onSuccess: (d) => onDone?.(d.id) });
  const update = useAction((fd: FormData) => updateContactAction(initial!.id!, fd), { onSuccess: () => onDone?.(initial!.id!) });
  const { run, pending, fieldErrors } = editing ? update : create;
  const cf = initial?.customFields ?? {};

  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-4">
      <input type="hidden" name="__tags" value="1" />
      {tagIds.map((t) => (
        <input key={t} type="hidden" name="tagIds" value={t} />
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome *" error={fieldErrors.name} className="sm:col-span-2">
          <Input name="name" defaultValue={initial?.name} required autoFocus={!editing} />
        </Field>
        <Field label="E-mail" error={fieldErrors.email}>
          <Input name="email" type="email" defaultValue={initial?.email ?? ''} />
        </Field>
        <Field label="Telefone" error={fieldErrors.phone}>
          <Input name="phone" defaultValue={initial?.phone ?? ''} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="WhatsApp" hint="Se vazio, usa o telefone.">
          <Input name="whatsapp" defaultValue={initial?.whatsapp ?? ''} />
        </Field>
        <Field label="Instagram">
          <Input name="instagram" defaultValue={initial?.instagram ?? ''} placeholder="@usuario" />
        </Field>
        <Field label="Empresa">
          <Input name="companyName" defaultValue={initial?.companyName ?? ''} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Cidade" className="col-span-2">
            <Input name="city" defaultValue={initial?.city ?? ''} />
          </Field>
          <Field label="UF">
            <Input name="state" defaultValue={initial?.state ?? ''} maxLength={2} className="uppercase" />
          </Field>
        </div>
        <Field label="Origem">
          <Select name="source" defaultValue={initial?.source ?? 'manual'}>
            {Object.entries(options.sources).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial?.status ?? 'NEW'}>
            {Object.entries(options.statuses).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo">
          <Select name="kind" defaultValue={initial?.kind ?? 'LEAD'}>
            <option value="LEAD">Lead</option>
            <option value="CUSTOMER">Cliente</option>
          </Select>
        </Field>
        <Field label="Responsável">
          <Select name="ownerId" defaultValue={initial?.ownerId ?? ''}>
            <option value="">Sem responsável</option>
            {options.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Valor potencial (R$)" error={fieldErrors.potentialValue}>
          <Input name="potentialValue" inputMode="decimal" defaultValue={moneyInputValue(initial?.potentialValue)} placeholder="0,00" />
        </Field>
        <Field label="Interesse / serviço">
          <Input name="interest" defaultValue={initial?.interest ?? ''} />
        </Field>
        <Field label="Próxima ação (data)">
          <DateTimeInput name="nextActionAt" defaultValue={initial?.nextActionAt} />
        </Field>
        <Field label="Próxima ação (descrição)">
          <Input name="nextActionNote" defaultValue={initial?.nextActionNote ?? ''} />
        </Field>
      </div>

      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-xs font-medium text-fg-muted">{options.hospitality ? 'Hospedagem' : 'Detalhes da oportunidade'}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.hospitality ? (
            <>
              <Field label="Check-in"><Input type="date" name="cf_checkIn" defaultValue={cf.checkIn ?? ''} /></Field>
              <Field label="Check-out"><Input type="date" name="cf_checkOut" defaultValue={cf.checkOut ?? ''} /></Field>
              <Field label="Nº de hóspedes"><Input name="cf_guests" inputMode="numeric" defaultValue={cf.guests ?? ''} /></Field>
              <Field label="Tipo de acomodação"><Input name="cf_roomType" defaultValue={cf.roomType ?? ''} /></Field>
            </>
          ) : (
            <>
              <Field label="Serviço"><Input name="cf_service" defaultValue={cf.service ?? ''} /></Field>
              <Field label="Orçamento"><Input name="cf_budget" defaultValue={cf.budget ?? ''} /></Field>
              <Field label="Data desejada"><Input type="date" name="cf_desiredDate" defaultValue={cf.desiredDate ?? ''} /></Field>
            </>
          )}
        </div>
      </fieldset>

      {options.tags.length > 0 && (
        <div>
          <p className="label">Etiquetas</p>
          <div className="flex flex-wrap gap-1.5">
            {options.tags.map((t) => {
              const on = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTagIds((v) => (on ? v.filter((x) => x !== t.id) : [...v, t.id]))}
                  className={cn('rounded-full border px-2.5 py-0.5 text-xs transition', on ? 'border-transparent text-white' : 'text-fg-muted hover:text-fg')}
                  style={on ? { backgroundColor: t.color } : undefined}
                  aria-pressed={on}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="Observações">
        <Textarea name="notes" defaultValue={initial?.notes ?? ''} rows={3} />
      </Field>
      {!initial?.consentAt && <Checkbox name="consent" label="O contato autorizou o tratamento dos dados (LGPD)" />}

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button type="submit" loading={pending}>{editing ? 'Salvar alterações' : 'Cadastrar lead'}</Button>
      </div>
    </form>
  );
}
