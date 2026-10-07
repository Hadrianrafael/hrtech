'use client';

import { ListTree, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/field';
import { Badge, Card, EmptyState } from '@/components/ui/misc';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { AutoRefresh, StatusBadge, TASK_STATUS, usd } from './shared';
import { ACTIVE_TASK_STATUSES, blockedHint, isTerminal, kindLabel, TASK_FILTERS, waitingHint } from './task-helpers';

export interface TaskListRow {
  id: string;
  title: string;
  kind: string;
  status: string;
  agentName: string;
  attempts: number;
  maxAttempts: number;
  costMicroUsd: number;
  objective: { id: string; title: string } | null;
  waitingFor: string | null;
  blockedReason: string | null;
  error: string | null;
  createdAt: string;
}

function hrefFor(status: string, agent: string | null) {
  const sp = new URLSearchParams();
  if (status) sp.set('status', status);
  if (agent) sp.set('agent', agent);
  const q = sp.toString();
  return q ? `/ai-team/tasks?${q}` : '/ai-team/tasks';
}

export function AiTaskList({ tasks, status, agent, agents, limit }: { tasks: TaskListRow[]; status: string; agent: string | null; agents: { id: string; name: string }[]; limit: number }) {
  const router = useRouter();
  const active = tasks.some((t) => ACTIVE_TASK_STATUSES.includes(t.status));
  return (
    <>
      <AutoRefresh active={active} seconds={8} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Filtrar por status">
          {TASK_FILTERS.map((f) => (
            <Link
              key={f.key || 'all'}
              href={hrefFor(f.key, agent)}
              aria-current={status === f.key ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
                status === f.key ? 'bg-brand text-brand-fg' : 'bg-surface text-fg-muted ring-1 ring-border hover:text-fg',
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <div className="sm:w-56">
          <label htmlFor="ai-task-agent" className="sr-only">
            Filtrar por agente
          </label>
          <Select id="ai-task-agent" value={agent ?? ''} onChange={(e) => router.push(hrefFor(status, e.target.value || null))}>
            <option value="">Todos os agentes</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        {tasks.length === 0 ? (
          <EmptyState icon={<ListTree className="h-5 w-5" />} title="Nenhuma tarefa encontrada" description="As tarefas aparecem aqui quando o CEO Agent planeja e delega um objetivo." />
        ) : (
          <ul className="divide-y">
            {tasks.map((t) => {
              const waiting = !isTerminal(t.status) ? waitingHint(t.waitingFor) : null;
              const blocked = t.status === 'QUEUED' ? blockedHint(t.blockedReason) : null;
              return (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={`/ai-team/tasks/${t.id}`} className="min-w-0 flex-1 break-words text-sm font-medium hover:underline">
                      {t.title}
                    </Link>
                    <StatusBadge map={TASK_STATUS} value={t.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-muted">
                    <Badge tone={t.kind === 'work' ? 'blue' : 'brand'}>{kindLabel(t.kind)}</Badge>
                    <span>{t.agentName}</span>
                    <span aria-hidden>·</span>
                    <span title="Tentativas">
                      tentativas {t.attempts}/{t.maxAttempts}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{usd(t.costMicroUsd)}</span>
                    <span aria-hidden>·</span>
                    <Time date={t.createdAt} />
                    {waiting && <span className="text-warning">· {waiting}</span>}
                    {blocked && <span className="text-warning">· {blocked}</span>}
                  </div>
                  {t.objective && (
                    <Link href={`/ai-team/objectives/${t.objective.id}`} className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-fg-muted hover:text-fg hover:underline">
                      <Target className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{t.objective.title}</span>
                    </Link>
                  )}
                  {t.error && t.status === 'FAILED' && <p className="mt-1 line-clamp-2 break-words text-xs text-danger">{t.error}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {tasks.length >= limit && <p className="mt-2 text-center text-[11px] text-fg-muted">Mostrando as {limit} tarefas mais recentes. Use os filtros para refinar.</p>}
    </>
  );
}
