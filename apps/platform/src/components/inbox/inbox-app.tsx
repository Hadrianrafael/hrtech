'use client';

import {
  ArrowLeft, Bot, CheckCheck, Check, Clock, FileText, Inbox as InboxIcon, Info, Camera, Loader2, Mail, MessageCircle, PanelRight, Pause, Play,
  RotateCcw, Search, Send, Sparkles, TriangleAlert, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moveOpportunityAction, patchContactAction } from '@/app/actions/crm';
import {
  assignConversationAction, getConversationAction, listConversationsAction, rejectSuggestionAction, sendMessageAction, sendTemplateAction,
  setAiPausedAction, setConversationStatusAction, suggestReplyAction, summarizeConversationAction,
} from '@/app/actions/inbox';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert, Avatar, Badge, EmptyState } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { fmtDateTime, timeAgo } from '@/components/shared/format';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/components/shared/labels';
import { cn, formatPhone } from '@/lib/utils';

type ListItem = Extract<Awaited<ReturnType<typeof listConversationsAction>>, { ok: true }>['data'][number];
type Detail = Extract<Awaited<ReturnType<typeof getConversationAction>>, { ok: true }>['data'];

const CHANNEL_ICON = { WHATSAPP: MessageCircle, INSTAGRAM: Camera, EMAIL: Mail, WEBCHAT: MessageCircle } as const;
const STATUS_LABELS: Record<string, string> = { NEW: 'Novo', CONTACTED: 'Contatado', IN_CONVERSATION: 'Em conversa', QUALIFIED: 'Qualificado', CUSTOMER: 'Cliente', UNQUALIFIED: 'Desqualificado', LOST: 'Perdido' };

export interface InboxProps {
  initialId: string | null;
  currentUserId: string;
  members: { id: string; name: string }[];
  stages: { id: string; name: string; pipelineId: string }[];
  can: { assign: boolean; ai: boolean; editContact: boolean; moveOpp: boolean };
  aiConfigured: boolean;
}

function ChannelBadge({ channel }: { channel: string }) {
  const Icon = CHANNEL_ICON[channel as keyof typeof CHANNEL_ICON] ?? MessageCircle;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: CHANNEL_COLORS[channel] }}>
      <Icon className="h-3 w-3" /> {CHANNEL_LABELS[channel]}
    </span>
  );
}

function within24h(iso: string | null) {
  return !!iso && Date.now() - new Date(iso).getTime() < 24 * 3600 * 1000;
}

export function InboxApp({ initialId, currentUserId, members, stages, can, aiConfigured }: InboxProps) {
  const toast = useToast();
  const [filters, setFilters] = useState({ channel: '', status: '', assignee: '', q: '' });
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(initialId);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const names = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  const loadList = useCallback(async () => {
    const r = await listConversationsAction({ ...filters, waiting: undefined });
    if (r.ok) setItems(r.data);
  }, [filters]);

  const loadDetail = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    const r = await getConversationAction(id);
    if (!silent) setLoadingDetail(false);
    if (r.ok) setDetail(r.data);
    else if (!silent) toast.error(r.error);
  }, [toast]);

  useEffect(() => {
    void loadList();
    const t = setInterval(() => document.visibilityState === 'visible' && void loadList(), 8000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!selected) return setDetail(null);
    void loadDetail(selected);
    const url = new URL(window.location.href);
    url.searchParams.set('c', selected);
    window.history.replaceState(null, '', url);
    const t = setInterval(() => document.visibilityState === 'visible' && void loadDetail(selected, true), 4000);
    return () => clearInterval(t);
  }, [selected, loadDetail]);

  const refresh = async () => {
    if (selected) await loadDetail(selected, true);
    await loadList();
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] overflow-hidden border-t bg-surface sm:-m-6">
      {/* Lista */}
      <aside className={cn('flex w-full flex-col border-r md:w-80 lg:w-96', selected && 'hidden md:flex')}>
        <div className="space-y-2 border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-fg-muted" />
            <Input
              placeholder="Buscar conversas…"
              className="pl-8"
              defaultValue={filters.q}
              onKeyDown={(e) => e.key === 'Enter' && setFilters((f) => ({ ...f, q: (e.target as HTMLInputElement).value }))}
              aria-label="Buscar conversas"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto text-xs scrollbar-thin" role="tablist" aria-label="Canal">
            {[['', 'Todas'], ['WHATSAPP', 'WhatsApp'], ['INSTAGRAM', 'Instagram'], ['EMAIL', 'E-mail'], ['WEBCHAT', 'Site']].map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={filters.channel === k}
                onClick={() => setFilters((f) => ({ ...f, channel: k! }))}
                className={cn('whitespace-nowrap rounded-full px-2.5 py-1 font-medium', filters.channel === k ? 'bg-brand text-brand-fg' : 'bg-muted text-fg-muted hover:text-fg')}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="h-8 text-xs" aria-label="Status">
              <option value="">Abertas</option>
              <option value="RESOLVED">Resolvidas</option>
              <option value="all">Todas</option>
            </Select>
            <Select value={filters.assignee} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))} className="h-8 text-xs" aria-label="Responsável">
              <option value="">Todos</option>
              <option value="me">Minhas</option>
              <option value="unassigned">Sem responsável</option>
              {can.assign && members.filter((m) => m.id !== currentUserId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto scrollbar-thin" aria-label="Conversas">
          {items === null && <li className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-fg-muted" /></li>}
          {items?.length === 0 && <EmptyState icon={<InboxIcon className="h-5 w-5" />} title="Nenhuma conversa" description="As mensagens dos canais conectados aparecem aqui." />}
          {items?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelected(c.id)}
                className={cn('flex w-full gap-3 border-b px-3 py-3 text-left transition hover:bg-muted/60', selected === c.id && 'bg-brand-soft/50')}
              >
                <Avatar name={c.contactName} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn('flex-1 truncate text-sm', c.unread ? 'font-semibold' : 'font-medium')}>{c.contactName}</span>
                    <span className="shrink-0 text-[11px] text-fg-muted">{c.lastMessageAt ? timeAgo(c.lastMessageAt) : ''}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="flex-1 truncate text-xs text-fg-muted">{c.preview ?? 'Sem mensagens'}</span>
                    {c.unread > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-fg">{c.unread}</span>}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <ChannelBadge channel={c.channel} />
                    {c.humanRequested && <Badge tone="red">Pediu humano</Badge>}
                    {c.awaitingReply && !c.humanRequested && <Badge tone="yellow">Aguardando</Badge>}
                    {c.status === 'RESOLVED' && <Badge tone="green">Resolvida</Badge>}
                    <span className="text-[11px] text-fg-muted">{c.assigneeId ? names.get(c.assigneeId) ?? '' : 'Sem responsável'}</span>
                    {c.tags.slice(0, 2).map((t) => <Badge key={t.name} color={t.color}>{t.name}</Badge>)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat */}
      <section className={cn('flex min-w-0 flex-1 flex-col', !selected && 'hidden md:flex')}>
        {!selected ? (
          <EmptyState className="flex-1" icon={<MessageCircle className="h-5 w-5" />} title="Selecione uma conversa" description="WhatsApp, Instagram, e-mail e chat do site em um só lugar." />
        ) : !detail || loadingDetail ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-fg-muted" /></div>
        ) : (
          <ChatPane
            key={detail.id}
            detail={detail}
            names={names}
            members={members}
            currentUserId={currentUserId}
            can={can}
            aiConfigured={aiConfigured}
            onBack={() => setSelected(null)}
            onTogglePanel={() => setShowPanel((v) => !v)}
            onChanged={refresh}
          />
        )}
      </section>

      {/* Painel do contato */}
      {detail && selected && (
        <aside className={cn('w-80 shrink-0 overflow-y-auto border-l scrollbar-thin', showPanel ? 'fixed inset-y-0 right-0 z-40 bg-surface shadow-pop xl:static xl:shadow-none' : 'hidden xl:block')}>
          <ContactPanel key={detail.contact.id + (detail.contact.ownerId ?? '')} detail={detail} members={members} stages={stages} can={can} onClose={() => setShowPanel(false)} onChanged={refresh} />
        </aside>
      )}
    </div>
  );
}

function ChatPane({
  detail, names, members, currentUserId, can, aiConfigured, onBack, onTogglePanel, onChanged,
}: {
  detail: Detail;
  names: Map<string, string>;
  members: { id: string; name: string }[];
  currentUserId: string;
  can: InboxProps['can'];
  aiConfigured: boolean;
  onBack: () => void;
  onTogglePanel: () => void;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [suggestion, setSuggestion] = useState<{ runId: string; sources: string[]; intent: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(detail.summary);
  const [template, setTemplate] = useState({ name: '', language: 'pt_BR', params: '' });
  const bottom = useRef<HTMLDivElement>(null);
  const lastId = detail.messages[detail.messages.length - 1]?.id;
  useEffect(() => bottom.current?.scrollIntoView({ block: 'end' }), [lastId]);

  const windowOpen = detail.channel === 'WHATSAPP' || detail.channel === 'INSTAGRAM' ? within24h(detail.lastInboundAt) : true;

  const exec = async <T,>(key: string, fn: () => Promise<{ ok: true; data: T; message?: string } | { ok: false; error: string }>, success?: string) => {
    setBusy(key);
    const r = await fn();
    setBusy(null);
    if (!r.ok) {
      toast.error(r.error);
      return null;
    }
    if (success || r.message) toast.success(success ?? r.message!);
    return r.data;
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const ok = await exec('send', () => sendMessageAction(detail.id, body, suggestion?.runId));
    if (ok !== null) {
      setText('');
      setSuggestion(null);
      await onChanged();
    }
  };

  const suggest = async () => {
    if (suggestion) await rejectSuggestionAction(suggestion.runId);
    const r = await exec('suggest', () => suggestReplyAction(detail.id));
    if (r) {
      setText(r.reply);
      setSuggestion({ runId: r.runId, sources: r.sources, intent: r.intent });
    }
  };

  return (
    <>
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <button type="button" onClick={onBack} className="rounded p-1 hover:bg-muted md:hidden" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></button>
        <Avatar name={detail.contact.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{detail.contact.name}</p>
          <div className="flex items-center gap-2">
            <ChannelBadge channel={detail.channel} />
            {detail.subject && <span className="truncate text-xs text-fg-muted">· {detail.subject}</span>}
          </div>
        </div>
        <Select
          value={detail.assigneeId ?? ''}
          onChange={async (e) => (await exec('assign', () => assignConversationAction(detail.id, e.target.value || null))) !== null && onChanged()}
          className="hidden h-8 w-40 text-xs sm:block"
          aria-label="Responsável"
          disabled={!can.assign && detail.assigneeId !== null && detail.assigneeId !== currentUserId}
        >
          <option value="">Sem responsável</option>
          {(can.assign ? members : members.filter((m) => m.id === currentUserId)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
        <Button
          size="sm"
          variant="outline"
          title={detail.aiPaused ? 'Reativar IA nesta conversa' : 'Pausar IA (atendimento humano)'}
          loading={busy === 'ai'}
          onClick={async () => (await exec('ai', () => setAiPausedAction(detail.id, !detail.aiPaused))) !== null && onChanged()}
        >
          {detail.aiPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span className="hidden lg:inline">{detail.aiPaused ? 'Reativar IA' : 'Pausar IA'}</span>
        </Button>
        {detail.status !== 'RESOLVED' ? (
          <Button size="sm" loading={busy === 'status'} onClick={async () => (await exec('status', () => setConversationStatusAction(detail.id, 'RESOLVED'))) !== null && onChanged()}>
            <CheckCheck className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Resolver</span>
          </Button>
        ) : (
          <Button size="sm" variant="outline" loading={busy === 'status'} onClick={async () => (await exec('status', () => setConversationStatusAction(detail.id, 'OPEN'))) !== null && onChanged()}>
            <RotateCcw className="h-3.5 w-3.5" /> Reabrir
          </Button>
        )}
        <button type="button" onClick={onTogglePanel} className="rounded p-1.5 hover:bg-muted xl:hidden" aria-label="Dados do contato"><PanelRight className="h-4 w-4" /></button>
      </header>

      {detail.humanRequested && (
        <div className="flex items-center gap-2 border-b bg-danger/10 px-4 py-2 text-xs text-danger">
          <UserRound className="h-4 w-4" /> O cliente pediu atendimento humano — a IA está pausada nesta conversa.
        </div>
      )}
      {summary && (
        <div className="border-b bg-muted/50 px-4 py-2 text-xs">
          <p className="mb-0.5 flex items-center gap-1 font-medium"><FileText className="h-3.5 w-3.5" /> Resumo da IA</p>
          <p className="whitespace-pre-wrap text-fg-muted">{summary}</p>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto bg-bg/60 p-4 scrollbar-thin">
        {detail.messages.map((m) => {
          const out = m.direction === 'OUTBOUND';
          const system = m.senderType === 'SYSTEM';
          return (
            <div key={m.id} className={cn('flex', out ? 'justify-end' : 'justify-start', system && 'justify-center')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                  system ? 'bg-muted text-xs text-fg-muted' : out ? (m.senderType === 'AI' ? 'rounded-br-sm border border-brand/30 bg-brand-soft' : 'rounded-br-sm bg-brand text-brand-fg') : 'rounded-bl-sm bg-surface',
                )}
              >
                {m.senderType === 'AI' && <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase text-brand"><Bot className="h-3 w-3" /> Assistente IA</p>}
                {out && m.senderType === 'USER' && m.senderUserId && <p className="mb-0.5 text-[10px] font-medium opacity-80">{names.get(m.senderUserId)}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                {m.hasMedia && (
                  <a href={`/api/app/media/${m.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline">Abrir mídia</a>
                )}
                <p className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', out && m.senderType === 'USER' ? 'text-brand-fg/80' : 'text-fg-muted')}>
                  {fmtDateTime(m.createdAt)}
                  {out && m.status === 'FAILED' && <TriangleAlert className="h-3 w-3 text-danger" aria-label="Falhou" />}
                  {out && m.status === 'SENT' && <Check className="h-3 w-3" aria-label="Enviada" />}
                  {out && (m.status === 'DELIVERED' || m.status === 'READ') && <CheckCheck className={cn('h-3 w-3', m.status === 'READ' && 'text-info')} aria-label={m.status === 'READ' ? 'Lida' : 'Entregue'} />}
                  {out && m.status === 'QUEUED' && <Clock className="h-3 w-3" aria-label="Na fila" />}
                </p>
                {m.status === 'FAILED' && m.error && <p className="mt-1 text-[11px] text-danger">{m.error}</p>}
              </div>
            </div>
          );
        })}
        {!detail.messages.length && <p className="py-10 text-center text-xs text-fg-muted">Nenhuma mensagem ainda. Envie a primeira mensagem abaixo.</p>}
        <div ref={bottom} />
      </div>

      <footer className="border-t p-3">
        {!windowOpen ? (
          <div className="space-y-2">
            <Alert tone="yellow" title="Fora da janela de 24 horas">
              {detail.channel === 'WHATSAPP'
                ? 'O cliente não enviou mensagens nas últimas 24h. Pela política da Meta, só é possível enviar um template aprovado.'
                : 'O Instagram só permite responder até 24h após a última mensagem do cliente.'}
            </Alert>
            {detail.channel === 'WHATSAPP' && (
              <form
                className="grid gap-2 sm:grid-cols-[1fr_100px_1fr_auto]"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await exec('template', () => sendTemplateAction(detail.id, template.name, template.language, template.params.split('|').map((p) => p.trim()).filter(Boolean)));
                  if (ok !== null) await onChanged();
                }}
              >
                <Input placeholder="Nome do template" value={template.name} onChange={(e) => setTemplate((t) => ({ ...t, name: e.target.value }))} required aria-label="Nome do template" />
                <Input placeholder="Idioma" value={template.language} onChange={(e) => setTemplate((t) => ({ ...t, language: e.target.value }))} aria-label="Idioma" />
                <Input placeholder="Parâmetros (separe com |)" value={template.params} onChange={(e) => setTemplate((t) => ({ ...t, params: e.target.value }))} aria-label="Parâmetros" />
                <Button type="submit" loading={busy === 'template'}>Enviar template</Button>
              </form>
            )}
          </div>
        ) : (
          <>
            {suggestion && (
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-brand">
                <Sparkles className="h-3 w-3" /> Sugestão da IA (intenção: {suggestion.intent}){suggestion.sources.length ? ` · fontes: ${suggestion.sources.join(', ')}` : ''} — revise antes de enviar.
                <button type="button" onClick={() => { void rejectSuggestionAction(suggestion.runId); setSuggestion(null); setText(''); }} className="ml-auto text-fg-muted hover:text-fg" aria-label="Descartar sugestão"><X className="h-3 w-3" /></button>
              </p>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={detail.channel === 'EMAIL' ? 'Escreva o e-mail…' : 'Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)'}
                rows={2}
                className="min-h-[44px] flex-1 resize-none"
                aria-label="Mensagem"
              />
              <Button onClick={() => void send()} loading={busy === 'send'} disabled={!text.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
            </div>
            {can.ai && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" loading={busy === 'suggest'} onClick={() => void suggest()} disabled={!aiConfigured} title={aiConfigured ? '' : 'IA não configurada'}>
                  <Sparkles className="h-3.5 w-3.5" /> Sugerir resposta
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy === 'summary'}
                  disabled={!aiConfigured}
                  onClick={async () => {
                    const r = await exec('summary', () => summarizeConversationAction(detail.id));
                    if (r) setSummary(r.summary + (r.nextAction ? `\nPróximo passo: ${r.nextAction}` : ''));
                  }}
                >
                  <FileText className="h-3.5 w-3.5" /> Resumir conversa
                </Button>
                {!aiConfigured && <span className="flex items-center gap-1 text-[11px] text-fg-muted"><Info className="h-3 w-3" /> IA pendente de credencial (OPENAI_API_KEY)</span>}
              </div>
            )}
          </>
        )}
      </footer>
    </>
  );
}

function ContactPanel({
  detail, members, stages, can, onClose, onChanged,
}: {
  detail: Detail;
  members: { id: string; name: string }[];
  stages: { id: string; name: string; pipelineId: string }[];
  can: InboxProps['can'];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const c = detail.contact;
  const [form, setForm] = useState({
    name: c.name, email: c.email ?? '', phone: c.phone ?? '', status: c.status, ownerId: c.ownerId ?? '', interest: c.interest ?? '',
    potentialValue: c.potentialValue?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const r = await patchContactAction(c.id, { ...form, ownerId: form.ownerId || null });
    setSaving(false);
    if (r.ok) {
      toast.success('Contato atualizado.');
      await onChanged();
    } else toast.error(r.error);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size={44} />
          <div>
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-fg-muted">{STATUS_LABELS[c.status]}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted xl:hidden" aria-label="Fechar"><X className="h-4 w-4" /></button>
      </div>
      <div className="mb-4 space-y-1 text-xs text-fg-muted">
        {c.whatsapp && <p>WhatsApp: {formatPhone(c.whatsapp)}</p>}
        {c.instagram && <p>Instagram: @{c.instagram}</p>}
        {c.city && <p>Cidade: {c.city}</p>}
        {Object.entries(c.customFields ?? {}).filter(([, v]) => v).map(([k, v]) => <p key={k}>{k}: {String(v)}</p>)}
        {c.tags.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{c.tags.map((t) => <Badge key={t.id} color={t.color}>{t.name}</Badge>)}</div>}
      </div>

      {can.editContact && (
        <div className="space-y-2.5 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Atualizar CRM</p>
          <Field label="Nome"><Input value={form.name} onChange={set('name')} /></Field>
          <Field label="E-mail"><Input value={form.email} onChange={set('email')} type="email" /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Responsável">
            <Select value={form.ownerId} onChange={set('ownerId')}>
              <option value="">Sem responsável</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Interesse"><Input value={form.interest} onChange={set('interest')} /></Field>
          <Field label="Valor potencial (R$)"><Input value={form.potentialValue} onChange={set('potentialValue')} inputMode="decimal" /></Field>
          <Button size="sm" onClick={() => void save()} loading={saving} className="w-full justify-center">Salvar no CRM</Button>
        </div>
      )}

      <div className="mt-4 space-y-2 border-t pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Oportunidades</p>
        {c.opportunities.map((o) => (
          <div key={o.id} className="rounded-lg border p-2.5">
            <p className="mb-1.5 text-sm font-medium">{o.title}</p>
            <Select
              value={o.stageId}
              disabled={!can.moveOpp}
              className="h-8 text-xs"
              aria-label="Etapa"
              onChange={async (e) => {
                const r = await moveOpportunityAction(o.id, e.target.value);
                if (r.ok) {
                  toast.success('Etapa atualizada.');
                  await onChanged();
                } else toast.error(r.error);
              }}
            >
              {stages.filter((s) => s.pipelineId === o.pipelineId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        ))}
        {!c.opportunities.length && <p className="text-xs text-fg-muted">Nenhuma oportunidade aberta.</p>}
      </div>
      <Link href={`/contacts/${c.id}`} className="mt-4 block text-center text-xs text-brand hover:underline">Abrir ficha completa e timeline →</Link>
    </div>
  );
}
