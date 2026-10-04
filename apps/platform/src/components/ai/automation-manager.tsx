'use client';

import { History, Pencil, Plus, Trash2, Workflow, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { deleteAutomationAction, saveAutomationAction, toggleAutomationAction } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge, Card, EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import type { ActionDef } from '@/server/automations/actions';

interface Cond { field: string; op: string; value?: unknown }
interface Act { type: string; params: Record<string, unknown> }
export interface AutomationRow {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  enabled: boolean;
  conditions: Cond[];
  actions: Act[];
  runCount: number;
  lastRunAt: string | null;
}
export interface RunRow { id: string; automation: string; status: string; error: string | null; createdAt: string; result: { type: string; ok: boolean; detail?: string }[] }

export interface Catalog {
  triggers: Record<string, string>;
  actions: Record<string, ActionDef>;
  fields: Record<string, string>;
  ops: Record<string, string>;
  stages: { key: string; name: string }[];
  members: { id: string; name: string }[];
  tags: string[];
}

export function AutomationManager({ automations, runs, catalog }: { automations: AutomationRow[]; runs: RunRow[]; catalog: Catalog }) {
  const [editing, setEditing] = useState<Partial<AutomationRow> | null>(null);
  const [showRuns, setShowRuns] = useState(false);
  const toggle = useAction((id: string, enabled: boolean) => toggleAutomationAction(id, enabled));
  const del = useAction((id: string) => deleteAutomationAction(id));

  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowRuns(true)}><History className="h-4 w-4" /> Histórico de execuções</Button>
        <Button onClick={() => setEditing({ trigger: 'lead.created', enabled: true, conditions: [], actions: [{ type: 'create_task', params: { title: '', dueInHours: 24, priority: 'MEDIUM', assignee: 'owner' } }] })}>
          <Plus className="h-4 w-4" /> Nova automação
        </Button>
      </div>
      <Card>
        {automations.length === 0 ? (
          <EmptyState icon={<Workflow className="h-5 w-5" />} title="Nenhuma automação" />
        ) : (
          <ul className="divide-y">
            {automations.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Zap className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-fg-muted">
                    <strong className="font-medium text-fg">Quando:</strong> {catalog.triggers[a.trigger] ?? a.trigger}
                    {a.conditions.length > 0 && ` · ${a.conditions.length} condição(ões)`} · <strong className="font-medium text-fg">Então:</strong>{' '}
                    {a.actions.map((x) => catalog.actions[x.type]?.label ?? x.type).join(', ')}
                  </p>
                  <p className="text-[11px] text-fg-muted">{a.runCount} execução(ões){a.lastRunAt ? ` · última $<Time date={a.lastRunAt} />` : ''}</p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" role="switch" checked={a.enabled} onChange={(e) => toggle.run(a.id, e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
                  {a.enabled ? 'Ativa' : 'Inativa'}
                </label>
                <Button size="icon" variant="ghost" onClick={() => setEditing(a)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`Excluir "${a.name}"?`) && del.run(a.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar automação' : 'Nova automação'} size="xl">
        {editing && <Editor key={editing.id ?? 'new'} initial={editing} catalog={catalog} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal open={showRuns} onClose={() => setShowRuns(false)} title="Últimas execuções" size="lg">
        <ul className="divide-y text-sm">
          {runs.map((r) => (
            <li key={r.id} className="py-2.5">
              <div className="flex items-center gap-2">
                <Badge tone={r.status === 'SUCCESS' ? 'green' : r.status === 'FAILED' ? 'red' : 'gray'}>{r.status === 'SUCCESS' ? 'Sucesso' : r.status === 'FAILED' ? 'Falhou' : r.status === 'SKIPPED' ? 'Condições não atendidas' : r.status}</Badge>
                <span className="flex-1 truncate font-medium">{r.automation}</span>
                <span className="text-xs text-fg-muted"><Time date={r.createdAt} mode="datetime" /></span>
              </div>
              {r.result?.length > 0 && <p className="mt-1 text-xs text-fg-muted">{r.result.map((x) => `${catalog.actions[x.type]?.label ?? x.type}: ${x.ok ? 'ok' : 'falhou'}${x.detail ? ` (${x.detail})` : ''}`).join(' · ')}</p>}
              {r.error && <p className="mt-1 text-xs text-danger">{r.error}</p>}
            </li>
          ))}
          {!runs.length && <li className="py-6 text-center text-xs text-fg-muted">Nenhuma execução registrada.</li>}
        </ul>
      </Modal>
    </>
  );
}

function Editor({ initial, catalog, onDone }: { initial: Partial<AutomationRow>; catalog: Catalog; onDone: () => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [trigger, setTrigger] = useState(initial.trigger ?? 'lead.created');
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [conditions, setConditions] = useState<Cond[]>(initial.conditions ?? []);
  const [actions, setActions] = useState<Act[]>(initial.actions ?? []);
  const save = useAction(
    () =>
      saveAutomationAction(initial.id ?? null, {
        name,
        description,
        trigger,
        enabled,
        conditions: conditions.map((c) => ({ ...c, op: c.op as never, value: c.op === 'in' || c.op === 'not_in' ? String(c.value ?? '').split(',').map((s) => s.trim()).filter(Boolean) : c.value })),
        actions,
      }),
    { onSuccess: onDone },
  );
  const setAction = (i: number, a: Act) => setActions((all) => all.map((x, j) => (j === i ? a : x)));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome *"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Descrição"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>

      <section className="rounded-lg border p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-fg-muted">1. Gatilho — quando</p>
        <Select value={trigger} onChange={(e) => setTrigger(e.target.value)} aria-label="Gatilho">
          {Object.entries(catalog.triggers).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </section>

      <section className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-fg-muted">2. Condições — somente se (opcional)</p>
          <Button size="sm" variant="ghost" onClick={() => setConditions((c) => [...c, { field: 'contact.source', op: 'eq', value: '' }])}><Plus className="h-3.5 w-3.5" /> Condição</Button>
        </div>
        {conditions.map((c, i) => (
          <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_160px_1fr_auto]">
            <Select value={c.field} onChange={(e) => setConditions((all) => all.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} aria-label="Campo">
              {Object.entries(catalog.fields).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={c.op} onChange={(e) => setConditions((all) => all.map((x, j) => (j === i ? { ...x, op: e.target.value } : x)))} aria-label="Operador">
              {Object.entries(catalog.ops).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input
              value={Array.isArray(c.value) ? c.value.join(', ') : String(c.value ?? '')}
              onChange={(e) => setConditions((all) => all.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              placeholder={c.op === 'in' || c.op === 'not_in' ? 'valores separados por vírgula' : 'valor'}
              disabled={c.op === 'exists' || c.op === 'not_exists'}
              aria-label="Valor"
            />
            <Button size="icon" variant="ghost" onClick={() => setConditions((all) => all.filter((_, j) => j !== i))} aria-label="Remover condição"><X className="h-4 w-4" /></Button>
          </div>
        ))}
        {!conditions.length && <p className="text-xs text-fg-muted">Sem condições: executa sempre que o gatilho ocorrer.</p>}
        <p className="mt-1 text-[11px] text-fg-muted">Chaves de etapa disponíveis: {catalog.stages.map((s) => `${s.key} (${s.name})`).join(', ')}. Intenções: booking, pricing, purchase, information, support, complaint, human_request.</p>
      </section>

      <section className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-fg-muted">3. Ações — então</p>
          <Button size="sm" variant="ghost" onClick={() => setActions((a) => [...a, { type: 'add_tag', params: {} }])}><Plus className="h-3.5 w-3.5" /> Ação</Button>
        </div>
        <div className="space-y-3">
          {actions.map((a, i) => {
            const def = catalog.actions[a.type];
            return (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <div className="mb-2 flex gap-2">
                  <Select value={a.type} onChange={(e) => setAction(i, { type: e.target.value, params: {} })} aria-label="Ação">
                    {Object.entries(catalog.actions).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => setActions((all) => all.filter((_, j) => j !== i))} aria-label="Remover ação"><X className="h-4 w-4" /></Button>
                </div>
                {def && <p className="mb-2 text-[11px] text-fg-muted">{def.description}</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {def?.params.map((p) => {
                    const v = a.params[p.key];
                    const update = (val: unknown) => setAction(i, { ...a, params: { ...a.params, [p.key]: val } });
                    return (
                      <Field key={p.key} label={p.label + (p.required ? ' *' : '')} className={p.type === 'textarea' || p.key === 'title' ? 'sm:col-span-2' : ''}>
                        {p.type === 'select' ? (
                          <Select value={String(v ?? '')} onChange={(e) => update(e.target.value)}>
                            <option value="">—</option>
                            {p.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Select>
                        ) : p.type === 'stage' ? (
                          <Select value={String(v ?? '')} onChange={(e) => update(e.target.value)}>
                            <option value="">Selecione</option>
                            {catalog.stages.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                          </Select>
                        ) : p.type === 'user' ? (
                          <Select value={String(v ?? '')} onChange={(e) => update(e.target.value)}>
                            <option value="">—</option>
                            {catalog.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </Select>
                        ) : p.type === 'boolean' ? (
                          <Checkbox label="Sim" checked={!!v} onChange={(e) => update(e.target.checked)} />
                        ) : p.type === 'textarea' ? (
                          <Textarea value={String(v ?? '')} onChange={(e) => update(e.target.value)} rows={2} placeholder="Use {{contact.firstName}} para personalizar" />
                        ) : p.type === 'tag' ? (
                          <>
                            <Input list="automation-tags" value={String(v ?? '')} onChange={(e) => update(e.target.value)} />
                            <datalist id="automation-tags">{catalog.tags.map((t) => <option key={t} value={t} />)}</datalist>
                          </>
                        ) : (
                          <Input type={p.type === 'number' ? 'number' : 'text'} value={String(v ?? '')} placeholder={p.placeholder} onChange={(e) => update(p.type === 'number' ? Number(e.target.value) : e.target.value)} />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between border-t pt-3">
        <Checkbox label="Automação ativa" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <Button onClick={() => save.run()} loading={save.pending}>Salvar automação</Button>
      </div>
    </div>
  );
}
