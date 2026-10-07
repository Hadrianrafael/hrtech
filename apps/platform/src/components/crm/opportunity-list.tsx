'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { createOpportunityAction, moveOpportunityAction } from '@/app/actions/crm';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Badge } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { formatMoney } from '@/lib/utils';

export interface Opp {
  id: string;
  title: string;
  value: number | null;
  status: string;
  stageId: string;
  stageName: string;
  stageColor: string;
  pipelineId: string;
}

export function OpportunityList({
  contactId,
  opportunities,
  stages,
  canWrite,
}: {
  contactId: string;
  opportunities: Opp[];
  stages: { id: string; name: string; pipelineId: string }[];
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const create = useAction(createOpportunityAction, { onSuccess: () => setOpen(false) });
  const move = useAction((id: string, stageId: string) => moveOpportunityAction(id, stageId), { success: 'Etapa atualizada.' });
  return (
    <div>
      <ul className="divide-y">
        {opportunities.map((o) => (
          <li key={o.id} className="space-y-1.5 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{o.title}</p>
              <span className="whitespace-nowrap text-sm tabular-nums">{formatMoney(o.value)}</span>
            </div>
            {canWrite ? (
              <Select
                value={o.stageId}
                onChange={(e) => move.run(o.id, e.target.value)}
                className="h-8 text-xs"
                aria-label="Etapa"
                disabled={move.pending}
              >
                {stages.filter((s) => s.pipelineId === o.pipelineId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            ) : (
              <Badge color={o.stageColor}>{o.stageName}</Badge>
            )}
          </li>
        ))}
        {!opportunities.length && <li className="px-4 py-4 text-xs text-fg-muted">Nenhuma oportunidade.</li>}
      </ul>
      {canWrite && (
        <div className="border-t p-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nova oportunidade
          </Button>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova oportunidade" size="sm">
        <form action={async (fd) => void (await create.run(fd))} className="space-y-3">
          <input type="hidden" name="contactId" value={contactId} />
          <Field label="Título *">
            <Input name="title" required autoFocus />
          </Field>
          <Field label="Valor (R$)">
            <Input name="value" inputMode="decimal" />
          </Field>
          <Field label="Etapa inicial">
            <Select name="stageId">
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={create.pending} className="w-full justify-center">Criar oportunidade</Button>
        </form>
      </Modal>
    </div>
  );
}
