'use client';

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createPipelineAction, deleteStageAction, reorderStagesAction, saveStageAction } from '@/app/actions/crm';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { Badge, Card, CardHeader } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { useRouter } from 'next/navigation';

export interface StageRow {
  id: string;
  name: string;
  key: string | null;
  color: string;
  kind: string;
  probability: number | null;
  defaultOwnerId: string | null;
  requireValue: boolean;
  count: number;
}

const KIND = { OPEN: 'Em andamento', WON: 'Ganho', LOST: 'Perdido' } as const;

export function StageSettings({ pipelineId, stages, members }: { pipelineId: string; stages: StageRow[]; members: { id: string; name: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<StageRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StageRow | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const save = useAction((fd: FormData) => saveStageAction(pipelineId, editing && editing !== 'new' ? editing.id : null, fd), { onSuccess: () => setEditing(null) });
  const reorder = useAction((ids: string[]) => reorderStagesAction(pipelineId, ids));
  const del = useAction(() => deleteStageAction(deleting!.id, moveTo), { onSuccess: () => setDeleting(null) });
  const newPipeline = useAction((name: string) => createPipelineAction(name), { onSuccess: (d) => router.push(`/pipeline/settings?pipeline=${d.id}`) });

  const swap = (i: number, j: number) => {
    const ids = stages.map((s) => s.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void reorder.run(ids);
  };
  const current = editing && editing !== 'new' ? editing : null;

  return (
    <Card>
      <CardHeader
        title="Etapas do funil"
        description="Personalize nomes, ordem, cores, regras e responsáveis padrão de cada etapa."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { const n = prompt('Nome do novo funil'); if (n?.trim()) void newPipeline.run(n.trim()); }}>
              Novo funil
            </Button>
            <Button size="sm" onClick={() => setEditing('new')}><Plus className="h-3.5 w-3.5" /> Etapa</Button>
          </div>
        }
      />
      <ul className="divide-y">
        {stages.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex flex-col">
              <button type="button" disabled={i === 0 || reorder.pending} onClick={() => swap(i, i - 1)} className="rounded p-0.5 text-fg-muted hover:bg-muted disabled:opacity-30" aria-label="Subir">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" disabled={i === stages.length - 1 || reorder.pending} onClick={() => swap(i, i + 1)} className="rounded p-0.5 text-fg-muted hover:bg-muted disabled:opacity-30" aria-label="Descer">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-fg-muted">
                {s.count} oportunidade(s){s.probability !== null ? ` · ${s.probability}% de chance` : ''}
                {s.key ? ` · chave: ${s.key}` : ''}
                {s.defaultOwnerId ? ` · responsável padrão: ${members.find((m) => m.id === s.defaultOwnerId)?.name ?? '—'}` : ''}
                {s.requireValue ? ' · exige valor' : ''}
              </p>
            </div>
            <Badge tone={s.kind === 'WON' ? 'green' : s.kind === 'LOST' ? 'red' : 'gray'}>{KIND[s.kind as keyof typeof KIND]}</Badge>
            <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label={`Editar ${s.name}`}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { setDeleting(s); setMoveTo(stages.find((x) => x.id !== s.id)?.id ?? ''); }} aria-label={`Excluir ${s.name}`} disabled={stages.length <= 2}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={current ? `Editar etapa: ${current.name}` : 'Nova etapa'} size="sm">
        <form key={current?.id ?? 'new'} action={async (fd) => void (await save.run(fd))} className="space-y-3">
          <Field label="Nome *"><Input name="name" defaultValue={current?.name} required autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor"><Input type="color" name="color" defaultValue={current?.color ?? '#6366f1'} className="h-9 p-1" /></Field>
            <Field label="Probabilidade (%)"><Input type="number" name="probability" min={0} max={100} defaultValue={current?.probability ?? ''} /></Field>
          </div>
          <Field label="Tipo da etapa">
            <Select name="kind" defaultValue={current?.kind ?? 'OPEN'}>
              {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Responsável padrão" hint="Atribuído a oportunidades sem responsável que entrarem nesta etapa.">
            <Select name="defaultOwnerId" defaultValue={current?.defaultOwnerId ?? ''}>
              <option value="">Nenhum</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Chave para automações" hint="Ex.: proposal. Usada em condições de automação.">
            <Input name="key" defaultValue={current?.key ?? ''} pattern="[a-z0-9_]*" />
          </Field>
          <Checkbox name="requireValue" label="Exigir valor da oportunidade para entrar nesta etapa" defaultChecked={current?.requireValue} />
          <Button type="submit" loading={save.pending} className="w-full justify-center">Salvar etapa</Button>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={`Excluir etapa "${deleting?.name}"`} size="sm">
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">As {deleting?.count ?? 0} oportunidade(s) desta etapa serão movidas para:</p>
          <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="Etapa de destino">
            {stages.filter((s) => s.id !== deleting?.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Button variant="danger" loading={del.pending} onClick={() => del.run()} className="w-full justify-center">Excluir etapa</Button>
        </div>
      </Modal>
    </Card>
  );
}
