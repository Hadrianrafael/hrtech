'use client';

import { AlertTriangle, ArrowLeft, Ban, Clock, History, ListTree, RotateCcw, ShieldCheck, Webhook, Wrench } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cancelAiTaskAction, retryAiTaskAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Alert, Badge, Card, CardHeader, PageHeader } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { APPROVAL_STATUS, AutoRefresh, Markdown, RISK, StatusBadge, TASK_STATUS, usd } from './shared';
import { ActivityList, type ActivityItem } from './task-activity';
import {
  blockedHint,
  DISPATCH_STATUS,
  formatLatency,
  formatTokens,
  isTerminal,
  kindLabel,
  RUN_MODE_LABELS,
  RUN_STATUS,
  STEP_STATUS,
  TOOL_CALL_STATUS,
  waitingHint,
} from './task-helpers';

export interface TaskHistoryStep {
  kind: string;
  tool: string | null;
  status: string | null;
  summary: string | null;
  at: string | null;
  /** JSON já serializado, indentado e com tamanho limitado (exibido como texto puro). */
  args: string | null;
  output: string | null;
}

export interface TaskRunRow {
  id: string;
  attempt: number;
  status: string;
  mode: string;
  provider: string | null;
  model: string | null;
  steps: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
  latencyMs: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface TaskToolCallRow {
  id: string;
  tool: string;
  risk: string;
  status: string;
  suspicious: boolean;
  error: string | null;
  createdAt: string;
}

export interface TaskApprovalRow {
  id: string;
  summary: string;
  reason: string;
  status: string;
  risk: string;
  categories: string[];
  decisionNote: string | null;
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
}

export interface TaskDispatchRow {
  id: string;
  workflow: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  responseStatus: number | null;
  nextAttemptAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskChildRow {
  id: string;
  title: string;
  kind: string;
  status: string;
  agentName: string;
}

export interface TaskViewProps {
  task: {
    id: string;
    title: string;
    kind: string;
    status: string;
    mode: string | null;
    priority: number;
    depth: number;
    attempts: number;
    maxAttempts: number;
    steps: number;
    tokensIn: number;
    tokensOut: number;
    costMicroUsd: number;
    instructions: string;
    result: string | null;
    error: string | null;
    highlights: string[];
    nextSteps: string[];
    waitingFor: string | null;
    blockedReason: string | null;
    nextRunAt: string | null;
    parentTaskId: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    agent: { id: string; name: string; title: string };
    objective: { id: string; title: string } | null;
  };
  history: TaskHistoryStep[];
  historyTotal: number;
  runs: TaskRunRow[];
  toolCalls: TaskToolCallRow[];
  approvals: TaskApprovalRow[];
  dispatches: TaskDispatchRow[];
  childTasks: TaskChildRow[];
  activities: ActivityItem[];
  canCommand: boolean;
  canApprove: boolean;
}

const MODE_LABELS: Record<string, string> = { ...RUN_MODE_LABELS, llm: 'IA decide os passos', playbook: 'Roteiro determinístico' };

export function TaskView(p: TaskViewProps) {
  const { task } = p;
  const terminal = isTerminal(task.status);
  const retry = useAction(() => retryAiTaskAction(task.id));
  const cancel = useAction(() => cancelAiTaskAction(task.id));
  const waiting = !terminal ? waitingHint(task.waitingFor) : null;
  const blocked = task.status === 'QUEUED' ? blockedHint(task.blockedReason) : null;
  const suspicious = p.toolCalls.filter((c) => c.suspicious).length;

  return (
    <div>
      <AutoRefresh active={!terminal} />
      {task.objective ? (
        <Link href={`/ai-team/objectives/${task.objective.id}`} className="mb-3 inline-flex max-w-full items-center gap-1 text-xs text-fg-muted hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">Objetivo: {task.objective.title}</span>
        </Link>
      ) : (
        <Link href="/ai-team/tasks" className="mb-3 inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Tarefas
        </Link>
      )}
      <PageHeader
        title={task.title}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge map={TASK_STATUS} value={task.status} />
            <Badge tone={task.kind === 'work' ? 'blue' : 'brand'}>{kindLabel(task.kind)}</Badge>
            <span>{task.agent.name}</span>
            <span aria-hidden>·</span>
            <span>
              criada <Time date={task.createdAt} />
            </span>
          </span>
        }
        actions={
          p.canCommand && (task.status === 'FAILED' || task.status === 'CANCELLED' || !terminal) ? (
            <>
              {(task.status === 'FAILED' || task.status === 'CANCELLED') && (
                <Button onClick={() => void retry.run()} loading={retry.pending}>
                  {!retry.pending && <RotateCcw className="h-4 w-4" aria-hidden />} Reprocessar
                </Button>
              )}
              {!terminal && (
                <Button
                  variant="outline"
                  loading={cancel.pending}
                  onClick={() => {
                    if (window.confirm('Cancelar esta tarefa? Aprovações pendentes dela serão rejeitadas e etapas que dependem dela também serão canceladas.')) void cancel.run();
                  }}
                >
                  {!cancel.pending && <Ban className="h-4 w-4" aria-hidden />} Cancelar
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <div className="mb-4 space-y-2">
        {task.status === 'WAITING_APPROVAL' && (
          <Alert tone="yellow" title="Aguardando aprovação humana">
            Esta tarefa pediu autorização para uma ação sensível e continua assim que alguém decidir.{' '}
            <Link href="/ai-team/approvals" className="underline">
              {p.canApprove ? 'Decidir agora' : 'Ver aprovações'}
            </Link>
          </Alert>
        )}
        {waiting && task.status !== 'WAITING_APPROVAL' && (
          <Alert tone="blue" title={`Tarefa ${waiting}`}>
            {waiting === 'aguardando n8n'
              ? 'O pedido foi enviado ao n8n; se o n8n estiver fora do ar, o envio é repetido automaticamente.'
              : waiting === 'aguardando etapa anterior'
                ? 'Ela entra na fila assim que a etapa anterior for concluída.'
                : 'Ela continua automaticamente quando a espera terminar.'}
          </Alert>
        )}
        {blocked && (
          <Alert tone="yellow" title={`Tarefa ${blocked}`}>
            Ela permanece na fila e será retomada automaticamente{task.nextRunAt ? <> (próxima tentativa <Time date={task.nextRunAt} />)</> : ''}.
          </Alert>
        )}
        {suspicious > 0 && (
          <Alert tone="yellow" title="Conteúdo suspeito detectado">
            {suspicious} chamada(s) de ferramenta retornaram dados com possíveis instruções embutidas (prompt injection). Esses dados foram tratados como não
            confiáveis e não alteram as regras do agente.
          </Alert>
        )}
      </div>

      <Card className="mb-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Info label="Agente">
            <Link href={`/ai-team/agents/${task.agent.id}`} className="hover:underline">
              {task.agent.name}
            </Link>
          </Info>
          <Info label="Modo">{task.mode ? (MODE_LABELS[task.mode] ?? task.mode) : '—'}</Info>
          <Info label="Prioridade">{task.priority}/9</Info>
          <Info label="Profundidade">{task.depth === 0 ? 'Raiz' : `Nível ${task.depth}`}</Info>
          <Info label="Tentativas">
            {task.attempts}/{task.maxAttempts}
          </Info>
          <Info label="Passos">{task.steps}</Info>
          <Info label="Tokens">{formatTokens(task.tokensIn + task.tokensOut)}</Info>
          <Info label="Custo estimado">{usd(task.costMicroUsd)}</Info>
          <Info label="Iniciada">{task.startedAt ? <Time date={task.startedAt} mode="datetime" /> : '—'}</Info>
          <Info label="Concluída">{task.completedAt ? <Time date={task.completedAt} mode="datetime" /> : '—'}</Info>
          {task.parentTaskId && (
            <Info label="Tarefa de origem">
              <Link href={`/ai-team/tasks/${task.parentTaskId}`} className="text-brand hover:underline">
                Abrir
              </Link>
            </Info>
          )}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Instruções" />
            <p className="whitespace-pre-wrap break-words px-4 py-3 text-sm">{task.instructions || '—'}</p>
          </Card>

          <Card>
            <CardHeader title="Resultado" />
            <div className="space-y-3 p-4">
              {task.error && (
                <Alert tone={task.status === 'CANCELLED' ? 'gray' : 'red'} title={task.status === 'CANCELLED' ? 'Tarefa cancelada' : 'Erro'}>
                  <span className="whitespace-pre-wrap break-words">{task.error}</span>
                </Alert>
              )}
              {task.result ? (
                <Markdown text={task.result} />
              ) : !task.error ? (
                <p className="text-sm text-fg-muted">{terminal ? 'Sem resultado registrado.' : 'O agente ainda está trabalhando… esta página se atualiza sozinha.'}</p>
              ) : null}
              {task.highlights.length > 0 && <BulletList title="Destaques" items={task.highlights} />}
              {task.nextSteps.length > 0 && <BulletList title="Próximos passos" items={task.nextSteps} />}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Passo a passo"
              description={p.historyTotal > p.history.length ? `Últimos ${p.history.length} de ${p.historyTotal} passos.` : 'O que o agente fez, em ordem.'}
              action={<History className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />}
            />
            {p.history.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhum passo registrado ainda.</p>
            ) : (
              <ol className="space-y-3 p-4">
                {p.history.map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold tabular-nums" aria-hidden>
                      {p.historyTotal - p.history.length + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {h.kind === 'tool' ? (
                          <span className="break-all font-mono text-xs font-medium">{h.tool ?? 'ferramenta'}</span>
                        ) : (
                          <Badge tone={h.kind === 'error' ? 'red' : 'gray'}>{h.kind === 'error' ? 'Erro' : 'Nota'}</Badge>
                        )}
                        {h.status && <StatusBadge map={STEP_STATUS} value={h.status} />}
                        {h.at && (
                          <span className="text-[11px] text-fg-muted">
                            <Time date={h.at} mode="datetime" />
                          </span>
                        )}
                      </div>
                      {h.summary && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{h.summary}</p>}
                      {(h.args || h.output) && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[11px] text-fg-muted hover:text-fg">Ver dados técnicos</summary>
                          {h.args && <JsonBlock label="Parâmetros" text={h.args} />}
                          {h.output && <JsonBlock label="Retorno (dados não confiáveis)" text={h.output} />}
                        </details>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader title="Execuções" description="Cada tentativa de processar a tarefa." action={<Clock className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />} />
            {p.runs.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhuma execução ainda.</p>
            ) : (
              <ul className="divide-y">
                {p.runs.map((r) => (
                  <li key={r.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">#{r.attempt}</span>
                      <StatusBadge map={RUN_STATUS} value={r.status} />
                      <Badge tone="gray">{RUN_MODE_LABELS[r.mode] ?? r.mode}</Badge>
                      {r.model && (
                        <span className="break-all font-mono text-[11px] text-fg-muted">
                          {r.provider ? `${r.provider} · ` : ''}
                          {r.model}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-fg-muted">
                        <Time date={r.startedAt} mode="datetime" />
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-fg-muted">
                      {r.steps} passo(s) · {formatTokens(r.tokensIn)} tokens de entrada · {formatTokens(r.tokensOut)} de saída · {usd(r.costMicroUsd)} · {formatLatency(r.latencyMs)}
                    </p>
                    {r.error && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-danger">{r.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Ferramentas usadas"
              description="Somente ferramentas da allowlist do agente; ações sensíveis passam por aprovação."
              action={<Wrench className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />}
            />
            {p.toolCalls.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhuma ferramenta chamada.</p>
            ) : (
              <ul className="divide-y">
                {p.toolCalls.map((c) => (
                  <li key={c.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs font-medium">{c.tool}</span>
                      <StatusBadge map={RISK} value={c.risk} />
                      <StatusBadge map={TOOL_CALL_STATUS} value={c.status} />
                      <span className="ml-auto text-[11px] text-fg-muted">
                        <Time date={c.createdAt} mode="datetime" />
                      </span>
                    </div>
                    {c.suspicious && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden /> Possível prompt injection nos dados retornados — tratado como não confiável.
                      </p>
                    )}
                    {c.error && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-danger">{c.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              title="Aprovações"
              action={
                <Link href="/ai-team/approvals" className="text-xs font-medium text-brand hover:underline">
                  Ver todas
                </Link>
              }
            />
            {p.approvals.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhuma ação desta tarefa precisou de aprovação.</p>
            ) : (
              <ul className="divide-y">
                {p.approvals.map((a) => (
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
                    <p className="mt-1 break-words text-sm font-medium">{a.summary}</p>
                    {a.reason && <p className="mt-0.5 break-words text-xs text-fg-muted">Motivo: {a.reason}</p>}
                    <p className="mt-0.5 text-[11px] text-fg-muted">
                      pedida <Time date={a.createdAt} />
                      {a.status === 'PENDING' ? (
                        <>
                          {' '}
                          · expira <Time date={a.expiresAt} mode="datetime" />
                        </>
                      ) : a.decidedAt ? (
                        <>
                          {' '}
                          · decidida <Time date={a.decidedAt} />
                        </>
                      ) : null}
                    </p>
                    {a.decisionNote && <p className="mt-0.5 break-words text-[11px] text-fg-muted">Nota: {a.decisionNote}</p>}
                    {a.status === 'PENDING' && (
                      <Link href="/ai-team/approvals" className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
                        <ShieldCheck className="h-3 w-3" aria-hidden /> {p.canApprove ? 'Decidir' : 'Ver aprovação'}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {p.dispatches.length > 0 && (
            <Card>
              <CardHeader title="Envios ao n8n" description="Com idempotência e novas tentativas automáticas." action={<Webhook className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />} />
              <ul className="divide-y">
                {p.dispatches.map((d) => (
                  <li key={d.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{d.workflow}</span>
                      <StatusBadge map={DISPATCH_STATUS} value={d.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-fg-muted">
                      tentativas {d.attempts}/{d.maxAttempts}
                      {d.responseStatus ? ` · HTTP ${d.responseStatus}` : ''} · criado <Time date={d.createdAt} />
                      {d.status === 'PENDING' && d.nextAttemptAt && (
                        <>
                          {' '}
                          · próxima tentativa <Time date={d.nextAttemptAt} />
                        </>
                      )}
                    </p>
                    {d.lastError && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-danger">{d.lastError}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {p.childTasks.length > 0 && (
            <Card>
              <CardHeader title="Tarefas delegadas" action={<ListTree className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />} />
              <ul className="divide-y">
                {p.childTasks.map((c) => (
                  <li key={c.id}>
                    <Link href={`/ai-team/tasks/${c.id}`} className="block px-4 py-2.5 transition hover:bg-muted/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 break-words text-sm font-medium">{c.title}</span>
                        <StatusBadge map={TASK_STATUS} value={c.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {kindLabel(c.kind)} · {c.agentName}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Atividades" />
            <div className="max-h-[32rem] overflow-y-auto">
              <ActivityList items={p.activities} mode="datetime" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{children}</dd>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-fg-muted">{title}</p>
      <ul className="ml-5 list-disc space-y-0.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="break-words">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function JsonBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-1.5">
      <p className="mb-0.5 text-[11px] font-medium text-fg-muted">{label}</p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-2 font-mono text-[11px] leading-snug">{text}</pre>
    </div>
  );
}
