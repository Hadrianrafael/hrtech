import { AlertTriangle, CalendarDays, CheckSquare, Clock, DollarSign, FileText, MessageCircle, Target, Trophy, UserPlus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BarList, ColumnChart, Donut } from '@/components/ui/charts';
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui/misc';
import { PeriodFilter } from '@/components/shared/period-filter';
import { fmtDate, pct, timeAgo } from '@/components/shared/format';
import { CHANNEL_COLORS, CHANNEL_LABELS, SOURCE_COLORS } from '@/components/shared/labels';
import { requirePageContext } from '@/lib/auth/context';
import { formatMoney } from '@/lib/utils';
import { getDashboard, resolveRange } from '@/server/analytics';
import { SOURCE_LABELS } from '@/server/contacts';
import { listTasks } from '@/server/tasks';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('dashboard.view');
  const range = resolveRange(sp.period, sp.from, sp.to);
  const [d, tasks] = await Promise.all([
    getDashboard(ctx, range),
    ctx.permissions.has('tasks.manage') ? listTasks(ctx, { view: 'mine' }) : Promise.resolve([]),
  ]);
  const overdueTasks = tasks.filter((t) => t.dueAt && t.dueAt < new Date());

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Olá, ${ctx.user.name.split(' ')[0]}`}
        description={`Visão geral de ${ctx.org.name} · ${fmtDate(range.start)} a ${fmtDate(range.end)}`}
        actions={
          <Suspense>
            <PeriodFilter current={range.key} />
          </Suspense>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Novos leads" value={d.newLeads} icon={<UserPlus className="h-4 w-4" />} hint="no período" />
        <StatCard label="Leads em atendimento" value={d.leadsInProgress} icon={<Users className="h-4 w-4" />} tone="blue" hint="contatados, em conversa ou qualificados" />
        <StatCard label="Oportunidades abertas" value={d.openOpportunities.count} icon={<Target className="h-4 w-4" />} tone="yellow" hint={formatMoney(d.openOpportunities.value)} />
        <StatCard label="Propostas enviadas" value={d.proposals.count} icon={<FileText className="h-4 w-4" />} tone="yellow" hint={formatMoney(d.proposals.value)} />
        <StatCard label="Vendas (ganhas)" value={d.won.count} icon={<Trophy className="h-4 w-4" />} tone="green" hint={formatMoney(d.won.value)} />
        <StatCard label="Taxa de conversão" value={pct(d.leadConversion)} icon={<DollarSign className="h-4 w-4" />} tone="green" hint={`Taxa de ganho: ${pct(d.winRate)}`} />
        <StatCard label="Conversas abertas" value={d.conversationsOpen} icon={<MessageCircle className="h-4 w-4" />} tone="blue" hint={`${d.conversationsWaiting} aguardando resposta`} />
        <StatCard label="Agenda e tarefas" value={d.upcomingAppointments} icon={<CalendarDays className="h-4 w-4" />} tone="gray" hint={`compromissos em 7 dias · ${d.tasksPending} tarefas (${d.tasksOverdue} atrasadas)`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Leads por dia" description="Entrada de novos contatos no período" />
          <div className="p-4">
            <ColumnChart data={d.leadsSeries.map((s) => ({ label: s.date.slice(8, 10) + '/' + s.date.slice(5, 7), value: s.count }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Origem dos leads" />
          <div className="p-4">
            <BarList items={d.bySource.map((s, i) => ({ label: SOURCE_LABELS[s.key] ?? s.key, value: s.count, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Canais mais utilizados" description="Conversas com atividade no período" />
          <div className="p-4">
            <Donut items={d.byChannel.map((c) => ({ label: CHANNEL_LABELS[c.key] ?? c.key, value: c.count, color: CHANNEL_COLORS[c.key] ?? '#64748b' }))} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Minhas tarefas"
            description={overdueTasks.length ? `${overdueTasks.length} atrasada(s)` : 'Pendentes'}
            action={<Link href="/tasks" className="text-xs text-brand hover:underline">Ver todas</Link>}
          />
          {tasks.length ? (
            <ul className="divide-y">
              {tasks.slice(0, 6).map((t) => {
                const late = t.dueAt && t.dueAt < new Date();
                return (
                  <li key={t.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                    {late ? <AlertTriangle className="h-4 w-4 shrink-0 text-danger" /> : <CheckSquare className="h-4 w-4 shrink-0 text-fg-muted" />}
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className={late ? 'text-xs text-danger' : 'text-xs text-fg-muted'}>{t.dueAt ? timeAgo(t.dueAt) : 'sem prazo'}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={<CheckSquare className="h-5 w-5" />} title="Nenhuma tarefa pendente" />
          )}
        </Card>
        <Card>
          <CardHeader title="Atividade recente" />
          {d.recent.length ? (
            <ul className="divide-y">
              {d.recent.slice(0, 7).map((e) => (
                <li key={e.id} className="px-4 py-2.5 text-sm">
                  <Link href={`/contacts/${e.contact.id}`} className="font-medium hover:text-brand">{e.contact.name}</Link>
                  <p className="truncate text-xs text-fg-muted">{e.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-fg-muted"><Clock className="h-3 w-3" /> {timeAgo(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sem atividades no período" />
          )}
        </Card>
      </div>
    </div>
  );
}
