'use client';

import {
  ArrowRightLeft, Bot, CalendarDays, CheckCircle2, FileText, Mail, MessageCircle, PhoneCall, StickyNote, Tag, UserCheck, UserPlus, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { addNoteAction, logInteractionAction } from '@/app/actions/crm';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { CHANNEL_LABELS } from '@/components/shared/labels';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  kind: 'event' | 'message';
  id: string;
  at: string;
  type?: string;
  title?: string;
  actorType?: string;
  actorName?: string | null;
  body?: string | null;
  channel?: string;
  direction?: string;
  senderType?: string;
  conversationId?: string;
}

const ICONS: Record<string, typeof StickyNote> = {
  note: StickyNote,
  stage_changed: ArrowRightLeft,
  task_created: CheckCircle2,
  followup_created: CheckCircle2,
  task_completed: CheckCircle2,
  appointment: CalendarDays,
  ai_action: Bot,
  handoff: UserCheck,
  assigned: UserCheck,
  lead_created: UserPlus,
  tag_added: Tag,
  tags_changed: Tag,
  interaction: PhoneCall,
  form_submitted: FileText,
};

const ACTOR: Record<string, string> = { AI: 'IA', SYSTEM: 'Sistema', AUTOMATION: 'Automação', CONTACT: 'Cliente' };

export function Timeline({ contactId, items, canWrite }: { contactId: string; items: TimelineEntry[]; canWrite: boolean }) {
  const [tab, setTab] = useState<'note' | 'interaction'>('note');
  const [filter, setFilter] = useState<'all' | 'messages' | 'events'>('all');
  const [text, setText] = useState('');
  const note = useAction((fd: FormData) => addNoteAction(contactId, fd), { onSuccess: () => setText('') });
  const interaction = useAction((fd: FormData) => logInteractionAction(contactId, fd), { onSuccess: () => setText('') });
  const visible = items.filter((i) => filter === 'all' || (filter === 'messages' ? i.kind === 'message' : i.kind === 'event'));

  return (
    <div>
      {canWrite && (
        <form
          action={async (fd) => void (await (tab === 'note' ? note.run(fd) : interaction.run(fd)))}
          className="border-b p-4"
        >
          <div className="mb-2 flex gap-1">
            {(['note', 'interaction'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn('rounded-md px-2.5 py-1 text-xs font-medium', tab === t ? 'bg-brand-soft text-brand' : 'text-fg-muted hover:bg-muted')}
              >
                {t === 'note' ? 'Observação' : 'Registrar interação'}
              </button>
            ))}
          </div>
          {tab === 'interaction' && (
            <Select name="kind" className="mb-2 w-56" aria-label="Tipo de interação">
              <option value="Ligação">Ligação</option>
              <option value="Reunião">Reunião</option>
              <option value="Visita">Visita</option>
              <option value="E-mail externo">E-mail externo</option>
              <option value="WhatsApp pessoal">WhatsApp pessoal</option>
              <option value="Outro">Outro</option>
            </Select>
          )}
          <Textarea name="body" value={text} onChange={(e) => setText(e.target.value)} placeholder={tab === 'note' ? 'Escreva uma observação interna…' : 'Descreva o que foi conversado…'} rows={2} required />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" loading={note.pending || interaction.pending}>Registrar</Button>
          </div>
        </form>
      )}
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-medium text-fg-muted">{visible.length} registro(s)</p>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-8 w-40 text-xs" aria-label="Filtrar timeline">
          <option value="all">Tudo</option>
          <option value="messages">Mensagens</option>
          <option value="events">Atividades</option>
        </Select>
      </div>
      {visible.length === 0 ? (
        <EmptyState title="Nenhum registro ainda" description="Mensagens, mudanças de etapa, tarefas e ações da IA aparecerão aqui." />
      ) : (
        <ol className="relative space-y-4 p-4 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-px before:bg-border">
          {visible.map((i) => {
            if (i.kind === 'message') {
              const inbound = i.direction === 'INBOUND';
              const Icon = i.channel === 'EMAIL' ? Mail : MessageCircle;
              return (
                <li key={i.id} className="relative flex gap-3">
                  <span className={cn('z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ring-4 ring-surface', inbound ? 'bg-info/15 text-info' : 'bg-brand-soft text-brand')}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted">
                      {inbound ? 'Cliente' : i.senderType === 'AI' ? 'IA' : i.actorName ?? 'Equipe'} · {CHANNEL_LABELS[i.channel ?? ''] ?? i.channel} · <Time date={i.at} mode="datetime" />
                    </p>
                    <p className={cn('mt-1 whitespace-pre-wrap rounded-lg px-3 py-2 text-sm', inbound ? 'bg-muted' : 'bg-brand-soft/60')}>{i.body}</p>
                  </div>
                </li>
              );
            }
            const Icon = ICONS[i.type ?? ''] ?? Zap;
            return (
              <li key={i.id} className="relative flex gap-3">
                <span className="z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-fg-muted ring-4 ring-surface">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{i.title}</p>
                  {i.body && <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-bg px-3 py-2 text-sm">{i.body}</p>}
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                    {i.actorType && i.actorType !== 'USER' ? <Badge tone={i.actorType === 'AI' ? 'brand' : 'gray'}>{ACTOR[i.actorType] ?? i.actorType}</Badge> : i.actorName}
                    <span><Time date={i.at} mode="datetime" /></span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
