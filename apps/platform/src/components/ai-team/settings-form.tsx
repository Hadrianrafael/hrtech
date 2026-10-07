'use client';

import { AlertTriangle, BookOpen, Clock, Coins, Gauge, PlugZap, RefreshCw, Save, ShieldAlert, Sunrise, Webhook, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { retryDispatchAction, runWorkerNowAction, updateCompanySettingsAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader, type Tone } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { AutoRefresh, StatusBadge, usd } from './shared';

// ─────────────── Tipos ───────────────

export interface CompanyLimitsInput {
  maxStepsPerRun: number;
  maxTokensPerTask: number;
  maxDelegationDepth: number;
  maxTasksPerObjective: number;
  maxSubtasksPerTask: number;
  maxAttempts: number;
  approvalTtlHours: number;
  allowAutonomousExternal: boolean;
}

export interface BriefingInput {
  enabled: boolean;
  hour: number;
  weekdays: number[];
  recipients: string[];
  deliverViaN8n: boolean;
}

export interface WorkflowInfo {
  key: string;
  label: string;
  path: string;
}

export interface SettingsData {
  enabled: boolean;
  dailyBudgetCents: number;
  monthlyBudgetCents: number;
  limits: CompanyLimitsInput;
  briefing: BriefingInput;
  n8nEnabled: boolean;
  n8nWorkflows: Record<string, string>;
  workflows: WorkflowInfo[];
  dispatcherPath: string;
  n8n: { configured: boolean; missing: string[]; dispatcherUrl: string | null };
  callbackUrl: string;
  timezone: string;
  members: { id: string; name: string; email: string }[];
}

export interface DispatchRow {
  id: string;
  workflow: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  responseStatus: number | null;
  taskId: string | null;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
}

type SettingsInput = Parameters<typeof updateCompanySettingsAction>[0];
type WorkerSummary = Extract<Awaited<ReturnType<typeof runWorkerNowAction>>, { ok: true }>['data'];

// ─────────────── Constantes de formulário ───────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const PATH_RE = /^\/[\w\-/.]{1,200}$/;

type NumericLimit = Exclude<keyof CompanyLimitsInput, 'allowAutonomousExternal'>;

const LIMIT_FIELDS: { key: NumericLimit; label: string; min: number; max: number; hint: string }[] = [
  { key: 'maxStepsPerRun', label: 'Passos por execução', min: 1, max: 20, hint: 'Chamadas de IA/ferramenta por execução — corta loops.' },
  { key: 'maxTokensPerTask', label: 'Tokens por tarefa', min: 2_000, max: 1_000_000, hint: 'Consumo máximo de uma tarefa, somando tentativas.' },
  { key: 'maxDelegationDepth', label: 'Profundidade de delegação', min: 1, max: 3, hint: 'Quantos níveis o CEO pode delegar (CEO → agente → subtarefa).' },
  { key: 'maxTasksPerObjective', label: 'Tarefas por objetivo', min: 1, max: 60, hint: 'Teto de tarefas geradas por um único objetivo.' },
  { key: 'maxSubtasksPerTask', label: 'Subtarefas por tarefa', min: 1, max: 15, hint: 'Quantas delegações uma tarefa pode criar.' },
  { key: 'maxAttempts', label: 'Tentativas por tarefa', min: 1, max: 6, hint: 'Novas tentativas automáticas com espera crescente.' },
  { key: 'approvalTtlHours', label: 'Prazo das aprovações (horas)', min: 1, max: 336, hint: 'Depois disso a ação pendente é descartada (expira).' },
];

const DISPATCH_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Na fila', tone: 'gray' },
  SENDING: { label: 'Enviando', tone: 'blue' },
  SENT: { label: 'Enviado (aguardando retorno)', tone: 'blue' },
  COMPLETED: { label: 'Concluído', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  DEAD: { label: 'Tentativas esgotadas', tone: 'red' },
  CANCELLED: { label: 'Cancelado', tone: 'gray' },
};

const TASK_OUTCOME: Record<string, string> = {
  completed: 'concluída(s)',
  waiting_approval: 'aguardando aprovação',
  waiting_external: 'aguardando o n8n',
  blocked: 'bloqueada(s) (pausa, orçamento ou cota)',
  failed: 'com falha',
  skipped: 'ignorada(s)',
};

const DISPATCH_OUTCOME: Record<string, string> = {
  sent: 'enviado(s)',
  completed: 'concluído(s)',
  pending_credential: 'PENDENTE DE CREDENCIAL',
  retry: 'para nova tentativa',
  failed: 'com falha',
  dead: 'esgotado(s)',
  skipped: 'ignorado(s)',
};

const centsToUsd = (c: number) => (c / 100).toFixed(2);
const fmtUsd = (c: number) => usd(c * 10_000);

/** "12,50" ou "12.50" → 1250 centavos (null = inválido). */
function usdToCents(v: string): number | null {
  const t = v.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t px-4 py-4 first:border-t-0">
      <div className="flex gap-2">
        <span className="mt-0.5 text-fg-muted" aria-hidden>
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-fg-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// ─────────────── Formulário principal ───────────────

export function SettingsForm({ data }: { data: SettingsData }) {
  const toast = useToast();
  const memberIds = new Set(data.members.map((m) => m.id));

  const [enabled, setEnabled] = useState(data.enabled);
  const [dailyUsd, setDailyUsd] = useState(centsToUsd(data.dailyBudgetCents));
  const [monthlyUsd, setMonthlyUsd] = useState(centsToUsd(data.monthlyBudgetCents));
  const [limits, setLimits] = useState<Record<NumericLimit, string>>(() => {
    const out = {} as Record<NumericLimit, string>;
    for (const f of LIMIT_FIELDS) out[f.key] = String(data.limits[f.key]);
    return out;
  });
  const [allowExternal, setAllowExternal] = useState(data.limits.allowAutonomousExternal);
  const [briefingEnabled, setBriefingEnabled] = useState(data.briefing.enabled);
  const [hour, setHour] = useState(data.briefing.hour);
  const [weekdays, setWeekdays] = useState<number[]>(data.briefing.weekdays);
  // Destinatários que deixaram a empresa são descartados (o servidor só aceita membros ativos).
  const [recipients, setRecipients] = useState<string[]>(data.briefing.recipients.filter((id) => memberIds.has(id)));
  const [deliverViaN8n, setDeliverViaN8n] = useState(data.briefing.deliverViaN8n);
  const [n8nEnabled, setN8nEnabled] = useState(data.n8nEnabled);
  const [paths, setPaths] = useState<Record<string, string>>(() => Object.fromEntries(data.workflows.map((w) => [w.key, data.n8nWorkflows[w.key] ?? ''])));
  const [error, setError] = useState<string | null>(null);

  const save = useAction((input: SettingsInput) => updateCompanySettingsAction(input));
  const droppedRecipients = data.briefing.recipients.length - data.briefing.recipients.filter((id) => memberIds.has(id)).length;

  const dailyCents = usdToCents(dailyUsd);
  const monthlyCents = usdToCents(monthlyUsd);

  const fail = (msg: string) => {
    setError(msg);
    toast.error(msg);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (dailyCents === null || dailyCents > 10_000_000) return fail('Orçamento diário inválido: informe um valor em dólares entre 0 e 100.000 (ex.: 5.00).');
    if (monthlyCents === null || monthlyCents > 100_000_000) return fail('Orçamento mensal inválido: informe um valor em dólares entre 0 e 1.000.000 (ex.: 50.00).');
    const parsed = {} as Record<NumericLimit, number>;
    for (const f of LIMIT_FIELDS) {
      const n = Number(limits[f.key].trim());
      if (!limits[f.key].trim() || !Number.isInteger(n) || n < f.min || n > f.max) {
        return fail(`${f.label}: informe um número inteiro entre ${f.min.toLocaleString('pt-BR')} e ${f.max.toLocaleString('pt-BR')}.`);
      }
      parsed[f.key] = n;
    }
    if (briefingEnabled && weekdays.length === 0) return fail('Briefing diário: selecione pelo menos um dia da semana.');
    if (recipients.length > 20) return fail('Briefing diário: no máximo 20 destinatários.');
    const workflows: Record<string, string> = {};
    for (const w of data.workflows) {
      const v = (paths[w.key] ?? '').trim();
      if (v && !PATH_RE.test(v)) return fail(`Caminho do fluxo “${w.label}” inválido (ex.: ${w.path}).`);
      workflows[w.key] = v;
    }
    setError(null);
    save.run({
      enabled,
      dailyBudgetCents: dailyCents,
      monthlyBudgetCents: monthlyCents,
      limits: { ...parsed, allowAutonomousExternal: allowExternal },
      briefing: { enabled: briefingEnabled, hour, weekdays: [...weekdays].sort((a, b) => a - b), recipients, deliverViaN8n },
      n8nEnabled,
      n8nWorkflows: workflows as SettingsInput['n8nWorkflows'],
    });
  };

  return (
    <Card>
      <CardHeader title="Configurações da empresa" description="Valem para todos os agentes. Cada agente pode ter limites mais restritos na própria página." />
      <form onSubmit={submit} aria-label="Configurações da Equipe IA">
        <Section icon={<Zap className="h-4 w-4" />} title="Equipe IA">
          <Checkbox label="Equipe IA ativada" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <p className="text-xs text-fg-muted">Desativada, nenhum objetivo é aceito e nenhuma tarefa é executada. Para uma parada temporária, prefira “Pausar tudo”.</p>
        </Section>

        <Section icon={<Coins className="h-4 w-4" />} title="Orçamento de IA" description="Custo estimado das chamadas aos provedores de IA. Ao atingir o teto, as tarefas aguardam na fila até o próximo período.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Orçamento diário (US$)" htmlFor="budget-daily" hint={dailyCents === null ? 'Valor inválido.' : dailyCents === 0 ? '0 = nenhuma tarefa é executada.' : `${fmtUsd(dailyCents)} por dia.`}>
              <Input id="budget-daily" inputMode="decimal" value={dailyUsd} onChange={(e) => setDailyUsd(e.target.value)} placeholder="5.00" aria-invalid={dailyCents === null} />
            </Field>
            <Field label="Orçamento mensal (US$)" htmlFor="budget-monthly" hint={monthlyCents === null ? 'Valor inválido.' : monthlyCents === 0 ? '0 = nenhuma tarefa é executada.' : `${fmtUsd(monthlyCents)} por mês.`}>
              <Input id="budget-monthly" inputMode="decimal" value={monthlyUsd} onChange={(e) => setMonthlyUsd(e.target.value)} placeholder="50.00" aria-invalid={monthlyCents === null} />
            </Field>
          </div>
          {dailyCents !== null && monthlyCents !== null && monthlyCents > 0 && dailyCents > monthlyCents && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> O orçamento diário é maior que o mensal: o teto mensal prevalece.
            </p>
          )}
        </Section>

        <Section icon={<Gauge className="h-4 w-4" />} title="Limites de segurança" description="Protegem contra loops, excesso de tokens e delegações sem fim.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIMIT_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`company-${f.key}`} hint={f.hint}>
                <Input
                  id={`company-${f.key}`}
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  step={1}
                  required
                  value={limits[f.key]}
                  onChange={(e) => setLimits((l) => ({ ...l, [f.key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <div className={cn('rounded-lg border p-3', allowExternal ? 'border-danger/40 bg-danger/5' : '')}>
            <Checkbox label="Permitir ações externas sem aprovação para agentes autônomos" checked={allowExternal} onChange={(e) => setAllowExternal(e.target.checked)} />
            <p className="mt-1.5 flex gap-1.5 text-xs text-fg-muted">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
              <span>
                <strong className="font-medium text-fg">Atenção:</strong> agentes no modo Autônomo passam a enviar mensagens a clientes, publicar conteúdo e acionar serviços externos
                sem pedir aprovação. Preço, desconto, contrato, pagamento, gastos, exclusões, credenciais e ações irreversíveis continuam exigindo aprovação. Recomendado: desligado.
              </span>
            </p>
          </div>
        </Section>

        <Section
          icon={<Sunrise className="h-4 w-4" />}
          title="Briefing diário do CEO"
          description="Resumo do dia com leads, follow-ups, propostas, tarefas, prioridades, problemas, oportunidades e aprovações pendentes."
        >
          <Checkbox label="Gerar o briefing diário" checked={briefingEnabled} onChange={(e) => setBriefingEnabled(e.target.checked)} />
          <fieldset disabled={!briefingEnabled} className="space-y-4 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <Field label="Horário" htmlFor="briefing-hour" hint={`Fuso da empresa (${data.timezone}).`}>
                <Select id="briefing-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </Select>
              </Field>
              <fieldset>
                <legend className="label">Dias da semana</legend>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d, i) => {
                    const on = weekdays.includes(i);
                    return (
                      <label
                        key={d}
                        className={cn('inline-flex h-9 min-w-[3rem] cursor-pointer items-center justify-center rounded-lg border px-2 text-sm transition', on ? 'border-brand bg-brand-soft font-medium text-brand' : 'text-fg-muted hover:bg-muted')}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={on}
                          onChange={(e) => setWeekdays((all) => (e.target.checked ? [...new Set([...all, i])] : all.filter((x) => x !== i)))}
                          aria-label={WEEKDAY_NAMES[i]}
                        />
                        {d}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <fieldset>
              <legend className="label">Destinatários</legend>
              <p className="mb-2 text-xs text-fg-muted">O briefing fica sempre disponível na Central do CEO; os marcados também o recebem pelo n8n (e-mail/WhatsApp), se a entrega estiver ligada.</p>
              {data.members.length === 0 ? (
                <p className="text-xs text-fg-muted">Nenhum membro ativo.</p>
              ) : (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {data.members.map((m) => (
                    <li key={m.id}>
                      <Checkbox
                        label={
                          <span className="min-w-0">
                            {m.name} <span className="text-xs text-fg-muted">{m.email}</span>
                          </span>
                        }
                        checked={recipients.includes(m.id)}
                        onChange={(e) => setRecipients((all) => (e.target.checked ? [...new Set([...all, m.id])] : all.filter((x) => x !== m.id)))}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {droppedRecipients > 0 && <p className="mt-1 text-xs text-warning">{droppedRecipients} destinatário(s) que não são mais membros ativos serão removidos ao salvar.</p>}
            </fieldset>
            <div>
              <Checkbox label="Entregar o briefing pelo n8n" checked={deliverViaN8n} onChange={(e) => setDeliverViaN8n(e.target.checked)} />
              {deliverViaN8n && (!n8nEnabled || !data.n8n.configured) && (
                <p className="mt-1 text-xs text-warning">
                  {data.n8n.configured ? 'Ligue a integração com o n8n abaixo para a entrega funcionar.' : 'n8n PENDENTE DE CREDENCIAL: os envios ficam na fila até a configuração.'}
                </p>
              )}
            </div>
          </fieldset>
        </Section>

        <Section icon={<PlugZap className="h-4 w-4" />} title="Integração com o n8n" description="Ações externas (prospecção, sequências, publicações, cobranças, envio do briefing) são executadas pelo n8n.">
          <Checkbox label="Integração com o n8n ligada" checked={n8nEnabled} onChange={(e) => setN8nEnabled(e.target.checked)} />
          <div className="rounded-lg bg-muted/50 p-3 text-xs">
            <p className="font-medium">Entrada no n8n (dispatcher)</p>
            {data.n8n.dispatcherUrl ? (
              <code className="mt-0.5 block break-all">{data.n8n.dispatcherUrl}</code>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-fg-muted">
                <Badge tone="yellow">PENDENTE DE CREDENCIAL</Badge> defina {data.n8n.missing.join(' e ')} nas variáveis de ambiente do servidor.
              </p>
            )}
            {data.n8n.dispatcherUrl && !data.n8n.configured && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-fg-muted">
                <Badge tone="yellow">PENDENTE DE CREDENCIAL</Badge> defina {data.n8n.missing.join(' e ')}.
              </p>
            )}
            <p className="mt-2 font-medium">Retorno do n8n para a SaaS (callback assinado)</p>
            <code className="mt-0.5 block break-all">{data.callbackUrl}</code>
          </div>
          <fieldset>
            <legend className="label">Webhook por fluxo (opcional)</legend>
            <p className="mb-2 text-xs text-fg-muted">
              Vazio = envia ao dispatcher (<code>{data.dispatcherPath}</code>), que encaminha pelo campo <code>workflow</code>. Preencha para chamar um webhook dedicado.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.workflows.map((w) => {
                const v = (paths[w.key] ?? '').trim();
                const bad = !!v && !PATH_RE.test(v);
                return (
                  <Field key={w.key} label={w.label} htmlFor={`wf-${w.key}`} error={bad ? 'Use um caminho como /webhook/nome-do-fluxo.' : undefined}>
                    <Input
                      id={`wf-${w.key}`}
                      value={paths[w.key] ?? ''}
                      onChange={(e) => setPaths((p) => ({ ...p, [w.key]: e.target.value }))}
                      placeholder={w.path}
                      maxLength={201}
                      spellCheck={false}
                      autoComplete="off"
                      aria-invalid={bad}
                    />
                  </Field>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <div className="space-y-3 border-t px-4 py-3">
          {error && (
            <Alert tone="red" title="Revise as configurações">
              {error}
            </Alert>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={save.pending}>
              <Save className="h-4 w-4" /> Salvar configurações
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// ─────────────── Fila e envios ao n8n ───────────────

function summaryText(s: WorkerSummary) {
  const tasks = Object.entries(s.outcomes)
    .map(([k, v]) => `${v} ${TASK_OUTCOME[k] ?? k}`)
    .join(', ');
  const parts = [s.tasks ? `${s.tasks} tarefa(s) processada(s)${tasks ? ` (${tasks})` : ''}` : 'Nenhuma tarefa pronta para executar'];
  if (s.dispatches.processed) {
    const d = Object.entries(s.dispatches.outcomes)
      .map(([k, v]) => `${v} ${DISPATCH_OUTCOME[k] ?? k}`)
      .join(', ');
    parts.push(`${s.dispatches.processed} envio(s) ao n8n${d ? ` (${d})` : ''}`);
  }
  if (s.recovered) parts.push(`${s.recovered} tarefa(s) interrompida(s) recuperada(s)`);
  if (s.approvalsExpired) parts.push(`${s.approvalsExpired} aprovação(ões) expirada(s)`);
  if (s.deferred) parts.push('tempo esgotado — o restante segue no próximo ciclo');
  return `${parts.join('; ')}.`;
}

export function QueuePanel({ dispatches, workflowLabels, refreshActive }: { dispatches: DispatchRow[]; workflowLabels: Record<string, string>; refreshActive: boolean }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const runNow = useAction(() => runWorkerNowAction(), {
    success: (s) => summaryText(s),
    onSuccess: (s) => setSummary(summaryText(s)),
  });
  const toast = useToast();
  const retry = useAction((id: string) => retryDispatchAction(id), {
    success: (r) => (r.ok ? 'Envio recolocado na fila do n8n.' : null),
    onSuccess: (r) => {
      setRetrying(null);
      if (!r.ok) toast.error('Este envio não está mais com falha: atualize a página.');
    },
  });

  return (
    <div className="space-y-4">
      <AutoRefresh active={refreshActive} seconds={15} />
      <Card>
        <CardHeader
          title="Fila de execução"
          description="O agendador (cron ou n8n) processa a fila periodicamente. Use o botão para processar agora as tarefas desta empresa."
          action={
            <Button size="sm" variant="outline" onClick={() => runNow.run()} loading={runNow.pending}>
              <RefreshCw className="h-3.5 w-3.5" /> Processar fila agora
            </Button>
          }
        />
        <div className="px-4 py-3 text-xs" aria-live="polite">
          {summary ? (
            <p>
              <span className="font-medium">Última execução manual:</span> {summary}
            </p>
          ) : (
            <p className="text-fg-muted">Tarefas com falha temporária ou com o n8n fora do ar ficam na fila e são reprocessadas automaticamente, com espera crescente entre tentativas.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              <Webhook className="h-4 w-4 text-fg-muted" aria-hidden /> Envios recentes ao n8n
            </span>
          }
          description="Cada envio tem chave de idempotência (nunca duplica a ação), assinatura HMAC e novas tentativas com backoff."
        />
        {dispatches.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhum envio ao n8n ainda.</p>
        ) : (
          <ul className="divide-y">
            {dispatches.map((d) => {
              const pendingCredential = !!d.lastError?.includes('PENDENTE DE CREDENCIAL');
              const canRetry = d.status === 'FAILED' || d.status === 'DEAD';
              return (
                <li key={d.id} className="flex flex-col gap-1.5 px-4 py-3 text-xs sm:flex-row sm:items-start sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{workflowLabels[d.workflow] ?? d.workflow}</span>
                      <StatusBadge map={DISPATCH_STATUS} value={d.status} />
                      {pendingCredential && <Badge tone="yellow">PENDENTE DE CREDENCIAL</Badge>}
                    </div>
                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-fg-muted">
                      <span>
                        Tentativas: {d.attempts}/{d.maxAttempts}
                      </span>
                      {d.responseStatus !== null && <span>HTTP {d.responseStatus}</span>}
                      {d.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden /> próxima tentativa <Time date={d.nextAttemptAt} mode="datetime" />
                        </span>
                      )}
                      <span>
                        criado <Time date={d.createdAt} />
                      </span>
                      {d.taskId && (
                        <Link href={`/ai-team/tasks/${d.taskId}`} className="text-brand hover:underline">
                          ver tarefa
                        </Link>
                      )}
                    </p>
                    {d.lastError && <p className={cn('break-words', pendingCredential ? 'text-warning' : 'text-danger')}>{d.lastError}</p>}
                  </div>
                  {canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      loading={retry.pending && retrying === d.id}
                      disabled={retry.pending}
                      onClick={() => {
                        setRetrying(d.id);
                        retry.run(d.id);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reenviar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ─────────────── Ajuda ───────────────

export function N8nHelp() {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-fg-muted" aria-hidden /> Como conectar o n8n
          </span>
        }
      />
      <ol className="list-decimal space-y-1.5 py-3 pl-9 pr-4 text-xs leading-relaxed">
        <li>
          Nas variáveis de ambiente da SaaS, defina <code>N8N_BASE_URL</code>, <code>N8N_WEBHOOK_SECRET</code> (gere com <code>openssl rand -hex 32</code>) e <code>CRON_SECRET</code>. Nunca
          salve esses valores no código ou no GitHub.
        </li>
        <li>
          No n8n, importe os fluxos de <code>n8n/workflows/</code> (dispatcher, prospecção, comercial, briefing e agendador do worker) e defina <code>HRTECH_WEBHOOK_SECRET</code> (mesmo valor
          de <code>N8N_WEBHOOK_SECRET</code>), <code>HRTECH_APP_URL</code> e <code>HRTECH_CRON_SECRET</code>.
        </li>
        <li>Configure as credenciais dos serviços usados pelos fluxos (SMTP, WhatsApp Cloud API, Google Places) e ative os fluxos.</li>
        <li>Ligue “Integração com o n8n” acima e salve. Envios que estavam PENDENTES DE CREDENCIAL saem automaticamente.</li>
      </ol>
      <p className="border-t px-4 py-2.5 text-[11px] text-fg-muted">
        Guia completo, contrato de assinatura (HMAC) e formato do retorno: <code>docs/n8n/README.md</code> no repositório.
      </p>
    </Card>
  );
}
