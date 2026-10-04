'use client';

import { GripVertical, MoreVertical, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { moveOpportunityAction } from '@/app/actions/crm';
import { Button, buttonClass } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Avatar, Badge } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Time } from '@/components/shared/time';
import { cn, formatMoney } from '@/lib/utils';

export interface KanbanStage {
  id: string;
  name: string;
  color: string;
  kind: string;
  probability: number | null;
  /** Totais da etapa no banco (o quadro carrega um número limitado de cartões por etapa). */
  count: number;
  value: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  ownerId: string | null;
  contactId: string;
  contactName: string;
  stageChangedAt: string;
  tags: { name: string; color: string }[];
}

export function KanbanBoard({
  pipelines,
  pipelineId,
  stages,
  cards: initialCards,
  members,
  canMove,
  canConfigure,
}: {
  pipelines: { id: string; name: string }[];
  pipelineId: string;
  stages: KanbanStage[];
  cards: KanbanCard[];
  members: { id: string; name: string }[];
  canMove: boolean;
  canConfigure: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [cards, setCards] = useState(initialCards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [lostPrompt, setLostPrompt] = useState<{ cardId: string; stageId: string } | null>(null);
  const [lostReason, setLostReason] = useState('');
  useEffect(() => setCards(initialCards), [initialCards]);
  const names = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  const move = async (cardId: string, stageId: string, reason?: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stageId === stageId) return;
    const stage = stages.find((s) => s.id === stageId);
    if (stage?.kind === 'LOST' && reason === undefined) {
      setLostPrompt({ cardId, stageId });
      return;
    }
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, stageId, stageChangedAt: new Date().toISOString() } : c)));
    const r = await moveOpportunityAction(cardId, stageId, reason);
    if (!r.ok) {
      setCards(prev);
      toast.error(r.error);
    } else {
      toast.success(`Movido para "${stage?.name}"`);
      router.refresh();
    }
  };

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.push(`/pipeline?${p.toString()}`);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {pipelines.length > 1 && (
          <Select value={pipelineId} onChange={(e) => setParam('pipeline', e.target.value)} className="h-8 w-48 text-xs" aria-label="Funil">
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        )}
        <Select value={sp.get('owner') ?? ''} onChange={(e) => setParam('owner', e.target.value)} className="h-8 w-48 text-xs" aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          <option value="none">Sem responsável</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', String(new FormData(e.currentTarget).get('q') ?? ''));
          }}
        >
          <Input name="q" defaultValue={sp.get('q') ?? ''} placeholder="Buscar oportunidade…" className="h-8 w-56 text-xs" aria-label="Buscar" />
        </form>
        <div className="flex-1" />
        {canConfigure && (
          <Link href={`/pipeline/settings?pipeline=${pipelineId}`} className={buttonClass('outline', 'sm')}>
            <Settings2 className="h-3.5 w-3.5" /> Configurar etapas
          </Link>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex min-h-[60vh] gap-3">
          {stages.map((stage) => {
            const list = cards.filter((c) => c.stageId === stage.id);
            // Totais do servidor + o efeito das movimentações otimistas ainda não recarregadas.
            const loaded = initialCards.filter((c) => c.stageId === stage.id);
            const sum = (cs: KanbanCard[]) => cs.reduce((s, c) => s + (c.value ?? 0), 0);
            const count = Math.max(list.length, stage.count + list.length - loaded.length);
            const total = stage.value + sum(list) - sum(loaded);
            const hidden = count - list.length;
            return (
              <section
                key={stage.id}
                aria-label={stage.name}
                onDragOver={(e) => {
                  if (!canMove) return;
                  e.preventDefault();
                  setOverStage(stage.id);
                }}
                onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverStage(null);
                  const id = e.dataTransfer.getData('text/plain') || dragId;
                  if (id) void move(id, stage.id);
                }}
                className={cn('flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition', overStage === stage.id && 'border-brand bg-brand-soft/40')}
              >
                <header className="border-b px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h2 className="flex-1 truncate text-sm font-semibold">{stage.name}</h2>
                    <span className="rounded-full bg-surface px-2 text-xs text-fg-muted">{count}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">{formatMoney(total)}{stage.probability !== null ? ` · ${stage.probability}%` : ''}</p>
                </header>
                <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
                  {list.map((card) => (
                    <article
                      key={card.id}
                      draggable={canMove}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', card.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragId(card.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className={cn('group rounded-lg border bg-surface p-3 shadow-card transition', canMove && 'cursor-grab active:cursor-grabbing', dragId === card.id && 'opacity-50')}
                    >
                      <div className="flex items-start gap-1.5">
                        {canMove && <GripVertical className="mt-0.5 hidden h-4 w-4 shrink-0 text-fg-muted sm:block" aria-hidden />}
                        <div className="min-w-0 flex-1">
                          <Link href={`/contacts/${card.contactId}`} className="block text-sm font-medium leading-snug hover:text-brand">
                            {card.title}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-fg-muted">{card.contactName}</p>
                        </div>
                        {canMove && <CardMenu stages={stages} current={card.stageId} onMove={(sid) => move(card.id, sid)} />}
                      </div>
                      {card.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.tags.slice(0, 3).map((t) => <Badge key={t.name} color={t.color}>{t.name}</Badge>)}
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-medium tabular-nums">{formatMoney(card.value)}</span>
                        <span className="flex items-center gap-1.5 text-fg-muted">
                          <Time date={card.stageChangedAt} />
                          {card.ownerId && <Avatar name={names.get(card.ownerId) ?? '?'} size={20} />}
                        </span>
                      </div>
                    </article>
                  ))}
                  {!list.length && <p className="px-2 py-6 text-center text-xs text-fg-muted">Arraste oportunidades para cá</p>}
                  {hidden > 0 && (
                    <p className="px-2 py-3 text-center text-xs text-fg-muted">
                      + {hidden} não exibida(s). Use a busca ou o filtro de responsável para encontrá-las.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Modal open={!!lostPrompt} onClose={() => setLostPrompt(null)} title="Motivo da perda" size="sm">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (lostPrompt) void move(lostPrompt.cardId, lostPrompt.stageId, lostReason.trim() || 'Não informado');
            setLostPrompt(null);
            setLostReason('');
          }}
        >
          <Field label="Por que a oportunidade foi perdida?">
            <Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Ex.: preço, concorrência, sem retorno…" autoFocus />
          </Field>
          <Button type="submit" className="w-full justify-center">Confirmar</Button>
        </form>
      </Modal>
    </div>
  );
}

function CardMenu({ stages, current, onMove }: { stages: KanbanStage[]; current: string; onMove: (stageId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="rounded p-0.5 text-fg-muted hover:bg-muted" aria-label="Mover para etapa">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border bg-surface p-1 shadow-pop" onMouseLeave={() => setOpen(false)}>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase text-fg-muted">Mover para</p>
          {stages.filter((s) => s.id !== current).map((s) => (
            <button key={s.id} type="button" onClick={() => (setOpen(false), onMove(s.id))} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
