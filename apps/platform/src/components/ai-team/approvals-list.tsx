'use client';

import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronUp, Clock, ExternalLink, History, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import { decideApprovalAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Textarea } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader, EmptyState } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { APPROVAL_STATUS, AutoRefresh, RISK, StatusBadge } from './shared';

// ─────────────── Tipos (dados simples e serializáveis vindos da página) ───────────────

export interface ApprovalCategory {
  key: string;
  label: string;
}

export interface ApprovalTaskRef {
  id: string;
  title: string;
  objectiveId: string | null;
}

export interface PendingApprovalRow {
  id: string;
  agentId: string;
  agentName: string;
  tool: string;
  toolLabel: string | null;
  risk: string;
  categories: ApprovalCategory[];
  summary: string;
  reason: string;
  /** JSON indentado do que será executado (limitado para exibição). */
  payloadPreview: string;
  /** Conteúdo completo (com teto) quando a prévia foi encurtada; null quando a prévia já é o conteúdo inteiro. */
  payloadFull: string | null;
  payloadLength: number;
  /** O conteúdo passa até do teto do conteúdo completo. */
  payloadOverLimit: boolean;
  taskId: string;
  task: ApprovalTaskRef | null;
  createdAt: string;
  expiresAt: string;
  expired: boolean;
}

export interface ApprovalHistoryRow {
  id: string;
  agentId: string;
  agentName: string;
  tool: string;
  toolLabel: string | null;
  risk: string;
  categories: ApprovalCategory[];
  summary: string;
  status: string;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  taskId: string;
  task: ApprovalTaskRef | null;
  payloadPreview: string | null;
}

const NOTE_MAX = 1000;

export function ApprovalsList({ pending, history, canApprove }: { pending: PendingApprovalRow[]; history: ApprovalHistoryRow[]; canApprove: boolean }) {
  const open = pending.filter((a) => !a.expired);
  return (
    <div className="space-y-5">
      <AutoRefresh active={pending.length > 0} seconds={30} />

      <Alert tone="blue" title="Como funciona">
        O resumo é montado a partir dos dados enviados pelo agente; o que vale é o <strong>conteúdo exato</strong> exibido em cada pedido. Ele é protegido por uma
        assinatura: se a ação for alterada depois do pedido, ela não é executada. Pedidos não decididos expiram automaticamente.
      </Alert>

      {!canApprove && pending.length > 0 && (
        <Alert tone="yellow" title="Somente leitura">
          Você pode acompanhar os pedidos, mas não tem permissão para aprovar ou rejeitar ações da Equipe IA.
        </Alert>
      )}

      <section aria-labelledby="pending-approvals">
        <div className="mb-2 flex items-center gap-2">
          <h2 id="pending-approvals" className="text-sm font-semibold">
            Pendentes
          </h2>
          <Badge tone={open.length ? 'yellow' : 'gray'}>{open.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Nenhuma aprovação pendente"
              description="Quando um agente precisar executar uma ação sensível, o pedido aparece aqui com o conteúdo exato que será executado."
            />
          </Card>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a.id}>
                <PendingApprovalCard approval={a} canApprove={canApprove} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="approval-history">
        <Card>
          <CardHeader
            title={
              <span id="approval-history" className="inline-flex items-center gap-1.5">
                <History className="h-4 w-4 text-fg-muted" aria-hidden /> Histórico
              </span>
            }
            description="Decisões mais recentes (aprovadas, rejeitadas e expiradas)."
          />
          {history.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-fg-muted">Nenhuma decisão registrada ainda.</p>
          ) : (
            <ul className="divide-y">
              {history.map((a) => (
                <HistoryItem key={a.id} approval={a} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function ToolName({ tool, label }: { tool: string; label: string | null }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1">
      {label && <span className="font-medium text-fg">{label}</span>}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-fg-muted">{tool}</code>
    </span>
  );
}

function TaskLinks({ taskId, task }: { taskId: string; task: ApprovalTaskRef | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link href={`/ai-team/tasks/${taskId}`} className="inline-flex min-w-0 items-center gap-1 font-medium text-brand hover:underline">
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">Tarefa{task ? `: ${task.title}` : ''}</span>
      </Link>
      {task?.objectiveId && (
        <Link href={`/ai-team/objectives/${task.objectiveId}`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden /> Objetivo
        </Link>
      )}
    </span>
  );
}

function PendingApprovalCard({ approval: a, canApprove }: { approval: PendingApprovalRow; canApprove: boolean }) {
  const uid = useId();
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [viewedFull, setViewedFull] = useState(false);
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);
  const decide = useAction((decision: 'approve' | 'reject', text?: string) => decideApprovalAction(a.id, decision, text));

  const sensitive = a.categories.length > 0;
  const needsConfirmation = a.risk === 'critical' || sensitive;
  const truncated = a.payloadFull !== null;
  const shown = showFull && a.payloadFull ? a.payloadFull : a.payloadPreview;
  const canDecide = canApprove && !a.expired;
  // Prévia encurtada: só aprova quem abriu o conteúdo completo.
  const mustViewFull = truncated && !viewedFull;
  const approveBlocked = (needsConfirmation && !confirmed) || mustViewFull;

  const submit = async (decision: 'approve' | 'reject') => {
    setDeciding(decision);
    const trimmed = note.trim();
    await decide.run(decision, trimmed ? trimmed.slice(0, NOTE_MAX) : undefined);
    setDeciding(null);
  };

  return (
    <Card className={sensitive || a.risk === 'critical' ? 'border-danger/40' : undefined}>
      <div className="flex flex-col gap-1.5 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge map={RISK} value={a.risk} />
          {a.categories.map((c) => (
            <Badge key={c.key} tone="red">
              <ShieldAlert className="h-3 w-3" aria-hidden /> {c.label}
            </Badge>
          ))}
          {a.expired && (
            <Badge tone="gray">
              <Clock className="h-3 w-3" aria-hidden /> Prazo expirado
            </Badge>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm font-semibold">{a.summary}</p>
        <p className="text-xs text-fg-muted">
          <Link href={`/ai-team/agents/${a.agentId}`} className="font-medium text-fg hover:underline">
            {a.agentName}
          </Link>{' '}
          quer usar <ToolName tool={a.tool} label={a.toolLabel} />
        </p>
      </div>

      <div className="space-y-3 px-4 py-3">
        {a.reason && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">Motivo da aprovação</p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{a.reason}</p>
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted" id={`${uid}-payload`}>
              Conteúdo exato que será executado
            </p>
            {truncated && (
              <button
                type="button"
                onClick={() => {
                  setShowFull((v) => !v);
                  setViewedFull(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                aria-expanded={showFull}
                aria-controls={`${uid}-pre`}
              >
                {showFull ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
                {showFull ? 'Mostrar menos' : 'Mostrar conteúdo completo'}
              </button>
            )}
          </div>
          <pre
            id={`${uid}-pre`}
            aria-labelledby={`${uid}-payload`}
            tabIndex={0}
            className="scrollbar-thin mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed"
          >
            {shown}
          </pre>
          {truncated && !showFull && (
            <p className="mt-1 text-[11px] text-warning">
              Prévia encurtada ({a.payloadPreview.length.toLocaleString('pt-BR')} de {a.payloadLength.toLocaleString('pt-BR')} caracteres). Abra o conteúdo completo
              antes de aprovar.
            </p>
          )}
          {showFull && a.payloadOverLimit && (
            <p className="mt-1 text-[11px] text-warning">
              Conteúdo muito longo: exibidos {(a.payloadFull ?? '').length.toLocaleString('pt-BR')} de {a.payloadLength.toLocaleString('pt-BR')} caracteres. Na dúvida,
              rejeite e peça uma versão menor.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-[11px] text-fg-muted sm:flex-row sm:flex-wrap sm:gap-x-4">
          <TaskLinks taskId={a.taskId} task={a.task} />
          <span>
            Pedida <Time date={a.createdAt} />
          </span>
          <span>
            {a.expired ? 'Expirou em' : 'Expira em'} <Time date={a.expiresAt} mode="datetime" />
          </span>
        </div>

        {a.expired ? (
          <Alert tone="gray" title="Prazo de aprovação expirado">
            Este pedido não pode mais ser aprovado e será encerrado automaticamente. Se a ação ainda for necessária, reprocesse a tarefa.
          </Alert>
        ) : canDecide ? (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <Field label="Nota da decisão (opcional)" htmlFor={`${uid}-note`} hint="Fica registrada no histórico e na auditoria. Recomendada ao rejeitar.">
              <Textarea
                id={`${uid}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={NOTE_MAX}
                rows={2}
                className="min-h-[60px]"
                placeholder="Ex.: aprovado conforme combinado com o cliente / ajuste o valor antes de enviar"
              />
            </Field>
            {needsConfirmation && (
              <div className="rounded-md border border-danger/30 bg-danger/5 p-2.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  {a.risk === 'critical' ? 'Ação crítica' : 'Ação sensível'}: confirme que revisou o conteúdo exato acima.
                </p>
                <Checkbox
                  label="Revisei o conteúdo exato e autorizo a execução"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="text-xs"
                />
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => submit('reject')} loading={decide.pending && deciding === 'reject'} disabled={decide.pending}>
                <X className="h-4 w-4" aria-hidden /> Rejeitar
              </Button>
              <Button
                onClick={() => submit('approve')}
                loading={decide.pending && deciding === 'approve'}
                disabled={decide.pending || approveBlocked}
                title={mustViewFull ? 'Abra o conteúdo completo antes de aprovar' : needsConfirmation && !confirmed ? 'Marque a confirmação para aprovar' : undefined}
              >
                <Check className="h-4 w-4" aria-hidden /> Aprovar e executar
              </Button>
            </div>
          </div>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Aguardando a decisão de alguém com permissão de aprovação.
          </p>
        )}
      </div>
    </Card>
  );
}

function HistoryItem({ approval: a }: { approval: ApprovalHistoryRow }) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge map={APPROVAL_STATUS} value={a.status} />
        <StatusBadge map={RISK} value={a.risk} />
        {a.categories.map((c) => (
          <Badge key={c.key} tone="red">
            {c.label}
          </Badge>
        ))}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{a.summary}</p>
      <p className="mt-0.5 text-xs text-fg-muted">
        {a.agentName} · <ToolName tool={a.tool} label={a.toolLabel} />
      </p>
      {a.decisionNote && <p className="mt-1 whitespace-pre-wrap break-words text-xs">Nota: {a.decisionNote}</p>}
      <div className="mt-1 flex flex-col gap-1 text-[11px] text-fg-muted sm:flex-row sm:flex-wrap sm:gap-x-4">
        <span>
          Pedida <Time date={a.createdAt} mode="datetime" />
        </span>
        {a.decidedAt && (
          <span>
            {a.status === 'EXPIRED' ? 'Expirou' : 'Decidida'} <Time date={a.decidedAt} mode="datetime" />
          </span>
        )}
        <TaskLinks taskId={a.taskId} task={a.task} />
      </div>
      {a.payloadPreview && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[11px] font-medium text-fg-muted hover:text-fg">Conteúdo da ação</summary>
          <pre className="scrollbar-thin mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/40 p-2.5 font-mono text-[11px]">{a.payloadPreview}</pre>
        </details>
      )}
    </li>
  );
}
