'use client';

import { Brain, Cpu, ListTodo, Pin, ShieldAlert, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Badge, Card, CardHeader, type Tone } from '@/components/ui/misc';
import { Time } from '@/components/shared/time';
import { RISK, StatusBadge, TASK_STATUS, usd } from './shared';
import { fmtTokens } from './team-overview';

// ─────────────── Tipos ───────────────

export interface AgentTaskRow {
  id: string;
  title: string;
  kind: string;
  status: string;
  error: string | null;
  costMicroUsd: number;
  objectiveTitle: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AgentRunRow {
  id: string;
  taskId: string;
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
}

export interface AgentToolCallRow {
  id: string;
  taskId: string;
  tool: string;
  risk: string;
  status: string;
  error: string | null;
  suspicious: boolean;
  createdAt: string;
}

export interface AgentMemoryRow {
  id: string;
  kind: string;
  title: string | null;
  content: string;
  source: string;
  importance: number;
  pinned: boolean;
  updatedAt: string;
}

export interface AgentHistoryData {
  tasks: AgentTaskRow[];
  runs: AgentRunRow[];
  toolCalls: AgentToolCallRow[];
  memories: AgentMemoryRow[];
  memoryKinds: Record<string, string>;
}

// ─────────────── Rótulos ───────────────

const RUN_STATUS: Record<string, { label: string; tone: Tone }> = {
  RUNNING: { label: 'Executando', tone: 'blue' },
  SUCCEEDED: { label: 'Concluída', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  WAITING_EXTERNAL: { label: 'Aguardando n8n', tone: 'blue' },
  WAITING_CHILDREN: { label: 'Aguardando subtarefas', tone: 'blue' },
  BLOCKED: { label: 'Bloqueada', tone: 'yellow' },
  CANCELLED: { label: 'Cancelada', tone: 'gray' },
};

const TOOL_STATUS: Record<string, { label: string; tone: Tone }> = {
  EXECUTED: { label: 'Executada', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  PENDING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  APPROVED: { label: 'Aprovada', tone: 'blue' },
  REJECTED: { label: 'Rejeitada', tone: 'gray' },
  BLOCKED: { label: 'Bloqueada', tone: 'red' },
  WAITING_EXTERNAL: { label: 'Aguardando n8n', tone: 'blue' },
};

const TASK_KIND: Record<string, string> = { plan: 'Planejamento', work: 'Execução', review: 'Revisão', briefing: 'Briefing' };
const RUN_MODE: Record<string, string> = { llm: 'IA', playbook: 'Roteiro' };
const MEMORY_SOURCE: Record<string, string> = { USER: 'Equipe', AGENT: 'Aprendizado do agente', SYSTEM: 'Sistema' };

function latency(ms: number) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-xs text-fg-muted">{text}</p>;
}

// ─────────────── Seções ───────────────

export function AgentHistory({ data, catalog }: { data: AgentHistoryData; catalog: { key: string; label: string }[] }) {
  const toolLabel = new Map(catalog.map((t) => [t.key, t.label]));
  const suspicious = data.toolCalls.filter((t) => t.suspicious).length;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <ListTodo className="h-4 w-4 text-fg-muted" aria-hidden /> Tarefas recentes
            </span>
          }
          action={
            <Link href="/ai-team/tasks" className="text-xs text-brand hover:underline">
              Todas as tarefas
            </Link>
          }
        />
        {data.tasks.length === 0 ? (
          <Empty text="Este agente ainda não recebeu tarefas." />
        ) : (
          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {data.tasks.map((t) => (
              <li key={t.id} className="px-4 py-2.5">
                <div className="flex items-start gap-2">
                  <Link href={`/ai-team/tasks/${t.id}`} className="min-w-0 flex-1 break-words text-sm font-medium hover:text-brand hover:underline">
                    {t.title}
                  </Link>
                  <StatusBadge map={TASK_STATUS} value={t.status} />
                </div>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-fg-muted">
                  <span>{TASK_KIND[t.kind] ?? t.kind}</span>
                  {t.objectiveTitle && <span className="max-w-[16rem] truncate">Objetivo: {t.objectiveTitle}</span>}
                  {t.costMicroUsd > 0 && <span>{usd(t.costMicroUsd)}</span>}
                  <Time date={t.createdAt} />
                </p>
                {t.error && t.status === 'FAILED' && <p className="mt-1 line-clamp-2 break-words text-xs text-danger">{t.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-fg-muted" aria-hidden /> Execuções
            </span>
          }
          description="Cada tentativa de execução, com modelo, passos, consumo e latência."
        />
        {data.runs.length === 0 ? (
          <Empty text="Nenhuma execução registrada." />
        ) : (
          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {data.runs.map((r) => (
              <li key={r.id} className="px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge map={RUN_STATUS} value={r.status} />
                  <Badge tone={r.mode === 'llm' ? 'brand' : 'gray'}>{RUN_MODE[r.mode] ?? r.mode}</Badge>
                  <span className="min-w-0 flex-1 truncate text-fg-muted">{r.model ? `${r.provider ?? '?'} · ${r.model}` : 'sem modelo de IA'}</span>
                  <Link href={`/ai-team/tasks/${r.taskId}`} className="text-brand hover:underline">
                    tarefa
                  </Link>
                </div>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] sm:grid-cols-4">
                  <div>
                    <dt className="inline text-fg-muted">Passos: </dt>
                    <dd className="inline font-medium">{r.steps}</dd>
                  </div>
                  <div>
                    <dt className="inline text-fg-muted">Tokens: </dt>
                    <dd className="inline font-medium" title={`${r.tokensIn} de entrada · ${r.tokensOut} de saída`}>
                      {fmtTokens(r.tokensIn + r.tokensOut)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-fg-muted">Custo: </dt>
                    <dd className="inline font-medium">{usd(r.costMicroUsd)}</dd>
                  </div>
                  <div>
                    <dt className="inline text-fg-muted">Latência: </dt>
                    <dd className="inline font-medium">{latency(r.latencyMs)}</dd>
                  </div>
                </dl>
                {r.error && <p className="mt-1 line-clamp-2 break-words text-danger">{r.error}</p>}
                <p className="mt-0.5 text-[11px] text-fg-muted">
                  Tentativa {r.attempt} · <Time date={r.startedAt} mode="datetime" />
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-fg-muted" aria-hidden /> Chamadas de ferramentas
            </span>
          }
          description="Toda ação do agente fica registrada. Conteúdo vindo de clientes, e-mails e sites é tratado como dado não confiável."
          action={
            suspicious > 0 ? (
              <Badge tone="red">
                <ShieldAlert className="h-3 w-3" aria-hidden /> {suspicious} suspeita(s)
              </Badge>
            ) : undefined
          }
        />
        {data.toolCalls.length === 0 ? (
          <Empty text="Nenhuma ferramenta usada ainda." />
        ) : (
          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {data.toolCalls.map((c) => (
              <li key={c.id} className="px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block truncate text-sm font-medium">{toolLabel.get(c.tool) ?? c.tool}</span>
                    <code className="text-[11px] text-fg-muted">{c.tool}</code>
                  </span>
                  <StatusBadge map={RISK} value={c.risk} />
                  <StatusBadge map={TOOL_STATUS} value={c.status} />
                  {c.suspicious && (
                    <Badge tone="red" className="font-semibold">
                      <ShieldAlert className="h-3 w-3" aria-hidden /> possível injeção
                    </Badge>
                  )}
                </div>
                {c.error && <p className="mt-1 line-clamp-2 break-words text-danger">{c.error}</p>}
                <p className="mt-0.5 flex gap-2 text-[11px] text-fg-muted">
                  <Time date={c.createdAt} mode="datetime" />
                  <Link href={`/ai-team/tasks/${c.taskId}`} className="text-brand hover:underline">
                    ver tarefa
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-fg-muted" aria-hidden /> Memória do agente
            </span>
          }
          description="O que este agente registrou ou recebeu como orientação específica. A memória da empresa vale para todos."
          action={
            <Link href="/ai-team/memory" className="text-xs text-brand hover:underline">
              Gerenciar memória
            </Link>
          }
        />
        {data.memories.length === 0 ? (
          <Empty text="Nenhuma memória específica deste agente." />
        ) : (
          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {data.memories.map((m) => (
              <li key={m.id} className="px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue">{data.memoryKinds[m.kind] ?? m.kind}</Badge>
                  <Badge tone={m.source === 'AGENT' ? 'yellow' : 'gray'}>{MEMORY_SOURCE[m.source] ?? m.source}</Badge>
                  {m.pinned && (
                    <Badge tone="brand">
                      <Pin className="h-3 w-3" aria-hidden /> fixada
                    </Badge>
                  )}
                  <span className="text-[11px] text-fg-muted" title="Importância (1 a 5)">
                    importância {m.importance}
                  </span>
                </div>
                {m.title && <p className="mt-1 break-words text-sm font-medium">{m.title}</p>}
                <p className="mt-0.5 line-clamp-3 whitespace-pre-line break-words text-xs text-fg-muted">{m.content}</p>
                <p className="mt-0.5 text-[11px] text-fg-muted">
                  atualizada <Time date={m.updatedAt} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
