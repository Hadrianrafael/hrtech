'use client';

import { Bot, CalendarPlus, Download, ListPlus, MessageSquarePlus, MoreHorizontal, Pencil, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { anonymizeContactAction, deleteContactAction, recommendNextActionAction } from '@/app/actions/crm';
import { startConversationAction } from '@/app/actions/inbox';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Alert, Badge } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useAction } from '@/components/ui/use-action';
import { AppointmentForm } from '@/components/work/appointment-form';
import { TaskForm } from '@/components/work/task-form';
import { ContactForm, type ContactFormData, type FormOptions } from './contact-form';

type Dialog = null | 'edit' | 'task' | 'appointment' | 'lgpd' | 'ai' | 'conversation';

export function ContactActions({
  contact,
  options,
  can,
}: {
  contact: ContactFormData & { id: string; name: string };
  options: FormOptions;
  can: { write: boolean; delete: boolean; export: boolean; ai: boolean; inbox: boolean; tasks: boolean; calendar: boolean };
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState(false);
  const [channel, setChannel] = useState('WHATSAPP');
  const close = () => setDialog(null);
  const ai = useAction(() => recommendNextActionAction(contact.id), { refresh: false });
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof recommendNextActionAction>> | null>(null);
  const anonymize = useAction(() => anonymizeContactAction(contact.id), { onSuccess: () => router.push('/contacts') });
  const remove = useAction(() => deleteContactAction(contact.id), { onSuccess: () => router.push('/contacts') });
  const start = useAction(() => startConversationAction(contact.id, channel as never), { refresh: false, onSuccess: (d) => router.push(`/inbox?c=${d.id}`) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {can.inbox && (
        <Button variant="outline" onClick={() => setDialog('conversation')}>
          <MessageSquarePlus className="h-4 w-4" /> Conversar
        </Button>
      )}
      {can.tasks && (
        <Button variant="outline" onClick={() => setDialog('task')}>
          <ListPlus className="h-4 w-4" /> Tarefa
        </Button>
      )}
      {can.calendar && (
        <Button variant="outline" onClick={() => setDialog('appointment')}>
          <CalendarPlus className="h-4 w-4" /> Agendar
        </Button>
      )}
      {can.ai && (
        <Button
          variant="outline"
          loading={ai.pending}
          onClick={async () => {
            setDialog('ai');
            setAiResult(await ai.run());
          }}
        >
          <Sparkles className="h-4 w-4" /> Próxima ação (IA)
        </Button>
      )}
      {can.write && (
        <Button onClick={() => setDialog('edit')}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
      )}
      {(can.export || can.delete) && (
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setMenu((v) => !v)} aria-label="Mais ações">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border bg-surface p-1 text-sm shadow-pop" onMouseLeave={() => setMenu(false)}>
              {can.export && (
                <a href={`/api/app/contacts/${contact.id}/export`} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                  <Download className="h-4 w-4" /> Exportar dados (LGPD)
                </a>
              )}
              {can.delete && (
                <button type="button" onClick={() => (setMenu(false), setDialog('lgpd'))} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-danger hover:bg-muted">
                  <ShieldAlert className="h-4 w-4" /> Anonimizar / excluir
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={dialog === 'edit'} onClose={close} title={`Editar ${contact.name}`} size="lg">
        <ContactForm initial={contact} options={options} onDone={close} />
      </Modal>
      <Modal open={dialog === 'task'} onClose={close} title="Nova tarefa / follow-up">
        <TaskForm members={options.members} initial={{ contactId: contact.id, assigneeId: contact.ownerId }} onDone={close} />
      </Modal>
      <Modal open={dialog === 'appointment'} onClose={close} title="Novo compromisso">
        <AppointmentForm members={options.members} initial={{ contactId: contact.id, title: `Retorno — ${contact.name}`, type: 'RETURN', ownerId: contact.ownerId }} onDone={close} />
      </Modal>
      <Modal open={dialog === 'conversation'} onClose={close} title="Iniciar conversa" size="sm">
        <div className="space-y-3">
          <Select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Canal">
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">E-mail</option>
            <option value="INSTAGRAM">Instagram</option>
          </Select>
          <p className="text-xs text-fg-muted">
            No WhatsApp, fora da janela de 24h somente templates aprovados pela Meta podem iniciar a conversa. No Instagram, a conversa precisa ter sido iniciada pelo cliente.
          </p>
          <Button loading={start.pending} onClick={() => start.run()} className="w-full justify-center">Abrir na central de conversas</Button>
        </div>
      </Modal>
      <Modal open={dialog === 'ai'} onClose={close} title="Recomendação da IA" description="Baseada no histórico, funil e conversas do contato.">
        {ai.pending && <p className="text-sm text-fg-muted">Analisando o contato…</p>}
        {aiResult && !aiResult.ok && <Alert tone="red">{aiResult.error}</Alert>}
        {aiResult?.ok && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-brand" />
              <Badge tone={aiResult.data.category === 'quente' ? 'red' : aiResult.data.category === 'morno' ? 'yellow' : 'blue'}>Lead {aiResult.data.category}</Badge>
              <Badge>Score {aiResult.data.score}</Badge>
            </div>
            <div>
              <p className="label">Próxima ação</p>
              <p>{aiResult.data.nextAction}</p>
            </div>
            {aiResult.data.followUpMessage && (
              <div>
                <p className="label">Sugestão de follow-up</p>
                <p className="rounded-lg bg-muted p-3">{aiResult.data.followUpMessage}</p>
              </div>
            )}
            {aiResult.data.reasoning && <p className="text-xs text-fg-muted">{aiResult.data.reasoning}</p>}
          </div>
        )}
      </Modal>
      <Modal open={dialog === 'lgpd'} onClose={close} title="Direitos do titular (LGPD)" size="sm">
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Anonimizar</p>
            <p className="mb-2 text-xs text-fg-muted">Remove nome, contatos, conversas, notas e histórico. Mantém apenas valores agregados para métricas.</p>
            <Button variant="outline" loading={anonymize.pending} onClick={() => confirm('Anonimizar este contato? Esta ação não pode ser desfeita.') && anonymize.run()}>
              <ShieldAlert className="h-4 w-4" /> Anonimizar contato
            </Button>
          </div>
          <div className="border-t pt-4">
            <p className="font-medium text-danger">Excluir definitivamente</p>
            <p className="mb-2 text-xs text-fg-muted">Apaga o contato e todos os registros vinculados (conversas, mensagens, oportunidades).</p>
            <Button variant="danger" loading={remove.pending} onClick={() => confirm('Excluir definitivamente? Esta ação não pode ser desfeita.') && remove.run()}>
              <Trash2 className="h-4 w-4" /> Excluir contato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
