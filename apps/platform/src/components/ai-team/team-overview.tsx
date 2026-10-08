'use client';

import { Activity, AlertTriangle, Bot, ChevronRight, Coins, Crown, KeyRound, ListTodo, Pause, Play, PlugZap, Settings, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { activateAiCompanyAction, setPausedAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Alert, Avatar, Badge, Card, CardHeader, EmptyState, StatCard } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/charts';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { AUTONOMY_LABELS } from '@/server/ai-company/constants';
import { AGENT_STATUS, AutoRefresh, StatusBadge, usd } from './shared';

// ─────────────── Tipos (dados simples e serializáveis vindos da página) ───────────────

export interface TeamPermissions {
  command: boolean;
  approve: boolean;
  manage: boolean;
}

export interface ProviderInfo {
  name: string;
  label: string;
  envKey: string;
  configured: boolean;
  defaultModel: string;
}

export interface OverviewAgent {
  id: string;
  name: string;
  title: string;
  department: string;
  isCeo: boolean;
  status: string;
  autonomy: string;
  provider: string;
  model: string | null;
  toolsCount: number;
  active: number;
  waitingApproval: number;
  completed7d: number;
  monthCostMicro: number;
  monthTokens: number;
  monthRuns: number;
  errors7d: number;
  lastRunAt: string | null;
}

export interface OverviewActivity {
  id: string;
  message: string;
  level: string;
  agentName: string | null;
  taskId: string | null;
  createdAt: string;
}

export interface OverviewData {
  paused: boolean;
  pausedReason: string | null;
  n8nEnabled: boolean;
  cost: { todayMicro: number; monthMicro: number; dailyBudgetMicro: number; monthlyBudgetMicro: number };
  pendingApprovals: number;
  providers: ProviderInfo[];
  defaultProvider: string | null;
  n8n: { configured: boolean; missing: string[] };
  briefing: { enabled: boolean; hour: number };
  agents: OverviewAgent[];
  activities: OverviewActivity[];
}

// ─────────────── Utilitários de exibição ───────────────

const numberFmt = new Intl.NumberFormat('pt-BR');
const compactFmt = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export function fmtNumber(n: number) {
  return numberFmt.format(n);
}

export function fmtTokens(n: number) {
  return n >= 10_000 ? compactFmt.format(n) : numberFmt.format(n);
}

/** "Supervisionado — ações internas..." → "Supervisionado". */
export function autonomyShort(value: string) {
  const label = (AUTONOMY_LABELS as Record<string, string>)[value];
  return label ? label.split(' — ')[0]! : value;
}

/** Provedor/modelo legível ("auto" = padrão do ambiente). */
export function modelLabel(provider: string, model: string | null, providers: { name: string; label: string; defaultModel: string }[]) {
  if (!provider || provider === 'auto') return model ? `Padrão do ambiente · ${model}` : 'Padrão do ambiente';
  const p = providers.find((x) => x.name === provider);
  return `${p?.label ?? provider} · ${model || p?.defaultModel || 'modelo padrão'}`;
}

const LEVEL_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  info: { dot: 'bg-info', text: 'text-fg', label: 'Informação' },
  warning: { dot: 'bg-warning', text: 'text-warning', label: 'Atenção' },
  error: { dot: 'bg-danger', text: 'text-danger', label: 'Erro' },
};

// ─────────────── Hierarquia ───────────────

const HIERARCHY = [
  { label: 'Você', hint: 'define objetivos e aprova o que é sensível' },
  { label: 'CEO Agent', hint: 'planeja, delega e revisa' },
  { label: 'Agentes especializados', hint: 'prospecção, comercial, marketing, dev, financeiro, CS' },
  { label: 'Ferramentas e n8n', hint: 'allowlist por agente, com aprovação' },
  { label: 'HR Tech SaaS', hint: 'CRM, conversas, agenda, funil e métricas' },
];

export function HierarchyFlow({ className }: { className?: string }) {
  return (
    <ol className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch', className)} aria-label="Hierarquia da Equipe IA">
      {HIERARCHY.map((h, i) => (
        <li key={h.label} className="flex items-center gap-2 sm:flex-1">
          <div className="min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2">
            <p className="text-sm font-medium">{h.label}</p>
            <p className="text-[11px] leading-snug text-fg-muted">{h.hint}</p>
          </div>
          {i < HIERARCHY.length - 1 && <ChevronRight className="hidden h-4 w-4 shrink-0 text-fg-muted sm:block" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

// ─────────────── Equipe IA ainda não ativada ───────────────

export function TeamIntro({
  agents,
  exists,
  canManage,
}: {
  agents: { key: string; name: string; title: string; description: string; isCeo: boolean }[];
  exists: boolean;
  canManage: boolean;
}) {
  const activate = useAction(() => activateAiCompanyAction());
  return (
    <div className="space-y-4">
      <Card>
        <EmptyState
          icon={<Bot className="h-6 w-6" />}
          title={exists ? 'A Equipe IA está desativada' : 'Monte sua empresa de agentes de IA'}
          description={
            <>
              Um CEO Agent recebe seus objetivos (ex.: “Quero 5 clientes este mês”), analisa CRM, leads, conversas, tarefas, agenda e métricas, cria um plano,
              delega para agentes especializados e devolve um relatório. Ações sensíveis — preço, desconto, contrato, pagamento, gastos, exclusões — sempre
              esperam a sua aprovação.
            </>
          }
          action={
            canManage ? (
              <Button onClick={() => activate.run()} loading={activate.pending}>
                <Sparkles className="h-4 w-4" /> Ativar Equipe IA
              </Button>
            ) : (
              <p className="text-xs text-fg-muted">Peça a um administrador da empresa para ativar a Equipe IA.</p>
            )
          }
        />
      </Card>
      <Card>
        <CardHeader title="Como funciona" description="Cada nível só faz o que o nível acima permite." />
        <div className="space-y-4 p-4">
          <HierarchyFlow />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <li key={a.key} className="flex gap-3 rounded-lg border p-3">
                <Avatar name={a.name} size={36} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {a.name}
                    {a.isCeo && <Crown className="h-3.5 w-3.5 text-warning" aria-label="Coordenador" />}
                  </p>
                  <p className="text-xs text-fg-muted">{a.title}</p>
                  <p className="mt-1 text-xs leading-snug">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="grid gap-2 text-xs text-fg-muted sm:grid-cols-3">
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden /> Ferramentas liberadas por agente (allowlist) e proteção contra instruções maliciosas em mensagens, e-mails e sites.</li>
            <li className="flex gap-2"><Coins className="h-4 w-4 shrink-0 text-brand" aria-hidden /> Orçamento diário e mensal, limites de passos, tokens e tarefas para evitar loops e custos inesperados.</li>
            <li className="flex gap-2"><KeyRound className="h-4 w-4 shrink-0 text-info" aria-hidden /> Sem chave de IA configurada, os agentes seguem roteiros determinísticos com os dados reais da empresa.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

// ─────────────── Pausa geral ───────────────

export function PauseControl({ paused, pausedReason, canManage, compact = false }: { paused: boolean; pausedReason: string | null; canManage: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const pause = useAction((r: string) => setPausedAction(true, r.trim() || undefined), {
    onSuccess: () => {
      setOpen(false);
      setReason('');
    },
  });
  const resume = useAction(() => setPausedAction(false));

  if (paused) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
        <div className="flex gap-3">
          <Pause className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-warning">Equipe IA pausada</p>
            <p className="text-xs text-fg-muted">
              Nenhuma tarefa está sendo executada; novas tarefas ficam na fila até a retomada.
              {pausedReason && (
                <>
                  {' '}Motivo: <span className="text-fg">{pausedReason}</span>
                </>
              )}
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => resume.run()} loading={resume.pending} className="self-start sm:self-auto">
            <Play className="h-4 w-4" /> Retomar
          </Button>
        )}
      </div>
    );
  }

  if (!canManage) return null;

  return (
    <>
      {compact ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Pause className="h-4 w-4" /> Pausar tudo
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-success" aria-hidden />
            <div>
              <p className="text-sm font-medium">Equipe IA em operação</p>
              <p className="text-xs text-fg-muted">Pausar interrompe a execução de todas as tarefas imediatamente (nada é apagado).</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)} className="self-start sm:self-auto">
            <Pause className="h-4 w-4" /> Pausar tudo
          </Button>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Pausar a Equipe IA" description="Nenhum agente executará tarefas até a retomada. As tarefas continuam na fila." size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            pause.run(reason);
          }}
        >
          <Field label="Motivo (opcional)" htmlFor="pause-reason" hint="Fica registrado no histórico e aparece para a equipe.">
            <Input id="pause-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Ex.: revisar prompts antes da campanha" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={pause.pending}>
              <Pause className="h-4 w-4" /> Pausar agora
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─────────────── Situação das integrações ───────────────

export function IntegrationStatus({ providers, defaultProvider, n8n, n8nEnabled }: Pick<OverviewData, 'providers' | 'defaultProvider' | 'n8n' | 'n8nEnabled'>) {
  const anyProvider = providers.some((p) => p.configured);
  const def = providers.find((p) => p.name === defaultProvider);
  return (
    <Card>
      <CardHeader title="Provedores de IA e n8n" description="Credenciais ficam somente nas variáveis de ambiente do servidor — nunca no banco ou no GitHub." />
      <ul className="divide-y text-sm">
        {providers.map((p) => (
          <li key={p.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="min-w-0 flex-1 font-medium">
              {p.label}
              {def?.name === p.name && <span className="ml-1.5 text-[11px] font-normal text-fg-muted">(padrão do ambiente)</span>}
            </span>
            {p.configured ? (
              <span className="flex items-center gap-2 text-xs text-fg-muted">
                <Badge tone="green">Configurado</Badge> modelo padrão <code className="text-fg">{p.defaultModel}</code>
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge tone="yellow">PENDENTE DE CREDENCIAL</Badge> defina <code className="text-fg">{p.envKey}</code>
              </span>
            )}
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
            <PlugZap className="h-4 w-4 text-fg-muted" aria-hidden /> n8n (automações externas)
          </span>
          {n8n.configured ? (
            <span className="flex items-center gap-2 text-xs text-fg-muted">
              <Badge tone="green">Configurado</Badge>
              {!n8nEnabled && 'integração desligada nas configurações'}
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <Badge tone="yellow">PENDENTE DE CREDENCIAL</Badge> defina {n8n.missing.map((m, i) => (
                <code key={m} className="text-fg">
                  {m}
                  {i < n8n.missing.length - 1 ? ',' : ''}
                </code>
              ))}
            </span>
          )}
        </li>
      </ul>
      {!anyProvider && (
        <p className="border-t px-4 py-2.5 text-xs text-fg-muted">
          Nenhum provedor de IA configurado: os agentes seguem roteiros determinísticos (playbooks) com os dados reais da empresa. Envios ao n8n sem credencial ficam na fila e saem
          automaticamente quando as variáveis forem definidas.
        </p>
      )}
    </Card>
  );
}

// ─────────────── Visão geral ───────────────

function AgentCard({ agent: a, providers }: { agent: OverviewAgent; providers: ProviderInfo[] }) {
  return (
    <Link
      href={`/ai-team/agents/${a.id}`}
      className="card group block p-4 transition hover:border-brand/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="flex items-start gap-3">
        <Avatar name={a.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            <span className="truncate">{a.name}</span>
            {a.isCeo && <Crown className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Coordenador da equipe" />}
          </p>
          <p className="truncate text-xs text-fg-muted">{a.title}</p>
        </div>
        <StatusBadge map={AGENT_STATUS} value={a.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div className="col-span-2 min-w-0">
          <dt className="text-fg-muted">Modelo</dt>
          <dd className="truncate font-medium" title={modelLabel(a.provider, a.model, providers)}>
            {modelLabel(a.provider, a.model, providers)}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Autonomia</dt>
          <dd className="font-medium">{autonomyShort(a.autonomy)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Ferramentas</dt>
          <dd className="font-medium">{a.toolsCount}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Em andamento</dt>
          <dd className="font-medium">
            {a.active}
            {a.waitingApproval > 0 && <span className="ml-1 font-normal text-warning">({a.waitingApproval} aguardando aprovação)</span>}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Concluídas (7 dias)</dt>
          <dd className="font-medium">{a.completed7d}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Consumo do mês</dt>
          <dd className="font-medium">
            {usd(a.monthCostMicro)} <span className="font-normal text-fg-muted">· {fmtTokens(a.monthTokens)} tokens</span>
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Erros (7 dias)</dt>
          <dd className={cn('font-medium', a.errors7d > 0 && 'text-danger')}>{a.errors7d}</dd>
        </div>
      </dl>
      <p className="mt-3 flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-fg-muted">
        <span>
          Última execução: {a.lastRunAt ? <Time date={a.lastRunAt} /> : 'nenhuma nos últimos 7 dias'}
        </span>
        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

export function ActivityFeed({ activities, empty = 'Nenhuma atividade registrada ainda.' }: { activities: OverviewActivity[]; empty?: string }) {
  if (!activities.length) return <p className="px-4 py-8 text-center text-xs text-fg-muted">{empty}</p>;
  return (
    <ul className="divide-y">
      {activities.map((a) => {
        const s = LEVEL_STYLE[a.level] ?? LEVEL_STYLE.info!;
        return (
          <li key={a.id} className="flex gap-3 px-4 py-2.5">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', s.dot)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={cn('break-words text-sm', s.text)}>
                <span className="sr-only">{s.label}: </span>
                {a.message}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-fg-muted">
                {a.agentName && <span>{a.agentName}</span>}
                <Time date={a.createdAt} />
                {a.taskId && (
                  <Link href={`/ai-team/tasks/${a.taskId}`} className="text-brand hover:underline">
                    ver tarefa
                  </Link>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Card de custo com barra de consumo do orçamento (mesmo visual do StatCard). */
function BudgetStat({ label, valueMicro, budgetMicro, period }: { label: string; valueMicro: number; budgetMicro: number; period: string }) {
  const over = budgetMicro > 0 && valueMicro >= budgetMicro;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <span className={cn('rounded-lg p-1.5', over ? 'bg-danger/10 text-danger' : 'bg-brand-soft text-brand')}>
          <Coins className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{usd(valueMicro)}</p>
      {budgetMicro > 0 ? (
        <div className="mt-1 space-y-1">
          <p className="text-xs text-fg-muted">
            de {usd(budgetMicro)} por {period}
          </p>
          <Progress value={valueMicro} max={budgetMicro} />
        </div>
      ) : (
        <p className="mt-1 text-xs text-fg-muted">sem orçamento por {period}</p>
      )}
    </div>
  );
}

export function TeamOverview({ data, can }: { data: OverviewData; can: TeamPermissions }) {
  const activeAgents = data.agents.filter((a) => a.status === 'ACTIVE').length;
  const inProgress = data.agents.reduce((s, a) => s + a.active, 0);
  const working = data.agents.some((a) => a.active > 0);
  const { cost } = data;
  const overDaily = cost.dailyBudgetMicro > 0 && cost.todayMicro >= cost.dailyBudgetMicro;
  const overMonthly = cost.monthlyBudgetMicro > 0 && cost.monthMicro >= cost.monthlyBudgetMicro;

  return (
    <div className="space-y-4">
      <AutoRefresh active={working} seconds={10} />

      <PauseControl paused={data.paused} pausedReason={data.pausedReason} canManage={can.manage} />

      {(overDaily || overMonthly) && (
        <Alert tone="red" title={overMonthly ? 'Orçamento mensal da Equipe IA atingido' : 'Orçamento diário da Equipe IA atingido'}>
          Novas execuções com IA ficam na fila até o próximo período ou até o orçamento ser ajustado
          {can.manage ? (
            <>
              {' '}em{' '}
              <Link href="/ai-team/settings" className="underline">
                Configurações
              </Link>
            </>
          ) : null}
          .
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <BudgetStat label="Custo hoje" valueMicro={cost.todayMicro} budgetMicro={cost.dailyBudgetMicro} period="dia" />
        <BudgetStat label="Custo no mês" valueMicro={cost.monthMicro} budgetMicro={cost.monthlyBudgetMicro} period="mês" />
        <Link href="/ai-team/approvals" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" aria-label={`${data.pendingApprovals} aprovações pendentes — abrir aprovações`}>
          <StatCard
            label="Aprovações pendentes"
            value={data.pendingApprovals}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone={data.pendingApprovals ? 'yellow' : 'green'}
            hint={data.pendingApprovals ? (can.approve ? 'Revisar agora →' : 'Aguardando quem pode aprovar') : 'Nada aguardando você'}
          />
        </Link>
        <StatCard label="Agentes ativos" value={`${activeAgents}/${data.agents.length}`} icon={<Users className="h-4 w-4" />} tone="blue" hint="ativos / total" />
        <StatCard
          label="Tarefas em andamento"
          value={inProgress}
          icon={<ListTodo className="h-4 w-4" />}
          tone="blue"
          hint={
            <Link href="/ai-team/tasks" className="hover:underline">
              na fila, executando ou aguardando
            </Link>
          }
        />
      </div>

      <IntegrationStatus providers={data.providers} defaultProvider={data.defaultProvider} n8n={data.n8n} n8nEnabled={data.n8nEnabled} />

      <section aria-labelledby="agents-title">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="agents-title" className="text-sm font-semibold">
            Agentes
          </h2>
          {can.manage && (
            <Link href="/ai-team/settings" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
              <Settings className="h-3.5 w-3.5" /> Limites e orçamento
            </Link>
          )}
        </div>
        {data.agents.length === 0 ? (
          <Card>
            <EmptyState icon={<Bot className="h-5 w-5" />} title="Nenhum agente configurado" description="Ative a Equipe IA novamente para recriar os agentes padrão." />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.agents.map((a) => (
              <AgentCard key={a.id} agent={a} providers={data.providers} />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-fg-muted" aria-hidden /> Atividade recente
            </span>
          }
          description={data.briefing.enabled ? `Briefing diário do CEO às ${String(data.briefing.hour).padStart(2, '0')}h.` : 'Briefing diário desativado.'}
          action={
            data.agents.some((a) => a.errors7d > 0) ? (
              <Badge tone="red">
                <AlertTriangle className="h-3 w-3" aria-hidden /> erros nos últimos 7 dias
              </Badge>
            ) : undefined
          }
        />
        <ActivityFeed activities={data.activities} />
      </Card>
    </div>
  );
}
