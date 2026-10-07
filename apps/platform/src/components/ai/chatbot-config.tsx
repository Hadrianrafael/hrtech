'use client';

import { Bot, Code2, Copy, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { saveChatbotAction, testChatbotAction, type ChatbotForm } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { cn } from '@/lib/utils';

const DAY_LABELS = { mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb', sun: 'Dom' } as const;
const FIELDS: Record<string, string> = {
  name: 'Nome', phone: 'Telefone', email: 'E-mail', interest: 'Interesse', service: 'Serviço', budget: 'Orçamento', desiredDate: 'Data desejada',
  checkIn: 'Check-in', checkOut: 'Check-out', guests: 'Nº de hóspedes', roomType: 'Tipo de acomodação',
};
const CHANNELS = { WEBCHAT: 'Chat do site', WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', EMAIL: 'E-mail' } as const;

export function ChatbotConfig({ initial, publicKey, appUrl, aiConfigured }: { initial: ChatbotForm; publicKey: string; appUrl: string; aiConfigured: boolean }) {
  const toast = useToast();
  const [f, setF] = useState<ChatbotForm>(initial);
  const save = useAction(() => saveChatbotAction(f));
  const set = <K extends keyof ChatbotForm>(k: K, v: ChatbotForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggleIn = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const widgetCode = `<script src="${appUrl}/widget.js" data-key="${publicKey}" async></script>`;
  const formCode = `<form data-hrtech-form="${publicKey}">\n  <input name="name" placeholder="Nome" required>\n  <input name="email" type="email" placeholder="E-mail">\n  <input name="phone" placeholder="WhatsApp">\n  <textarea name="message" placeholder="Mensagem"></textarea>\n  <label><input type="checkbox" name="consent" required> Autorizo o contato</label>\n  <button type="submit">Enviar</button>\n</form>\n<script src="${appUrl}/widget.js" data-key="${publicKey}" data-form-only="true" async></script>`;
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success('Copiado!'));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {!aiConfigured && (
          <Alert tone="yellow" title="IA pendente de credencial">
            Configure OPENAI_API_KEY no servidor para habilitar respostas automáticas, sugestões e resumos. O chat do site, a captura de leads e a transferência para humanos funcionam sem IA.
          </Alert>
        )}
        <Card>
          <CardHeader title="Assistente" description="Identidade, comportamento e modo de operação" />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label="Nome do assistente"><Input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Personalidade / tom"><Input value={f.tone} onChange={(e) => set('tone', e.target.value)} placeholder="cordial e objetivo" /></Field>
            <Field label="Mensagem inicial" className="sm:col-span-2"><Textarea value={f.greeting} onChange={(e) => set('greeting', e.target.value)} rows={2} /></Field>
            <Field label="Instruções para a IA" className="sm:col-span-2" hint="Regras do negócio, o que oferecer, como conduzir, quando não responder.">
              <Textarea value={f.instructions} onChange={(e) => set('instructions', e.target.value)} rows={5} />
            </Field>
            <div className="sm:col-span-2">
              <p className="label">Modo de operação</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ['OFF', 'Desligado', 'A IA não atua nas conversas.'],
                  ['COPILOT', 'Copiloto', 'A IA sugere respostas; o atendente aprova.'],
                  ['AUTO', 'Automático', 'A IA responde sozinha dentro das regras.'],
                ] as const).map(([k, label, desc]) => (
                  <button key={k} type="button" onClick={() => set('mode', k)} className={cn('rounded-lg border p-3 text-left transition', f.mode === k ? 'border-brand bg-brand-soft/50' : 'hover:bg-muted')}>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-fg-muted">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Checkbox className="sm:col-span-2" label={<span>Assistente <strong>ativado</strong> (liga/desliga a IA em todos os canais)</span>} checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Canais e coleta de dados" />
          <div className="space-y-4 p-4">
            <div>
              <p className="label">Canais em que o assistente fica ativo</p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(CHANNELS) as (keyof typeof CHANNELS)[]).map((c) => (
                  <Checkbox key={c} label={CHANNELS[c]} checked={f.channels.includes(c)} onChange={() => set('channels', toggleIn(f.channels, c))} />
                ))}
              </div>
            </div>
            <div>
              <p className="label">Informações que a IA deve coletar (vão automaticamente para o CRM)</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(FIELDS).map(([k, v]) => {
                  const on = f.collectFields.includes(k);
                  return (
                    <button key={k} type="button" onClick={() => set('collectFields', toggleIn(f.collectFields, k))} aria-pressed={on} className={cn('rounded-full border px-2.5 py-0.5 text-xs', on ? 'border-brand bg-brand text-brand-fg' : 'text-fg-muted')}>
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Transferência para humano" />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label="Palavras-chave (separadas por vírgula)" className="sm:col-span-2"><Input value={f.handoffKeywords} onChange={(e) => set('handoffKeywords', e.target.value)} /></Field>
            <Field label="Máx. de respostas automáticas por conversa" hint="0 = sem limite"><Input type="number" min={0} value={f.maxAiTurns} onChange={(e) => set('maxAiTurns', Number(e.target.value))} /></Field>
            <Field label="Mensagem ao transferir"><Input value={f.handoffMessage} onChange={(e) => set('handoffMessage', e.target.value)} placeholder="Vou chamar um atendente…" /></Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Horário de atendimento humano" />
          <div className="space-y-3 p-4">
            <Checkbox label="Considerar horário de atendimento" checked={f.hoursEnabled} onChange={(e) => set('hoursEnabled', e.target.checked)} />
            <div className="grid gap-2 md:grid-cols-2">
              {(Object.keys(DAY_LABELS) as (keyof typeof DAY_LABELS)[]).map((d) => {
                const v = f.days[d];
                return (
                  <div key={d} className="flex items-center gap-2 rounded-lg border px-2.5 py-2">
                    <Checkbox className="w-16 shrink-0" label={DAY_LABELS[d]} checked={!!v} onChange={(e) => set('days', { ...f.days, [d]: e.target.checked ? ['08:00', '18:00'] : null })} />
                    {v ? (
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <Input type="time" value={v[0]} onChange={(e) => set('days', { ...f.days, [d]: [e.target.value, v[1]] })} className="h-8 min-w-0 text-xs" aria-label={`${DAY_LABELS[d]} início`} />
                        <span className="text-xs text-fg-muted">às</span>
                        <Input type="time" value={v[1]} onChange={(e) => set('days', { ...f.days, [d]: [v[0], e.target.value] })} className="h-8 min-w-0 text-xs" aria-label={`${DAY_LABELS[d]} fim`} />
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
            <Field label="Mensagem fora do horário"><Input value={f.outOfHoursMessage} onChange={(e) => set('outOfHoursMessage', e.target.value)} /></Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Perguntas frequentes"
            description="Respostas oficiais que a IA usa com prioridade"
            action={<Button size="sm" variant="outline" onClick={() => set('faq', [...f.faq, { q: '', a: '' }])}><Plus className="h-3.5 w-3.5" /> Pergunta</Button>}
          />
          <div className="space-y-3 p-4">
            {f.faq.map((item, i) => (
              <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Input value={item.q} placeholder="Pergunta" onChange={(e) => set('faq', f.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} aria-label="Pergunta" />
                  <Textarea value={item.a} placeholder="Resposta" rows={2} onChange={(e) => set('faq', f.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} aria-label="Resposta" />
                </div>
                <Button size="icon" variant="ghost" onClick={() => set('faq', f.faq.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {!f.faq.length && <p className="text-xs text-fg-muted">Nenhuma pergunta cadastrada.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Widget do site" description="Aparência e segurança" />
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Field label="Cor"><Input type="color" value={f.widgetColor} onChange={(e) => set('widgetColor', e.target.value)} className="h-9 p-1" /></Field>
            <Field label="Posição">
              <Select value={f.widgetPosition} onChange={(e) => set('widgetPosition', e.target.value as 'left' | 'right')}>
                <option value="right">Direita</option>
                <option value="left">Esquerda</option>
              </Select>
            </Field>
            <Field label="Domínios autorizados" hint="Um por linha. Vazio = qualquer site. Ex.: www.pousada.com.br, *.pousada.com.br" className="sm:col-span-3">
              <Textarea value={f.allowedOrigins.join('\n')} onChange={(e) => set('allowedOrigins', e.target.value.split('\n'))} rows={2} />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => save.run()} loading={save.pending} className="shadow-pop">Salvar configurações</Button>
        </div>
      </div>

      <div className="space-y-4">
        <TestChat aiConfigured={aiConfigured} />
        <Card>
          <CardHeader title="Instalação no site" description="Cole antes de </body> no site do cliente" />
          <div className="space-y-3 p-4">
            <div>
              <p className="label flex items-center gap-1"><Code2 className="h-3.5 w-3.5" /> Chatbot (widget)</p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-2.5 text-[11px]">{widgetCode}</pre>
              <Button size="sm" variant="ghost" onClick={() => copy(widgetCode)}><Copy className="h-3.5 w-3.5" /> Copiar</Button>
            </div>
            <div>
              <p className="label flex items-center gap-1"><Code2 className="h-3.5 w-3.5" /> Formulário de captura</p>
              <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-2.5 text-[11px]">{formCode}</pre>
              <Button size="sm" variant="ghost" onClick={() => copy(formCode)}><Copy className="h-3.5 w-3.5" /> Copiar</Button>
            </div>
            <a href={`/embed-demo?key=${publicKey}`} target="_blank" rel="noreferrer" className="block text-xs text-brand hover:underline">Abrir página de demonstração do widget →</a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TestChat({ aiConfigured }: { aiConfigured: boolean }) {
  const toast = useToast();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; meta?: string }[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const content = text.trim();
    if (!content) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setText('');
    setBusy(true);
    const r = await testChatbotAction(next.map(({ role, content }) => ({ role, content })));
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setMessages((m) => [
      ...m,
      { role: 'assistant', content: r.data.reply, meta: `intenção: ${r.data.intent}${r.data.handoff ? ' · transferiria p/ humano' : ''}${r.data.sources.length ? ` · fontes: ${r.data.sources.join(', ')}` : ''}` },
    ]);
  };
  return (
    <Card className="flex h-[460px] flex-col">
      <CardHeader title="Testar assistente" description="Simulação com a configuração salva e a base de conhecimento" action={<Badge tone={aiConfigured ? 'green' : 'yellow'}>{aiConfigured ? 'IA ativa' : 'Sem credencial'}</Badge>} />
      <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', m.role === 'user' ? 'bg-brand text-brand-fg' : 'bg-muted')}>
              {m.role === 'assistant' && <Bot className="mb-0.5 h-3.5 w-3.5 text-brand" />}
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.meta && <p className="mt-1 text-[10px] text-fg-muted">{m.meta}</p>}
            </div>
          </div>
        ))}
        {!messages.length && <p className="pt-10 text-center text-xs text-fg-muted">Envie uma pergunta como um cliente faria.</p>}
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={(e) => (e.preventDefault(), void send())}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Quanto custa a diária?" disabled={!aiConfigured} aria-label="Mensagem de teste" />
        <Button type="submit" loading={busy} disabled={!aiConfigured} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
