'use client';

import { AlertTriangle, ArrowLeft, Ban, ListTree, Loader2, ShieldCheck, Target } from 'lucide-react';
import Link from 'next/link';
import { cancelObjectiveAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Alert, Badge, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { APPROVAL_STATUS, AutoRefresh, Markdown, OBJECTIVE_STATUS, RISK, StatusBadge, TASK_STATUS, usd } from './shared';
import { ActivityList, type ActivityItem } from './task-activity';
import { blockedHint, isTerminal, kindLabel, SOURCE_LABELS, waitingHint } from './task-helpers';

export interface ObjectiveTaskNode {
  id: string;
  title: string;
  kind: string;
  status: string;
  agentName: string;
  parentTaskId: string | null;
  waitingFor: string | null;
  blockedReason: string | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  costMicroUsd: number;
  toolCalls: number;
  suspicious: number;
  createdAt: string;
}

export interface ObjectiveApprovalRow {
  id: string;
  taskId: string;
  summary: string;
  status: string;
  risk: string;
  tool: string;
  agentName: string;
  categories: string[];
  decisionNote: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface ObjectivePlanView {
  label: string | null;
  mode: string | null;
  params: { label: string; value: string }[];
  notes: string[];
  delegations: { agent: string; title: string }[];
  summary: string | null;
}

export interface ObjectiveViewProps {
  objective: {
    id: string;
    title: string;
    command: string;
    status: string;
    source: string;
    result: string | null;
    costMicroUsd: number;
    createdAt: string;
    completedAt: string | null;
  };
  plan: ObjectivePlanView;
  tasks: ObjectiveTaskNode[];
  approvals: ObjectiveApprovalRow[];
  activities: ActivityItem[];
  canCommand: boolean;
  canApprove: boolean;
}

const PLAN_MODE_LABELS: Record<string, string> = {
  llm: 'Planejado com IA',
  playbook: 'Roteiro com dados reais (sem IA)',
};

export function ObjectiveView({ objective, plan, tasks, approvals, activities, canCommand, canApprove }: ObjectiveViewProps) {
  const terminal = isTerminal(objective.status);
  const cancel = useAction(() => cancelObjectiveAction(objective.id));
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING').length;
  const done = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div>
      <AutoRefresh active={!terminal} />
      <Link href="/ai-team/ceo" className="mb-3 inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Central do CEO
      </Link>
      <PageHeader
        title={objective.title}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge map={OBJECTIVE_STATUS} value={objective.status} />
            <span>{SOURCE_LABELS[objective.source] ?? objective.source}</span>
            <span aria-hidden>·</span>
            <span>
              criado <Time date={objective.createdAt} />
            </span>
            {objective.completedAt && (
              <>
                <span aria-hidden>·</span>
                <span>
                  encerrado <Time date={objective.completedAt} />
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>custo {usd(objective.costMicroUsd)}</span>
          </span>
        }
        actions={
          !terminal && canCommand ? (
            <Button
              variant="outline"
              loading={cancel.pending}
              onClick={() => {
                if (window.confirm('Cancelar este objetivo? As tarefas em aberto serão canceladas e as aprovações pendentes, rejeitadas.')) void cancel.run();
              }}
            >
              {!cancel.pending && <Ban className="h-4 w-4" aria-hidden />} Cancelar objetivo
            </Button>
          ) : undefined
        }
      />

      {pendingApprovals > 0 && (
        <Alert tone="yellow" title={`${pendingApprovals} ação(ões) aguardando aprovação`} className="mb-4">
          O CEO e os agentes só continuam essas etapas depois de uma decisão humana.{' '}
          <Link href="/ai-team/approvals" className="underline">
            {canApprove ? 'Decidir agora' : 'Ver aprovações'}
          </Link>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Comando enviado" />
            <p className="whitespace-pre-wrap break-words px-4 py-3 text-sm">{objective.command}</p>
          </Card>

          <Card>
            <CardHeader title="Relatório final" description="Consolidado pelo CEO Agent após revisar o trabalho da equipe." />
            <div className="p-4">
              <ObjectiveResult status={objective.status} result={objective.result} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Tarefas"
              description={`${tasks.length} tarefa(s) · ${done} concluída(s) — planejamento → trabalho delegado → revisão`}
              action={<ListTree className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />}
            />
            {tasks.length === 0 ? (
              <EmptyState icon={<ListTree className="h-5 w-5" />} title="Nenhuma tarefa ainda" />
            ) : (
              <div className="p-3 sm:p-4">
                <TaskTree tasks={tasks} />
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <PlanCard plan={plan} />

          <Card>
            <CardHeader
              title="Aprovações"
              description="Ações sensíveis deste objetivo."
              action={
                <Link href="/ai-team/approvals" className="text-xs font-medium text-brand hover:underline">
                  Ver todas
                </Link>
              }
            />
            {approvals.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhuma ação precisou de aprovação.</p>
            ) : (
              <ul className="divide-y">
                {approvals.map((a) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge map={APPROVAL_STATUS} value={a.status} />
                      <StatusBadge map={RISK} value={a.risk} />
                      {a.categories.map((c) => (
                        <Badge key={c} tone="red">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 break-words text-sm">{a.summary}</p>
                    <p className="mt-0.5 text-[11px] text-fg-muted">
                      {a.agentName} · <span className="font-mono">{a.tool}</span> · <Time date={a.createdAt} />
                    </p>
                    {a.decisionNote && <p className="mt-0.5 break-words text-[11px] text-fg-muted">Nota: {a.decisionNote}</p>}
                    <div className="mt-1 flex gap-3 text-[11px]">
                      {a.status === 'PENDING' && (
                        <Link href="/ai-team/approvals" className="font-medium text-brand hover:underline">
                          {canApprove ? 'Decidir' : 'Ver aprovação'}
                        </Link>
                      )}
                      <Link href={`/ai-team/tasks/${a.taskId}`} className="text-fg-muted hover:text-fg hover:underline">
                        Ver tarefa
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Linha do tempo" />
            <div className="max-h-[32rem] overflow-y-auto">
              <ActivityList items={activities} mode="datetime" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ObjectiveResult({ status, result }: { status: string; result: string | null }) {
  if (status === 'CANCELLED') {
    return (
      <>
        <Alert tone="gray" title="Objetivo cancelado" className={result ? 'mb-3' : undefined}>
          As tarefas em aberto foram canceladas.
        </Alert>
        {result && <Markdown text={result} />}
      </>
    );
  }
  if (status === 'FAILED') {
    return (
      <>
        <Alert tone="red" title="O objetivo terminou com falha" className="mb-3">
          Veja as tarefas abaixo para entender o motivo; tarefas com falha podem ser reprocessadas.
        </Alert>
        {result && <Markdown text={result} />}
      </>
    );
  }
  if (result) return <Markdown text={result} />;
  if (status === 'COMPLETED') return <p className="text-sm text-fg-muted">Objetivo concluído sem relatório.</p>;
  return (
    <p className="flex items-center gap-2 text-sm text-fg-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> O CEO ainda está trabalhando… esta página se atualiza sozinha.
    </p>
  );
}

function PlanCard({ plan }: { plan: ObjectivePlanView }) {
  const empty = !plan.label && !plan.notes.length && !plan.delegations.length && !plan.summary && !plan.params.length;
  return (
    <Card>
      <CardHeader title="Plano do CEO" action={<Target className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />} />
      {empty ? (
        <p className="px-4 py-6 text-center text-xs text-fg-muted">O plano aparece aqui assim que o CEO terminar o planejamento.</p>
      ) : (
        <div className="space-y-3 p-4 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {plan.label && <Badge tone="brand">{plan.label}</Badge>}
            {plan.mode && <Badge tone="gray">{PLAN_MODE_LABELS[plan.mode] ?? plan.mode}</Badge>}
          </div>
          {plan.params.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {plan.params.map((p) => (
                <div key={p.label} className="contents">
                  <dt className="text-fg-muted">{p.label}</dt>
                  <dd className="break-words font-medium">{p.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {plan.notes.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-fg-muted">Observações</p>
              <ul className="ml-4 list-disc space-y-0.5 text-xs">
                {plan.notes.map((n, i) => (
                  <li key={i} className="break-words">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.delegations.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-fg-muted">Delegações</p>
              <ol className="ml-4 list-decimal space-y-0.5 text-xs">
                {plan.delegations.map((d, i) => (
                  <li key={i} className="break-words">
                    <span className="font-medium">{d.agent}</span>: {d.title}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {plan.summary && (
            <details className="rounded-lg border px-3 py-2">
              <summary className="cursor-pointer text-xs font-semibold text-fg-muted">Plano detalhado</summary>
              <div className="mt-2">
                <Markdown text={plan.summary} className="space-y-1.5 text-xs leading-relaxed" />
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

const KIND_ORDER: Record<string, number> = { plan: 0, briefing: 1, work: 1, review: 2 };

function TaskTree({ tasks }: { tasks: ObjectiveTaskNode[] }) {
  const ids = new Set(tasks.map((t) => t.id));
  const byParent = new Map<string, ObjectiveTaskNode[]>();
  for (const t of tasks) {
    const parent = t.parentTaskId && ids.has(t.parentTaskId) && t.parentTaskId !== t.id ? t.parentTaskId : '';
    byParent.set(parent, [...(byParent.get(parent) ?? []), t]);
  }
  for (const list of byParent.values()) list.sort((a, b) => (KIND_ORDER[a.kind] ?? 1) - (KIND_ORDER[b.kind] ?? 1) || a.createdAt.localeCompare(b.createdAt));
  const seen = new Set<string>();

  const render = (parent: string, level: number) => {
    const list = (byParent.get(parent) ?? []).filter((t) => !seen.has(t.id));
    if (!list.length) return null;
    list.forEach((t) => seen.add(t.id));
    return (
      <ul className={level === 0 ? 'space-y-2' : 'ml-2 mt-2 space-y-2 border-l pl-2 sm:ml-3 sm:pl-3'}>
        {list.map((t) => (
          <li key={t.id}>
            <TaskNode task={t} />
            {level < 6 && render(t.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  };
  return render('', 0);
}

function TaskNode({ task: t }: { task: ObjectiveTaskNode }) {
  const active = !isTerminal(t.status);
  const waiting = active ? waitingHint(t.waitingFor) : null;
  const blocked = t.status === 'QUEUED' ? blockedHint(t.blockedReason) : null;
  return (
    <Link href={`/ai-team/tasks/${t.id}`} className="block rounded-lg border px-3 py-2 transition hover:bg-muted/50">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={t.kind === 'work' ? 'blue' : 'brand'}>{kindLabel(t.kind)}</Badge>
        <span className="min-w-0 flex-1 break-words text-sm font-medium">{t.title}</span>
        <StatusBadge map={TASK_STATUS} value={t.status} />
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg-muted">
        <span>{t.agentName}</span>
        {waiting && (
          <>
            <span aria-hidden>·</span>
            <span className="text-warning">{waiting}</span>
          </>
        )}
        {blocked && (
          <>
            <span aria-hidden>·</span>
            <span className="text-warning">{blocked}</span>
          </>
        )}
        {t.attempts > 1 && (
          <>
            <span aria-hidden>·</span>
            <span>
              tentativa {t.attempts}/{t.maxAttempts}
            </span>
          </>
        )}
        {t.toolCalls > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{t.toolCalls} ferramenta(s)</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>{usd(t.costMicroUsd)}</span>
      </p>
      {t.suspicious > 0 && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
          <AlertTriangle className="h-3 w-3" aria-hidden /> Conteúdo suspeito (possível prompt injection) detectado nos dados — tratado como não confiável.
        </p>
      )}
      {t.status === 'WAITING_APPROVAL' && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
          <ShieldCheck className="h-3 w-3" aria-hidden /> Precisa de uma decisão humana para continuar.
        </p>
      )}
      {t.error && <p className="mt-1 line-clamp-2 break-words text-xs text-danger">{t.error}</p>}
    </Link>
  );
}
