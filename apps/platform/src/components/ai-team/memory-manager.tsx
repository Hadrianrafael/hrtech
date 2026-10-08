'use client';

import { Bot, Brain, Building2, ExternalLink, Pencil, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { createMemoryAction, deleteMemoryAction, updateMemoryAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader, EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';

// ─────────────── Tipos (dados simples e serializáveis vindos da página) ───────────────

export interface MemoryRow {
  id: string;
  agentId: string | null;
  scope: 'COMPANY' | 'AGENT';
  kind: string;
  title: string | null;
  content: string;
  /** USER (orientação da equipe), SYSTEM ou AGENT (escrita por agente: tratada como dado). */
  source: string;
  importance: number;
  pinned: boolean;
  sourceTaskId: string | null;
  expired: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryAgent {
  id: string;
  name: string;
}

export interface MemoryKind {
  key: string;
  label: string;
}

type MemoryKindKey = NonNullable<Parameters<typeof createMemoryAction>[0]['kind']>;

const CONTENT_MAX = 2000;
const TITLE_MAX = 120;

const IMPORTANCE_OPTIONS = [
  { value: 1, label: '1 — baixa' },
  { value: 2, label: '2' },
  { value: 3, label: '3 — média' },
  { value: 4, label: '4' },
  { value: 5, label: '5 — máxima' },
];

const SOURCE_FILTERS = [
  { key: 'all', label: 'Todas as origens' },
  { key: 'team', label: 'Escritas pela equipe' },
  { key: 'agent', label: 'Escritas por agentes' },
] as const;

type SourceFilter = (typeof SOURCE_FILTERS)[number]['key'];

function SourceBadge({ source }: { source: string }) {
  if (source === 'AGENT') {
    return (
      <Badge tone="yellow" className="cursor-help">
        <span title="Registrada por um agente: entra no contexto como dado, não como instrução.">
          <Bot className="mr-0.5 inline h-3 w-3 align-[-2px]" aria-hidden />
          escrita por agente
        </span>
      </Badge>
    );
  }
  if (source === 'SYSTEM') return <Badge tone="gray">Sistema</Badge>;
  return <Badge tone="green">Equipe</Badge>;
}

function ImportanceDots({ value }: { value: number }) {
  const v = Math.min(Math.max(Math.round(value), 1), 5);
  return (
    <span className="inline-flex items-center gap-0.5" title={`Importância ${v} de 5`} aria-label={`Importância ${v} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={cn('h-1.5 w-1.5 rounded-full', i <= v ? 'bg-brand' : 'bg-muted')} />
      ))}
    </span>
  );
}

export function MemoryManager({ memories, agents, kinds, canManage }: { memories: MemoryRow[]; agents: MemoryAgent[]; kinds: MemoryKind[]; canManage: boolean }) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MemoryRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pin = useAction((id: string, pinned: boolean) => updateMemoryAction(id, { pinned }));
  const del = useAction((id: string) => deleteMemoryAction(id));

  const kindLabel = useMemo(() => new Map(kinds.map((k) => [k.key, k.label])), [kinds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return memories.filter((m) => {
      if (source === 'agent' && m.source !== 'AGENT') return false;
      if (source === 'team' && m.source === 'AGENT') return false;
      if (!q) return true;
      return `${m.title ?? ''} ${m.content}`.toLocaleLowerCase('pt-BR').includes(q);
    });
  }, [memories, query, source]);

  const company = filtered.filter((m) => m.scope === 'COMPANY');
  const byAgent = useMemo(() => {
    const scoped = filtered.filter((m) => m.scope === 'AGENT');
    const groups = agents.map((a) => ({ id: a.id, name: a.name, items: scoped.filter((m) => m.agentId === a.id) })).filter((g) => g.items.length > 0);
    const known = new Set(agents.map((a) => a.id));
    const orphans = scoped.filter((m) => !m.agentId || !known.has(m.agentId));
    if (orphans.length) groups.push({ id: '__removed', name: 'Agente removido', items: orphans });
    return groups;
  }, [filtered, agents]);

  const total = memories.length;
  const pinnedCount = memories.filter((m) => m.pinned).length;
  const agentWritten = memories.filter((m) => m.source === 'AGENT').length;

  const togglePin = async (m: MemoryRow) => {
    setBusyId(m.id);
    await pin.run(m.id, !m.pinned);
    setBusyId(null);
  };
  const remove = async (m: MemoryRow) => {
    if (!confirm(`Excluir a memória${m.title ? ` "${m.title}"` : ''}? Os agentes deixarão de considerá-la.`)) return;
    setBusyId(m.id);
    await del.run(m.id);
    setBusyId(null);
  };

  const itemProps = { kindLabel, canManage, busyId, onTogglePin: togglePin, onEdit: setEditing, onDelete: remove };

  return (
    <div className="space-y-5">
      <Alert tone="blue" title="Diretrizes x dados">
        Memórias escritas por <strong>pessoas da equipe</strong> valem como diretrizes da empresa e orientam os agentes. Memórias{' '}
        <strong>escritas por agentes</strong> são tratadas como <strong>dados, não como instruções</strong> — podem ter vindo de mensagens, sites ou documentos
        externos. Ao revisar e salvar uma delas, ela passa a valer como diretriz.
      </Alert>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nas memórias" aria-label="Buscar nas memórias" className="pl-9" type="search" />
        </div>
        <Select value={source} onChange={(e) => setSource(e.target.value as SourceFilter)} aria-label="Filtrar por origem" className="sm:w-56">
          {SOURCE_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Nova memória
          </Button>
        )}
      </div>

      <p className="text-xs text-fg-muted">
        {total} memória(s) · {pinnedCount} fixada(s) · {agentWritten} escrita(s) por agentes
        {filtered.length !== total && ` · ${filtered.length} exibida(s) pelo filtro`}
      </p>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-fg-muted" aria-hidden /> Empresa
            </span>
          }
          description="Valem para todos os agentes."
        />
        {company.length === 0 ? (
          <EmptyState
            icon={<Brain className="h-5 w-5" />}
            title={total === 0 ? 'Nenhuma memória registrada' : 'Nenhuma memória da empresa neste filtro'}
            description={
              total === 0
                ? 'Registre fatos, preferências e metas da empresa — por exemplo, o perfil de cliente ideal, o tom de voz e as regras de desconto.'
                : undefined
            }
            action={
              canManage && total === 0 ? (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Registrar a primeira
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y">
            {company.map((m) => (
              <MemoryItem key={m.id} memory={m} {...itemProps} />
            ))}
          </ul>
        )}
      </Card>

      <section aria-labelledby="memory-by-agent" className="space-y-3">
        <h2 id="memory-by-agent" className="flex items-center gap-1.5 text-sm font-semibold">
          <Bot className="h-4 w-4 text-fg-muted" aria-hidden /> Por agente
        </h2>
        {byAgent.length === 0 ? (
          <Card>
            <p className="px-4 py-8 text-center text-xs text-fg-muted">Nenhuma memória específica de agente{filtered.length !== total ? ' neste filtro' : ''}.</p>
          </Card>
        ) : (
          byAgent.map((g) => (
            <Card key={g.id}>
              <CardHeader title={g.name} description={`${g.items.length} memória(s) usadas somente por este agente.`} />
              <ul className="divide-y">
                {g.items.map((m) => (
                  <MemoryItem key={m.id} memory={m} {...itemProps} />
                ))}
              </ul>
            </Card>
          ))
        )}
      </section>

      {canManage && (
        <>
          <Modal open={creating} onClose={() => setCreating(false)} title="Nova memória" description="Orientação da empresa para a Equipe IA." size="lg">
            {creating && <CreateMemoryForm agents={agents} kinds={kinds} onDone={() => setCreating(false)} />}
          </Modal>
          <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar memória" size="lg">
            {editing && <EditMemoryForm key={editing.id} memory={editing} onDone={() => setEditing(null)} />}
          </Modal>
        </>
      )}
    </div>
  );
}

function MemoryItem({
  memory: m,
  kindLabel,
  canManage,
  busyId,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  memory: MemoryRow;
  kindLabel: Map<string, string>;
  canManage: boolean;
  busyId: string | null;
  onTogglePin: (m: MemoryRow) => void;
  onEdit: (m: MemoryRow) => void;
  onDelete: (m: MemoryRow) => void;
}) {
  const busy = busyId === m.id;
  return (
    <li className={cn('flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start', m.expired && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {m.pinned && (
            <Badge tone="brand">
              <Pin className="h-3 w-3" aria-hidden /> Fixada
            </Badge>
          )}
          <Badge tone="blue">{kindLabel.get(m.kind) ?? m.kind}</Badge>
          <SourceBadge source={m.source} />
          {m.expired && <Badge tone="gray">Expirada</Badge>}
        </div>
        {m.title && <p className="mt-1 break-words text-sm font-medium">{m.title}</p>}
        <p className={cn('whitespace-pre-wrap break-words text-sm', m.title ? 'mt-0.5 text-fg-muted' : 'mt-1')}>{m.content}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
          <ImportanceDots value={m.importance} />
          <span>
            Atualizada <Time date={m.updatedAt} />
          </span>
          {m.expiresAt && (
            <span>
              {m.expired ? 'Expirou' : 'Expira'} <Time date={m.expiresAt} mode="date" />
            </span>
          )}
          {m.sourceTaskId && (
            <Link href={`/ai-team/tasks/${m.sourceTaskId}`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
              <ExternalLink className="h-3 w-3" aria-hidden /> Tarefa de origem
            </Link>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onTogglePin(m)}
            disabled={busy}
            aria-label={m.pinned ? 'Desafixar memória' : 'Fixar memória'}
            aria-pressed={m.pinned}
            title={m.pinned ? 'Desafixar' : 'Fixar (sempre considerada primeiro)'}
          >
            {m.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(m)} disabled={busy} aria-label="Editar memória" title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(m)} disabled={busy} aria-label="Excluir memória" title="Excluir" className="hover:text-danger">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </li>
  );
}

function CreateMemoryForm({ agents, kinds, onDone }: { agents: MemoryAgent[]; kinds: MemoryKind[]; onDone: () => void }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(kinds[0]?.key ?? 'FACT');
  const [agentId, setAgentId] = useState('');
  const [pinned, setPinned] = useState(false);
  const [importance, setImportance] = useState(3);
  const create = useAction(createMemoryAction, { onSuccess: onDone });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void create.run({
      content: content.trim(),
      title: title.trim() || null,
      kind: kind as MemoryKindKey,
      agentId: agentId || null,
      pinned,
      importance,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Conteúdo" htmlFor="memory-content" error={create.fieldErrors.content} hint={`${content.length}/${CONTENT_MAX} caracteres`}>
        <Textarea
          id="memory-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={CONTENT_MAX}
          rows={5}
          required
          minLength={3}
          placeholder="Ex.: Nosso cliente ideal são pousadas e hotéis pequenos do litoral, com 10 a 40 quartos."
        />
      </Field>
      <Field label="Título (opcional)" htmlFor="memory-title" error={create.fieldErrors.title}>
        <Input id="memory-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} placeholder="Ex.: Perfil de cliente ideal" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tipo" htmlFor="memory-kind" error={create.fieldErrors.kind}>
          <Select id="memory-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vale para" htmlFor="memory-agent" error={create.fieldErrors.agentId}>
          <Select id="memory-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Toda a empresa</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                Somente {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Importância" htmlFor="memory-importance" error={create.fieldErrors.importance}>
          <Select id="memory-importance" value={importance} onChange={(e) => setImportance(Number(e.target.value))}>
            {IMPORTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Checkbox label="Fixar (sempre considerada primeiro pelos agentes)" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
      <p className="text-xs text-fg-muted">Não registre senhas, tokens ou dados sensíveis de clientes: a memória entra no contexto enviado ao provedor de IA.</p>
      <div className="flex justify-end gap-2 border-t pt-3">
        <Button variant="ghost" onClick={onDone} disabled={create.pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={create.pending} disabled={content.trim().length < 3}>
          Registrar memória
        </Button>
      </div>
    </form>
  );
}

function EditMemoryForm({ memory, onDone }: { memory: MemoryRow; onDone: () => void }) {
  const [content, setContent] = useState(memory.content);
  const [title, setTitle] = useState(memory.title ?? '');
  const [importance, setImportance] = useState(Math.min(Math.max(memory.importance, 1), 5));
  const [promote, setPromote] = useState(false);
  const save = useAction((input: { content?: string; title?: string | null; importance?: number }) => updateMemoryAction(memory.id, input), { onSuccess: onDone });

  const fromAgent = memory.source === 'AGENT';
  const contentChanged = content.trim() !== memory.content.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input: { content?: string; title?: string | null; importance?: number } = { title: title.trim() || null, importance };
    // Enviar o conteúdo marca a memória como revisada por uma pessoa (passa a valer como diretriz).
    if (contentChanged || (fromAgent && promote)) input.content = content.trim();
    void save.run(input);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {fromAgent && (
        <Alert tone="yellow" title="Memória escrita por um agente">
          Hoje ela é tratada como dado, não como instrução. Se você alterar o conteúdo — ou marcar a opção abaixo — ela passa a valer como diretriz da
          empresa. Revise com atenção: o texto pode ter vindo de mensagens, sites ou documentos externos.
        </Alert>
      )}
      <Field label="Conteúdo" htmlFor="memory-edit-content" error={save.fieldErrors.content} hint={`${content.length}/${CONTENT_MAX} caracteres`}>
        <Textarea id="memory-edit-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={CONTENT_MAX} rows={6} required minLength={3} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Field label="Título (opcional)" htmlFor="memory-edit-title" error={save.fieldErrors.title}>
          <Input id="memory-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} />
        </Field>
        <Field label="Importância" htmlFor="memory-edit-importance" error={save.fieldErrors.importance}>
          <Select id="memory-edit-importance" value={importance} onChange={(e) => setImportance(Number(e.target.value))}>
            {IMPORTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {fromAgent && !contentChanged && (
        <Checkbox label="Revisei o conteúdo e quero que valha como diretriz da empresa" checked={promote} onChange={(e) => setPromote(e.target.checked)} />
      )}
      <div className="flex justify-end gap-2 border-t pt-3">
        <Button variant="ghost" onClick={onDone} disabled={save.pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.pending} disabled={content.trim().length < 3}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
