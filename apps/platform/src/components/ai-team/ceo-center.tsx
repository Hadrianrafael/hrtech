'use client';

import { ChevronDown, ChevronUp, FileText, Loader2, Send, ShieldCheck, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { requestBriefingAction, sendCommandAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { AutoRefresh, Markdown, OBJECTIVE_STATUS, StatusBadge, usd } from './shared';
import { ActivityList, type ActivityItem } from './task-activity';
import { formatDay } from './task-helpers';

const MAX_COMMAND = 2000;
const ACTIVE_OBJECTIVE = ['OPEN', 'IN_PROGRESS', 'WAITING_APPROVAL'];

export interface CeoObjectiveRow {
  id: string;
  title: string;
  status: string;
  source: string;
  playbookLabel: string | null;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  costMicroUsd: number;
  createdAt: string;
}

export interface CeoBriefingRow {
  id: string;
  day: string;
  content: string;
  deliveryNote: string | null;
  createdAt: string;
}

export interface CeoCenterProps {
  canCommand: boolean;
  examples: string[];
  paused: boolean;
  pausedReason: string | null;
  aiConfigured: boolean;
  ceo: { name: string; status: string } | null;
  pendingApprovals: number;
  cost: { todayMicro: number; monthMicro: number };
  briefingSchedule: string | null;
  objectives: CeoObjectiveRow[];
  briefings: CeoBriefingRow[];
  activities: ActivityItem[];
}

export function CeoCenter(p: CeoCenterProps) {
  const active = p.objectives.filter((o) => ACTIVE_OBJECTIVE.includes(o.status));
  const ceoUnavailable = !p.ceo || p.ceo.status === 'DISABLED';
  return (
    <div>
      <AutoRefresh active={active.length > 0} />
      <PageHeader
        title="Central do CEO"
        description="Envie objetivos ao CEO Agent: ele analisa a empresa, monta o plano, delega aos agentes e revisa os resultados."
        actions={<BriefingButton canCommand={p.canCommand && !ceoUnavailable} />}
      />

      <div className="mb-4 space-y-2">
        {ceoUnavailable && (
          <Alert tone="red" title="O CEO Agent está desativado">
            Reative o CEO Agent em <Link href="/ai-team" className="underline">Equipe IA</Link> para enviar novos objetivos.
          </Alert>
        )}
        {p.paused && (
          <Alert tone="yellow" title="Equipe IA pausada">
            Nenhuma tarefa é executada enquanto a equipe estiver pausada; novos objetivos ficam na fila até a retomada em{' '}
            <Link href="/ai-team/settings" className="underline">Configurações</Link>.{p.pausedReason ? ` Motivo: ${p.pausedReason}` : ''}
          </Alert>
        )}
        {!p.aiConfigured && (
          <Alert tone="blue" title="IA PENDENTE DE CREDENCIAL">
            Nenhum provedor de IA (OpenAI, Anthropic ou Gemini) está configurado. Os comandos mais comuns (análise da empresa, follow-ups, prospecção, funil e
            prioridades) funcionam com roteiros e os dados reais da SaaS; pedidos livres ficam aguardando a configuração.
          </Alert>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Objetivos em andamento" value={active.length} icon={<Target className="h-4 w-4" />} tone="blue" />
        <Link href="/ai-team/approvals" className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={`${p.pendingApprovals} aprovação(ões) pendente(s) — abrir aprovações`}>
          <StatCard
            label="Aprovações pendentes"
            value={p.pendingApprovals}
            hint={p.pendingApprovals ? 'Clique para decidir' : 'Nada aguardando você'}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone={p.pendingApprovals ? 'yellow' : 'green'}
          />
        </Link>
        <StatCard label="Custo de IA hoje" value={usd(p.cost.todayMicro)} hint="Estimado" tone="gray" />
        <StatCard label="Custo de IA no mês" value={usd(p.cost.monthMicro)} hint="Estimado" tone="gray" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <CommandBox canCommand={p.canCommand && !ceoUnavailable} examples={p.examples} />
          <ObjectiveList objectives={p.objectives} />
        </div>
        <div className="min-w-0 space-y-4">
          <BriefingCard briefings={p.briefings} schedule={p.briefingSchedule} />
          <Card>
            <CardHeader title="Atividade recente" description="O que a Equipe IA fez por último." />
            <ActivityList items={p.activities} empty="Nenhuma atividade ainda." />
          </Card>
        </div>
      </div>
    </div>
  );
}

function CommandBox({ canCommand, examples }: { canCommand: boolean; examples: string[] }) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [command, setCommand] = useState('');
  const send = useAction((c: string) => sendCommandAction(c), {
    refresh: false,
    onSuccess: (data) => {
      setCommand('');
      router.push(`/ai-team/objectives/${data.objectiveId}`);
    },
  });
  const trimmed = command.trim();
  const valid = trimmed.length >= 3 && trimmed.length <= MAX_COMMAND;
  const disabled = !canCommand || send.pending;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled || !valid) return;
    void send.run(trimmed);
  };

  return (
    <Card>
      <CardHeader title="Fale com o CEO Agent" description="Descreva um objetivo em linguagem natural. Ações sensíveis sempre passam pela sua aprovação." />
      <form onSubmit={submit} className="space-y-3 p-4">
        <label htmlFor="ceo-command" className="sr-only">
          Objetivo ou comando para o CEO Agent
        </label>
        <Textarea
          id="ceo-command"
          ref={ref}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          maxLength={MAX_COMMAND}
          disabled={disabled}
          placeholder={canCommand ? 'Ex.: Quero 5 clientes este mês' : 'Você não tem permissão para enviar comandos ao CEO Agent.'}
          aria-describedby="ceo-command-hint"
        />
        {examples.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted">Comandos rápidos</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Comandos rápidos">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setCommand(ex);
                    ref.current?.focus();
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs ring-1 transition disabled:cursor-not-allowed disabled:opacity-60',
                    command.trim() === ex ? 'bg-brand-soft text-brand ring-brand' : 'bg-surface text-fg-muted ring-border hover:text-fg',
                  )}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id="ceo-command-hint" className="text-[11px] text-fg-muted">
            {canCommand ? (
              <>
                <span className="hidden sm:inline">Ctrl + Enter para enviar · </span>
                {trimmed.length}/{MAX_COMMAND}
              </>
            ) : (
              'Somente pessoas com a permissão "Enviar objetivos ao CEO Agent" podem enviar comandos.'
            )}
          </p>
          <Button type="submit" loading={send.pending} disabled={!canCommand || !valid}>
            {!send.pending && <Send className="h-4 w-4" aria-hidden />} Enviar ao CEO
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BriefingButton({ canCommand }: { canCommand: boolean }) {
  const briefing = useAction(() => requestBriefingAction(), {
    success: (d) => (d.queued ? 'Briefing solicitado ao CEO Agent. Ele aparece aqui em instantes.' : 'O briefing de hoje já está sendo gerado.'),
  });
  if (!canCommand) return null;
  return (
    <Button variant="outline" onClick={() => void briefing.run()} loading={briefing.pending}>
      {!briefing.pending && <Sparkles className="h-4 w-4" aria-hidden />} Gerar briefing agora
    </Button>
  );
}

function ObjectiveList({ objectives }: { objectives: CeoObjectiveRow[] }) {
  return (
    <Card>
      <CardHeader title="Objetivos" description="Cada comando vira um objetivo com plano, tarefas delegadas e relatório final." />
      {objectives.length === 0 ? (
        <EmptyState icon={<Target className="h-5 w-5" />} title="Nenhum objetivo ainda" description="Envie seu primeiro comando ao CEO Agent acima." />
      ) : (
        <ul className="divide-y">
          {objectives.map((o) => {
            const pct = o.totalTasks ? Math.round((o.completedTasks / o.totalTasks) * 100) : 0;
            const working = ACTIVE_OBJECTIVE.includes(o.status);
            return (
              <li key={o.id}>
                <Link href={`/ai-team/objectives/${o.id}`} className="block px-4 py-3 transition hover:bg-muted/50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 break-words text-sm font-medium">
                      {working && <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin text-info" aria-label="Em andamento" />}
                      {o.title}
                    </p>
                    <StatusBadge map={OBJECTIVE_STATUS} value={o.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-muted">
                    {o.playbookLabel && <Badge tone="brand">{o.playbookLabel}</Badge>}
                    {o.source === 'N8N' && <Badge tone="blue">via n8n</Badge>}
                    <span>
                      {o.totalTasks} tarefa(s) · {o.completedTasks} concluída(s)
                      {o.failedTasks > 0 && <span className="text-danger"> · {o.failedTasks} com falha</span>}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{usd(o.costMicroUsd)}</span>
                    <span aria-hidden>·</span>
                    <Time date={o.createdAt} />
                  </div>
                  {o.totalTasks > 0 && (
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${pct}% das tarefas concluídas`}
                    >
                      <div className={cn('h-full rounded-full', o.status === 'FAILED' ? 'bg-danger' : o.status === 'COMPLETED' ? 'bg-success' : 'bg-brand')} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function BriefingCard({ briefings, schedule }: { briefings: CeoBriefingRow[]; schedule: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const selected = briefings.find((b) => b.id === selectedId) ?? briefings[0] ?? null;
  const long = (selected?.content.length ?? 0) > 700;

  return (
    <Card>
      <CardHeader
        title="Briefing diário"
        description={schedule ?? 'Briefing automático desativado — gere sob demanda.'}
        action={<FileText className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />}
      />
      {!selected ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhum briefing ainda" description="Use “Gerar briefing agora” ou aguarde o horário configurado." />
      ) : (
        <div className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-fg-muted">
            <Badge tone="brand">{formatDay(selected.day)}</Badge>
            <span>
              gerado <Time date={selected.createdAt} />
            </span>
            {selected.deliveryNote && <span>· {selected.deliveryNote}</span>}
          </div>
          <div className="relative">
            <div id="ceo-briefing-content" className={cn(!expanded && long && 'max-h-72 overflow-hidden')}>
              <Markdown text={selected.content} />
            </div>
            {!expanded && long && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" aria-hidden />}
          </div>
          {long && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="ceo-briefing-content">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
              {expanded ? 'ver menos' : 'ver mais'}
            </Button>
          )}
          {briefings.length > 1 && (
            <div className="mt-3 border-t pt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted">Dias anteriores</p>
              <div className="flex flex-wrap gap-1.5">
                {briefings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(b.id);
                      setExpanded(false);
                    }}
                    aria-pressed={b.id === selected.id}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 transition',
                      b.id === selected.id ? 'bg-brand text-brand-fg ring-brand' : 'bg-surface text-fg-muted ring-border hover:text-fg',
                    )}
                  >
                    {formatDay(b.day)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
