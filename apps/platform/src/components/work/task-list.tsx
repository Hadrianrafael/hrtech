'use client';

import { AlertTriangle, Circle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteTaskAction, setTaskStatusAction } from '@/app/actions/work';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { TaskForm, type TaskFormValues } from './task-form';

export interface TaskRow extends TaskFormValues {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  source: string;
  contactName: string | null;
}

const PRIORITY: Record<string, { label: string; tone: 'gray' | 'blue' | 'yellow' | 'red' }> = {
  LOW: { label: 'Baixa', tone: 'gray' }, MEDIUM: { label: 'Média', tone: 'blue' }, HIGH: { label: 'Alta', tone: 'yellow' }, URGENT: { label: 'Urgente', tone: 'red' },
};

export function TaskList({ tasks, members, contacts }: { tasks: TaskRow[]; members: { id: string; name: string }[]; contacts: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState<TaskFormValues | null>(null);
  const toggle = useAction((id: string, done: boolean) => setTaskStatusAction(id, done ? 'DONE' : 'TODO'));
  const del = useAction((id: string) => deleteTaskAction(id));
  const names = new Map(members.map((m) => [m.id, m.name]));
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Nova tarefa</Button>
      </div>
      <div className="card overflow-hidden">
        {tasks.length === 0 ? (
          <EmptyState title="Nenhuma tarefa nesta visão" description="Crie tarefas manualmente ou deixe que as automações gerem follow-ups." />
        ) : (
          <ul className="divide-y">
            {tasks.map((t) => {
              const done = t.status === 'DONE';
              const late = !done && t.dueAt && new Date(t.dueAt) < new Date();
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                  <button type="button" onClick={() => toggle.run(t.id, !done)} aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'} className="text-fg-muted hover:text-success">
                    {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', done && 'text-fg-muted line-through')}>{t.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
                      {t.contactId && <Link href={`/contacts/${t.contactId}`} className="hover:text-brand">{t.contactName}</Link>}
                      <span>{t.assigneeId ? names.get(t.assigneeId) ?? '—' : 'Sem responsável'}</span>
                      {t.source !== 'MANUAL' && <Badge tone="brand">{t.source === 'AUTOMATION' ? 'Automação' : t.source === 'AI' ? 'IA' : 'Sistema'}</Badge>}
                    </p>
                  </div>
                  {t.type === 'FOLLOW_UP' && <Badge tone="blue">Follow-up</Badge>}
                  <Badge tone={PRIORITY[t.priority]?.tone}>{PRIORITY[t.priority]?.label}</Badge>
                  <span className={cn('flex w-36 items-center gap-1 text-xs', late ? 'text-danger' : 'text-fg-muted')}>
                    {late && <AlertTriangle className="h-3.5 w-3.5" />} {t.dueAt ? <Time date={t.dueAt} mode="datetime" /> : 'Sem prazo'}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm('Excluir esta tarefa?') && del.run(t.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar tarefa' : 'Nova tarefa'}>
        {editing && <TaskForm initial={editing} members={members} contacts={contacts} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
