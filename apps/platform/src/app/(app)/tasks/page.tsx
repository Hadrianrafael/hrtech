import type { Metadata } from 'next';
import Link from 'next/link';
import { TaskList } from '@/components/work/task-list';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import { listTasks } from '@/server/tasks';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Tarefas' };

const VIEWS = [
  { key: 'open', label: 'Pendentes' },
  { key: 'mine', label: 'Minhas' },
  { key: 'today', label: 'Até hoje' },
  { key: 'overdue', label: 'Atrasadas' },
  { key: 'followup', label: 'Follow-ups' },
  { key: 'all', label: 'Todas' },
];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.key === sp.view) ? sp.view! : 'open';
  const ctx = await requirePageContext('tasks.manage');
  const [tasks, members, contacts, overdue] = await Promise.all([
    listTasks(ctx, { view }),
    getMembers(ctx),
    ctx.db.contact.findMany({ where: { anonymizedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 500 }),
    listTasks(ctx, { view: 'overdue' }),
  ]);
  return (
    <div>
      <PageHeader title="Tarefas e follow-ups" description={`${overdue.length} tarefa(s) atrasada(s)`} />
      <nav className="mb-3 flex gap-1 overflow-x-auto" aria-label="Visões">
        {VIEWS.map((v) => (
          <Link key={v.key} href={`/tasks?view=${v.key}`} className={cn('whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium', view === v.key ? 'bg-brand text-brand-fg' : 'bg-surface text-fg-muted ring-1 ring-border hover:text-fg')}>
            {v.label}
            {v.key === 'overdue' && overdue.length > 0 && <span className="ml-1 rounded-full bg-danger px-1.5 text-[10px] text-white">{overdue.length}</span>}
          </Link>
        ))}
      </nav>
      <TaskList
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        contacts={contacts}
        tasks={tasks.map((t) => ({
          id: t.id, title: t.title, description: t.description, type: t.type, priority: t.priority, status: t.status, dueAt: t.dueAt?.toISOString() ?? null,
          assigneeId: t.assigneeId, contactId: t.contactId, contactName: t.contact?.name ?? null, source: t.source,
        }))}
      />
    </div>
  );
}
