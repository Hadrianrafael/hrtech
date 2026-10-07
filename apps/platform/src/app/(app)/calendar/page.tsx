import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import type { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/calendar-view';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listAppointments } from '@/server/calendar';
import { contactOptions } from '@/server/contacts';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Agenda' };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('calendar.manage');
  const view = sp.view === 'week' || sp.view === 'day' ? sp.view : 'month';
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : new Date().toISOString().slice(0, 10);
  const d = new Date(`${date}T12:00:00`);
  // Margem de 1 dia em cada ponta para compensar diferenças de fuso entre servidor e navegador.
  const from = addDays(view === 'month' ? startOfWeek(startOfMonth(d)) : view === 'week' ? startOfWeek(d) : d, -1);
  const to = addDays(view === 'month' ? endOfWeek(endOfMonth(d)) : view === 'week' ? endOfWeek(d) : d, 2);
  const [events, members] = await Promise.all([listAppointments(ctx, from, to), getMembers(ctx)]);
  const contacts = await contactOptions(ctx, events.map((e) => e.contactId));
  return (
    <div>
      <PageHeader title="Agenda" description="Reuniões, retornos comerciais, visitas, atendimentos e follow-ups." />
      <CalendarView
        view={view}
        date={date}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        contacts={contacts}
        events={events.map((e) => ({
          id: e.id, title: e.title, type: e.type, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString(), allDay: e.allDay, status: e.status,
          ownerId: e.ownerId, contactId: e.contactId, contactName: e.contact?.name ?? null, description: e.description, location: e.location,
        }))}
      />
    </div>
  );
}
