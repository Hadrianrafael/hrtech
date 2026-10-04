'use client';

import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AppointmentForm, APPOINTMENT_TYPES, type AppointmentValues } from '@/components/work/appointment-form';
import { cn } from '@/lib/utils';

export interface CalEvent {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  status: string;
  ownerId: string | null;
  contactId: string | null;
  contactName: string | null;
  description: string | null;
  location: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  MEETING: '#6366f1', CALL: '#0ea5e9', VISIT: '#16a34a', SERVICE: '#f59e0b', FOLLOW_UP: '#ea580c', TASK: '#64748b', RETURN: '#db2777',
};
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07h–21h

export function CalendarView({
  view, date, events, members, contacts,
}: {
  view: 'month' | 'week' | 'day';
  date: string;
  events: CalEvent[];
  members: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const current = new Date(`${date}T12:00:00`);
  const [editing, setEditing] = useState<AppointmentValues | null>(null);
  // Datas dependem do fuso do navegador: renderiza a grade somente no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const nav = (v: string, d: Date) => router.push(`/calendar?view=${v}&date=${format(d, 'yyyy-MM-dd')}`);
  const step = (dir: 1 | -1) => nav(view, view === 'month' ? addMonths(current, dir) : view === 'week' ? addWeeks(current, dir) : addDays(current, dir));
  const eventsOn = (d: Date) => events.filter((e) => isSameDay(new Date(e.startsAt), d)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const openNew = (d: Date, hour?: number) => {
    const s = new Date(d);
    s.setHours(hour ?? 9, 0, 0, 0);
    setEditing({ startsAt: s.toISOString(), endsAt: new Date(s.getTime() + 3600000).toISOString() });
  };
  const openEvent = (e: CalEvent) =>
    setEditing({ id: e.id, title: e.title, type: e.type, startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay, contactId: e.contactId, ownerId: e.ownerId, description: e.description, location: e.location, status: e.status });

  const title =
    view === 'month'
      ? format(current, "MMMM 'de' yyyy", { locale: ptBR })
      : view === 'week'
        ? `${format(startOfWeek(current), 'dd MMM', { locale: ptBR })} – ${format(endOfWeek(current), "dd MMM yyyy", { locale: ptBR })}`
        : format(current, "EEEE, dd 'de' MMMM", { locale: ptBR });

  const Chip = ({ e }: { e: CalEvent }) => (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        openEvent(e);
      }}
      className={cn('w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white', e.status === 'DONE' && 'opacity-60 line-through')}
      style={{ backgroundColor: TYPE_COLORS[e.type] ?? '#64748b' }}
      title={`${e.title}${e.contactName ? ` — ${e.contactName}` : ''}`}
    >
      {!e.allDay && format(new Date(e.startsAt), 'HH:mm')} {e.title}
    </button>
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => step(-1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => nav(view, new Date())}>Hoje</Button>
          <Button size="icon" variant="ghost" onClick={() => step(1)} aria-label="Próximo"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <h2 className="flex-1 text-sm font-semibold first-letter:uppercase">{mounted ? title : ''}</h2>
        <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Visualização">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} type="button" onClick={() => nav(v, current)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium', view === v ? 'bg-brand text-brand-fg' : 'text-fg-muted')}>
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => openNew(current)}><Plus className="h-3.5 w-3.5" /> Novo</Button>
      </div>

      {!mounted && <div className="h-[600px] animate-pulse bg-muted/40" aria-busy="true" />}

      {mounted && view === 'month' && (() => {
        const start = startOfWeek(startOfMonth(current));
        const days = Array.from({ length: Math.ceil((endOfWeek(endOfMonth(current)).getTime() - start.getTime()) / 86400000) }, (_, i) => addDays(start, i));
        return (
          <div className="overflow-x-auto">
            <div className="grid min-w-[640px] grid-cols-7">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => <div key={d} className="border-b px-2 py-1.5 text-center text-xs font-medium text-fg-muted">{d}</div>)}
              {days.map((d) => {
                const list = eventsOn(d);
                return (
                  <div
                    key={d.toISOString()}
                    onClick={() => openNew(d)}
                    className={cn('min-h-[104px] cursor-pointer border-b border-r p-1.5 transition hover:bg-muted/40', !isSameMonth(d, current) && 'bg-muted/30 text-fg-muted')}
                  >
                    <p className={cn('mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs', isToday(d) && 'bg-brand font-semibold text-brand-fg')}>{format(d, 'd')}</p>
                    <div className="space-y-0.5">
                      {list.slice(0, 3).map((e) => <Chip key={e.id} e={e} />)}
                      {list.length > 3 && <p className="text-[10px] text-fg-muted">+{list.length - 3} mais</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {mounted && view !== 'month' && (() => {
        const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(current), i)) : [startOfDay(current)];
        return (
          <div className="overflow-x-auto">
            <div className={cn('grid', view === 'week' ? 'min-w-[760px] grid-cols-[56px_repeat(7,1fr)]' : 'grid-cols-[56px_1fr]')}>
              <div className="border-b" />
              {days.map((d) => (
                <div key={d.toISOString()} className={cn('border-b border-l px-2 py-1.5 text-center text-xs', isToday(d) && 'font-semibold text-brand')}>
                  {format(d, view === 'week' ? 'EEE dd' : "EEEE dd/MM", { locale: ptBR })}
                  <div className="mt-1 space-y-0.5">{eventsOn(d).filter((e) => e.allDay).map((e) => <Chip key={e.id} e={e} />)}</div>
                </div>
              ))}
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="h-14 border-b pr-1 pt-0.5 text-right text-[10px] text-fg-muted">{String(h).padStart(2, '0')}:00</div>
                  {days.map((d) => {
                    const list = eventsOn(d).filter((e) => !e.allDay && new Date(e.startsAt).getHours() === h);
                    return (
                      <div key={d.toISOString() + h} onClick={() => openNew(d, h)} className="h-14 cursor-pointer space-y-0.5 overflow-hidden border-b border-l p-0.5 hover:bg-muted/40">
                        {list.map((e) => <Chip key={e.id} e={e} />)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-wrap gap-3 border-t px-3 py-2 text-[11px] text-fg-muted">
        {Object.entries(APPOINTMENT_TYPES).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: TYPE_COLORS[k] }} /> {v}</span>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Compromisso' : 'Novo compromisso'}>
        {editing && <AppointmentForm key={editing.id ?? editing.startsAt} initial={editing} members={members} contacts={contacts} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
