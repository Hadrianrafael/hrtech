'use client';

import { AlertTriangle, ArrowLeft, Crown, Eye, History, Plus, Save, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { activatePromptVersionAction, createPromptVersionAction, updateAgentAction } from '@/app/actions/ai-team';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert, Avatar, Badge, Card, CardHeader } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';
import { cn } from '@/lib/utils';
import { AGENT_STATUS_LABELS, AUTONOMY_LABELS, SENSITIVE_CATEGORIES } from '@/server/ai-company/constants';
import { AgentHistory, type AgentHistoryData } from './agent-config-history';
import { AGENT_STATUS, AutoRefresh, RISK, StatusBadge, usd } from './shared';
import { autonomyShort, modelLabel } from './team-overview';

// ─────────────── Tipos ───────────────

export interface AgentLimitsInput {
  maxStepsPerRun: number | null;
  maxTokensPerTask: number | null;
  dailyBudgetCents: number | null;
  maxTasksPerAgentPerDay: number | null;
}

export interface AgentInfo {
  id: string;
  key: string;
  name: string;
  title: string;
  department: string;
  description: string;
  isCeo: boolean;
  status: string;
  autonomy: string;
  provider: string;
  model: string | null;
  tools: string[];
  limits: AgentLimitsInput;
  currentPromptId: string | null;
  updatedAt: string;
}

export interface CatalogTool {
  key: string;
  label: string;
  description: string;
  risk: string;
  categories: string[];
}

export interface AgentProviderInfo {
  name: string;
  label: string;
  configured: boolean;
  defaultModel: string;
  models: string[];
}

export interface PromptVersionRow {
  id: string;
  version: number;
  notes: string | null;
  systemPrompt: string;
  createdAt: string;
  createdByName: string | null;
}

export interface AgentDetailData {
  agent: AgentInfo;
  catalog: CatalogTool[];
  providers: AgentProviderInfo[];
  defaultProvider: string | null;
  inherited: { maxStepsPerRun: number; maxTokensPerTask: number; maxTasksPerAgentPerDay: number; companyDailyBudgetCents: number };
  prompts: PromptVersionRow[];
  history: AgentHistoryData;
  working: boolean;
}

type AgentConfigInput = Parameters<typeof updateAgentAction>[1];

const SENSITIVE = SENSITIVE_CATEGORIES as Record<string, string>;
const MODEL_RE = /^[\w.:/-]{2,80}$/;
const PROMPT_MIN = 50;
const PROMPT_MAX = 12_000;

const LIMIT_FIELDS = [
  { key: 'maxStepsPerRun', label: 'Passos por execução', min: 1, max: 20, inherited: 'maxStepsPerRun', hint: 'Chamadas de ferramenta/IA em uma mesma execução (evita loops).' },
  { key: 'maxTokensPerTask', label: 'Tokens por tarefa', min: 2_000, max: 1_000_000, inherited: 'maxTokensPerTask', hint: 'Teto de consumo de tokens somando todas as tentativas.' },
  { key: 'maxTasksPerAgentPerDay', label: 'Tarefas por dia', min: 1, max: 1000, inherited: 'maxTasksPerAgentPerDay', hint: 'Quantas tarefas este agente pode executar por dia.' },
] as const;

const usdCents = (cents: number) => usd(cents * 10_000);

// ─────────────── Página do agente ───────────────

export function AgentDetailView({ data, canManage }: { data: AgentDetailData; canManage: boolean }) {
  const { agent } = data;
  return (
    <div className="space-y-4">
      <AutoRefresh active={data.working} seconds={10} />
      <Link href="/ai-team" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Equipe IA
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Avatar name={agent.name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{agent.name}</h1>
            <StatusBadge map={AGENT_STATUS} value={agent.status} />
            {agent.isCeo && (
              <Badge tone="brand">
                <Crown className="h-3 w-3" aria-hidden /> Coordena a equipe
              </Badge>
            )}
          </div>
          <p className="text-sm text-fg-muted">
            {agent.title} · {agent.department}
          </p>
          {agent.description && <p className="mt-1 max-w-3xl text-sm">{agent.description}</p>}
          <p className="mt-1 text-xs text-fg-muted">
            {modelLabel(agent.provider, agent.model, data.providers)} · Autonomia {autonomyShort(agent.autonomy).toLowerCase()} · {agent.tools.length} ferramenta(s) · atualizado <Time date={agent.updatedAt} />
          </p>
        </div>
      </div>

      <AgentConfigForm data={data} canManage={canManage} />
      <PromptVersions agentId={agent.id} currentPromptId={agent.currentPromptId} prompts={data.prompts} canManage={canManage} />
      <AgentHistory data={data.history} catalog={data.catalog} />
    </div>
  );
}

// ─────────────── Configuração ───────────────

function toInput(n: number | null) {
  return n === null || n === undefined ? '' : String(n);
}

export function AgentConfigForm({ data, canManage }: { data: AgentDetailData; canManage: boolean }) {
  const { agent, catalog, providers } = data;
  const toast = useToast();
  const catalogKeys = useMemo(() => new Set(catalog.map((t) => t.key)), [catalog]);
  const outside = agent.tools.filter((t) => !catalogKeys.has(t));

  const [status, setStatus] = useState(agent.status);
  const [autonomy, setAutonomy] = useState(agent.autonomy);
  const [provider, setProvider] = useState(agent.provider || 'auto');
  const [model, setModel] = useState(agent.model ?? '');
  const [tools, setTools] = useState<string[]>(agent.tools.filter((t) => catalogKeys.has(t)));
  const [limits, setLimits] = useState<Record<keyof AgentLimitsInput, string>>({
    maxStepsPerRun: toInput(agent.limits.maxStepsPerRun),
    maxTokensPerTask: toInput(agent.limits.maxTokensPerTask),
    dailyBudgetCents: toInput(agent.limits.dailyBudgetCents),
    maxTasksPerAgentPerDay: toInput(agent.limits.maxTasksPerAgentPerDay),
  });
  const [error, setError] = useState<string | null>(null);

  const save = useAction((input: AgentConfigInput) => updateAgentAction(agent.id, input));
  const disabled = !canManage;

  const selectedProvider = providers.find((p) => p.name === provider);
  const modelOptions = provider === 'auto' ? [...new Set(providers.flatMap((p) => p.models))] : (selectedProvider?.models ?? []);
  const defaultForSelected = provider === 'auto' ? providers.find((p) => p.name === data.defaultProvider) : selectedProvider;
  const datalistId = `models-${agent.id}`;
  const providerHint = !defaultForSelected?.configured
    ? `PENDENTE DE CREDENCIAL${defaultForSelected ? ` (${defaultForSelected.label})` : ''} — sem chave, o agente segue roteiros determinísticos.`
    : provider === 'auto'
      ? `Usa ${defaultForSelected.label}, o provedor padrão do ambiente.`
      : 'Um modelo por agente.';

  const toggleTool = (key: string, on: boolean) => setTools((all) => (on ? [...new Set([...all, key])] : all.filter((t) => t !== key)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const m = model.trim();
    if (m && !MODEL_RE.test(m)) return fail('Modelo inválido: use apenas letras, números e . : / - _ (2 a 80 caracteres).');
    if (tools.length > 40) return fail('Selecione no máximo 40 ferramentas.');
    const out: Record<string, number> = {};
    const ranges: Record<keyof AgentLimitsInput, [number, number, string]> = {
      maxStepsPerRun: [1, 20, 'Passos por execução'],
      maxTokensPerTask: [2_000, 1_000_000, 'Tokens por tarefa'],
      dailyBudgetCents: [0, 1_000_000, 'Orçamento diário do agente'],
      maxTasksPerAgentPerDay: [1, 1000, 'Tarefas por dia'],
    };
    for (const [k, raw] of Object.entries(limits) as [keyof AgentLimitsInput, string][]) {
      const v = raw.trim();
      if (!v) continue;
      const n = Number(v);
      const [min, max, label] = ranges[k];
      if (!Number.isInteger(n) || n < min || n > max) return fail(`${label}: informe um número inteiro entre ${min.toLocaleString('pt-BR')} e ${max.toLocaleString('pt-BR')}.`);
      out[k] = n;
    }
    setError(null);
    save.run({ status: status as AgentConfigInput['status'], autonomy: autonomy as AgentConfigInput['autonomy'], provider, model: m || null, tools, limits: out });
  };

  function fail(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  return (
    <Card>
      <CardHeader
        title="Configuração do agente"
        description={canManage ? 'Status, autonomia, modelo, ferramentas permitidas e limites. Ações sensíveis sempre pedem aprovação, em qualquer autonomia.' : 'Somente leitura — alterar requer a permissão de configurar a Equipe IA.'}
      />
      <form onSubmit={submit} className="space-y-6 p-4" aria-label={`Configuração de ${agent.name}`}>
        <fieldset disabled={disabled} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" htmlFor="agent-status" hint={status === 'ACTIVE' ? 'Executa tarefas normalmente.' : status === 'PAUSED' ? 'Tarefas ficam na fila até reativar.' : 'Não executa nem recebe tarefas delegadas.'}>
              <Select id="agent-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(AGENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Provedor de IA" htmlFor="agent-provider" hint={providerHint}>
              <Select id="agent-provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="auto">Automático (padrão do ambiente)</option>
                {providers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                    {p.configured ? '' : ' — PENDENTE DE CREDENCIAL'}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Modelo" htmlFor="agent-model" hint={defaultForSelected ? `Vazio = ${defaultForSelected.defaultModel}` : 'Vazio = modelo padrão do provedor'}>
              <Input
                id="agent-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                list={datalistId}
                placeholder={defaultForSelected?.defaultModel ?? 'padrão do provedor'}
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
              />
              <datalist id={datalistId}>
                {modelOptions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          </div>
          {agent.isCeo && status !== 'ACTIVE' && (
            <Alert tone="yellow" title="O CEO Agent coordena a equipe">
              {status === 'PAUSED'
                ? 'Com o CEO pausado, novos objetivos ficam na fila sem planejamento nem delegação até a reativação.'
                : 'Com o CEO desativado, novos objetivos são recusados e o briefing diário deixa de ser gerado.'}
            </Alert>
          )}

          <fieldset>
            <legend className="label">Autonomia</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(AUTONOMY_LABELS).map(([k, label]) => {
                const [title, desc] = label.split(' — ');
                return (
                  <label
                    key={k}
                    className={cn(
                      'flex cursor-pointer gap-2 rounded-lg border p-3 text-sm transition has-[:disabled]:cursor-default',
                      autonomy === k ? 'border-brand bg-brand-soft/40' : 'hover:bg-muted/50',
                    )}
                  >
                    <input type="radio" name="autonomy" value={k} checked={autonomy === k} onChange={() => setAutonomy(k)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
                    <span>
                      <span className="block font-medium">{title}</span>
                      <span className="block text-xs text-fg-muted">{desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {autonomy === 'AUTONOMOUS' && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-fg-muted">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                Mesmo no modo autônomo, preço, desconto, contrato, pagamento, gastos, exclusões, credenciais e ações irreversíveis sempre esperam aprovação humana.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="label">
              Ferramentas permitidas{' '}
              <span className="font-normal text-fg-muted">
                ({tools.length} de {catalog.length} disponíveis para o cargo)
              </span>
            </legend>
            <p className="mb-2 text-xs text-fg-muted">
              O agente só consegue usar o que estiver marcado (allowlist). A lista se limita às ferramentas do cargo; nada fora dela pode ser liberado.
            </p>
            {canManage && (
              <div className="mb-2 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setTools(catalog.filter((t) => t.risk === 'read').map((t) => t.key))}>
                  Somente leitura
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTools(catalog.map((t) => t.key))}>
                  Marcar todas
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTools([])}>
                  Desmarcar todas
                </Button>
              </div>
            )}
            <ul className="grid gap-2 lg:grid-cols-2">
              {catalog.map((t) => {
                const checked = tools.includes(t.key);
                return (
                  <li key={t.key}>
                    <label className={cn('flex h-full cursor-pointer gap-2.5 rounded-lg border p-3 text-sm transition has-[:disabled]:cursor-default', checked ? 'border-brand/50 bg-brand-soft/20' : 'hover:bg-muted/40')}>
                      <input type="checkbox" checked={checked} onChange={(e) => toggleTool(t.key, e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border accent-[rgb(var(--brand))]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{t.label}</span>
                          <StatusBadge map={RISK} value={t.risk} />
                          {t.categories.map((c) => (
                            <Badge key={c} tone="yellow" className="font-normal">
                              {SENSITIVE[c] ?? c}
                            </Badge>
                          ))}
                        </span>
                        <code className="block text-[11px] text-fg-muted">{t.key}</code>
                        <span className="mt-0.5 block text-xs text-fg-muted">{t.description}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {catalog.some((t) => t.categories.length > 0) && <p className="mt-2 text-[11px] text-fg-muted">Etiquetas amarelas = temas sensíveis: a ação sempre passa por aprovação humana.</p>}
            {outside.length > 0 && (
              <Alert tone="yellow" title="Ferramentas fora do escopo do cargo" className="mt-3">
                {outside.join(', ')} — não podem ser usadas por este agente e serão removidas da allowlist ao salvar.
              </Alert>
            )}
          </fieldset>

          <fieldset>
            <legend className="label">Limites deste agente</legend>
            <p className="mb-2 text-xs text-fg-muted">Deixe em branco para herdar o limite da empresa (mostrado no campo).</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LIMIT_FIELDS.map((f) => (
                <Field key={f.key} label={f.label} htmlFor={`limit-${f.key}`} hint={f.hint}>
                  <Input
                    id={`limit-${f.key}`}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    step={1}
                    value={limits[f.key]}
                    onChange={(e) => setLimits((l) => ({ ...l, [f.key]: e.target.value }))}
                    placeholder={`empresa: ${data.inherited[f.inherited].toLocaleString('pt-BR')}`}
                  />
                </Field>
              ))}
              <Field
                label="Orçamento diário (centavos de US$)"
                htmlFor="limit-dailyBudgetCents"
                hint={
                  limits.dailyBudgetCents.trim() && Number.isFinite(Number(limits.dailyBudgetCents))
                    ? Number(limits.dailyBudgetCents) === 0
                      ? '0 = este agente não executa tarefas (ficam na fila).'
                      : `= ${usdCents(Number(limits.dailyBudgetCents))} por dia para este agente (centavos de dólar).`
                    : `Em centavos de dólar (500 = US$ 5.00). Vazio = sem teto próprio; vale o orçamento da empresa (${usdCents(data.inherited.companyDailyBudgetCents)}/dia).`
                }
              >
                <Input
                  id="limit-dailyBudgetCents"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1_000_000}
                  step={1}
                  value={limits.dailyBudgetCents}
                  onChange={(e) => setLimits((l) => ({ ...l, dailyBudgetCents: e.target.value }))}
                  placeholder="sem teto próprio"
                />
              </Field>
            </div>
          </fieldset>
        </fieldset>

        {error && (
          <Alert tone="red" title="Revise a configuração">
            {error}
          </Alert>
        )}
        {canManage && (
          <div className="flex justify-end">
            <Button type="submit" loading={save.pending}>
              <Save className="h-4 w-4" /> Salvar configuração
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

// ─────────────── Prompts versionados ───────────────

export function PromptVersions({ agentId, currentPromptId, prompts, canManage }: { agentId: string; currentPromptId: string | null; prompts: PromptVersionRow[]; canManage: boolean }) {
  const [viewing, setViewing] = useState<PromptVersionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const activate = useAction((versionId: string) => activatePromptVersionAction(agentId, versionId), { onSuccess: () => setActivatingId(null) });
  const active = prompts.find((p) => p.id === currentPromptId) ?? null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <History className="h-4 w-4 text-fg-muted" aria-hidden /> Prompt do agente (versionado)
          </span>
        }
        description="Cada alteração gera uma nova versão; para desfazer, ative uma versão anterior. As regras de segurança do sistema valem para qualquer versão."
        action={
          canManage && !creating ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" /> Nova versão
            </Button>
          ) : undefined
        }
      />
      {creating && (
        <NewPromptForm
          agentId={agentId}
          initial={active?.systemPrompt ?? prompts[0]?.systemPrompt ?? ''}
          nextVersion={(prompts[0]?.version ?? 0) + 1}
          onDone={() => setCreating(false)}
        />
      )}
      {prompts.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-fg-muted">Nenhuma versão de prompt registrada.</p>
      ) : (
        <ul className="divide-y">
          {prompts.map((p) => {
            const isActive = p.id === currentPromptId;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                <Badge tone={isActive ? 'green' : 'gray'}>v{p.version}</Badge>
                {isActive && <Badge tone="green">ativa</Badge>}
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm">{p.notes || <span className="text-fg-muted">Sem notas</span>}</p>
                  <p className="text-[11px] text-fg-muted">
                    <Time date={p.createdAt} mode="datetime" />
                    {p.createdByName ? ` · por ${p.createdByName}` : ''} · {p.systemPrompt.length.toLocaleString('pt-BR')} caracteres
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(p)} aria-label={`Ver o prompt da versão ${p.version}`}>
                    <Eye className="h-3.5 w-3.5" /> Ver
                  </Button>
                  {canManage && !isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={activate.pending && activatingId === p.id}
                      disabled={activate.pending}
                      onClick={() => {
                        if (!confirm(`Ativar a versão ${p.version} do prompt? O agente passa a usá-la nas próximas execuções.`)) return;
                        setActivatingId(p.id);
                        activate.run(p.id);
                      }}
                    >
                      Ativar esta versão
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Prompt — versão ${viewing.version}` : 'Prompt'} description={viewing?.notes ?? undefined} size="lg">
        {viewing && (
          <div className="space-y-3">
            {viewing.id === currentPromptId && <Badge tone="green">Versão ativa</Badge>}
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed">{viewing.systemPrompt}</pre>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function NewPromptForm({ agentId, initial, nextVersion, onDone }: { agentId: string; initial: string; nextVersion: number; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(initial);
  const [notes, setNotes] = useState('');
  const [activate, setActivate] = useState(true);
  const save = useAction((input: { systemPrompt: string; notes?: string; activate: boolean }) => createPromptVersionAction(agentId, input), {
    success: (d) => `Versão ${d.version} salva${activate ? ' e ativada' : ''}.`,
    onSuccess: onDone,
  });
  const len = text.trim().length;
  const invalid = len < PROMPT_MIN || len > PROMPT_MAX;

  return (
    <form
      className="space-y-3 border-b bg-muted/20 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid) {
          toast.error(`O prompt deve ter entre ${PROMPT_MIN} e ${PROMPT_MAX.toLocaleString('pt-BR')} caracteres.`);
          return;
        }
        save.run({ systemPrompt: text.trim(), notes: notes.trim() || undefined, activate });
      }}
    >
      <p className="text-sm font-medium">Nova versão (v{nextVersion})</p>
      <Field
        label="Prompt de sistema"
        htmlFor="new-prompt"
        hint={
          <span className={cn(invalid && len > 0 && 'text-danger')}>
            {len.toLocaleString('pt-BR')} / {PROMPT_MAX.toLocaleString('pt-BR')} caracteres (mínimo {PROMPT_MIN}). Não inclua senhas, chaves ou dados sensíveis.
          </span>
        }
      >
        <Textarea id="new-prompt" value={text} onChange={(e) => setText(e.target.value)} rows={12} maxLength={PROMPT_MAX} className="font-mono text-xs" spellCheck={false} />
      </Field>
      <Field label="O que mudou (opcional)" htmlFor="new-prompt-notes">
        <Input id="new-prompt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Ex.: tom mais consultivo nos follow-ups" />
      </Field>
      <Checkbox label="Ativar esta versão ao salvar" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
      {!activate && (
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden /> A versão fica salva no histórico, mas o agente continua usando a versão ativa atual.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.pending} disabled={invalid}>
          <Save className="h-4 w-4" /> Salvar versão
        </Button>
      </div>
    </form>
  );
}
