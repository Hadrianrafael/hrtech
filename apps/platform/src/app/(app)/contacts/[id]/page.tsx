import { ArrowLeft, CalendarDays, CheckSquare, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContactActions } from '@/components/crm/contact-actions';
import { OpportunityList } from '@/components/crm/opportunity-list';
import { Timeline, type TimelineEntry } from '@/components/crm/timeline';
import { Avatar, Badge, Card, CardHeader } from '@/components/ui/misc';
import { fmtDate, fmtDateTime, timeAgo } from '@/components/shared/format';
import { requirePageContext } from '@/lib/auth/context';
import { NotFoundError } from '@/lib/errors';
import { formatMoney, formatPhone } from '@/lib/utils';
import { CUSTOM_FIELD_LABELS, getContact, LEAD_STATUS_LABELS, SOURCE_LABELS } from '@/server/contacts';
import { getContactFormOptions } from '@/server/form-options';
import { listPipelines } from '@/server/pipeline';
import { getContactTimeline } from '@/server/timeline';

export const metadata: Metadata = { title: 'Contato' };

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePageContext('contacts.read');
  let contact;
  try {
    contact = await getContact(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const [timeline, options, pipelines] = await Promise.all([getContactTimeline(ctx, id), getContactFormOptions(ctx), listPipelines(ctx)]);
  const names = new Map(options.members.map((m) => [m.id, m.name]));
  const custom = contact.customFields as Record<string, string>;
  const stages = pipelines.flatMap((p) => p.stages.map((s) => ({ id: s.id, name: pipelines.length > 1 ? `${p.name} · ${s.name}` : s.name, pipelineId: p.id, color: s.color })));

  const items: TimelineEntry[] = timeline.map((t) =>
    t.kind === 'message'
      ? { kind: 'message', id: t.id, at: t.at.toISOString(), body: t.body, channel: t.channel, direction: t.direction, senderType: t.senderType, actorName: t.senderUserId ? names.get(t.senderUserId) : null, conversationId: t.conversationId }
      : {
          kind: 'event',
          id: t.id,
          at: t.at.toISOString(),
          type: t.type,
          title: t.title,
          actorType: t.actorType,
          actorName: t.actorId ? names.get(t.actorId) ?? null : null,
          body: (t.data as { body?: string })?.body ?? null,
        },
  );

  const p = ctx.permissions;
  return (
    <div className="space-y-4">
      <Link href="/contacts" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Leads e clientes
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} size={48} />
          <div>
            <h1 className="text-xl font-semibold">{contact.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              <Badge tone="brand">{LEAD_STATUS_LABELS[contact.status]}</Badge>
              <Badge>{contact.kind === 'CUSTOMER' ? 'Cliente' : 'Lead'}</Badge>
              {contact.tags.map((t) => <Badge key={t.tagId} color={t.tag.color}>{t.tag.name}</Badge>)}
              <span>· Responsável: {contact.ownerId ? names.get(contact.ownerId) ?? '—' : 'ninguém'}</span>
            </div>
          </div>
        </div>
        <ContactActions
          contact={{
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            whatsapp: contact.whatsapp,
            instagram: contact.instagram,
            companyName: contact.companyName,
            city: contact.city,
            state: contact.state,
            source: contact.source,
            status: contact.status,
            kind: contact.kind,
            ownerId: contact.ownerId,
            potentialValue: contact.potentialValue ? Number(contact.potentialValue) : null,
            interest: contact.interest,
            notes: contact.notes,
            nextActionAt: contact.nextActionAt?.toISOString() ?? null,
            nextActionNote: contact.nextActionNote,
            customFields: custom,
            tagIds: contact.tags.map((t) => t.tagId),
            consentAt: contact.consentAt?.toISOString() ?? null,
          }}
          options={options}
          can={{
            write: p.has('contacts.write'),
            delete: p.has('contacts.delete'),
            export: p.has('contacts.export'),
            ai: p.has('ai.use'),
            inbox: p.has('inbox.use'),
            tasks: p.has('tasks.manage'),
            calendar: p.has('calendar.manage'),
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Dados do contato" />
            <dl className="space-y-2.5 p-4 text-sm">
              {contact.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-fg-muted" /> <a href={`mailto:${contact.email}`} className="truncate hover:text-brand">{contact.email}</a></div>}
              {contact.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-fg-muted" /> {formatPhone(contact.phone)}</div>}
              {contact.whatsapp && contact.whatsapp !== contact.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-success" /> {formatPhone(contact.whatsapp)}</div>}
              {(contact.city || contact.state) && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-fg-muted" /> {[contact.city, contact.state].filter(Boolean).join(' / ')}</div>}
              <Row label="Instagram" value={contact.instagram ? `@${contact.instagram}` : null} />
              <Row label="Empresa" value={contact.companyName} />
              <Row label="Origem" value={`${SOURCE_LABELS[contact.source] ?? contact.source}${contact.sourceDetail ? ` (${contact.sourceDetail})` : ''}`} />
              <Row label="Interesse" value={contact.interest} />
              <Row label="Valor potencial" value={formatMoney(contact.potentialValue?.toString())} />
              <Row label="Criado em" value={fmtDate(contact.createdAt)} />
              <Row label="Última interação" value={timeAgo(contact.lastInteractionAt)} />
              <Row label="Próxima ação" value={contact.nextActionAt ? `${fmtDateTime(contact.nextActionAt)}${contact.nextActionNote ? ` — ${contact.nextActionNote}` : ''}` : null} />
              {Object.entries(custom).filter(([, v]) => v).map(([k, v]) => <Row key={k} label={CUSTOM_FIELD_LABELS[k] ?? k} value={String(v)} />)}
              {contact.notes && <div className="rounded-lg bg-muted p-2.5 text-xs">{contact.notes}</div>}
              <div className="flex items-center gap-1.5 border-t pt-2.5 text-xs text-fg-muted">
                <ShieldCheck className={contact.consentAt ? 'h-4 w-4 text-success' : 'h-4 w-4'} />
                {contact.consentAt ? `Consentimento registrado em ${fmtDate(contact.consentAt)} (${contact.consentSource})` : 'Sem registro de consentimento'}
              </div>
            </dl>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader title="Timeline" description="Mensagens, alterações no CRM, tarefas, agendamentos e ações da IA" />
          <Timeline contactId={contact.id} items={items} canWrite={p.has('contacts.write')} />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Oportunidades" />
            <OpportunityList
              contactId={contact.id}
              canWrite={p.has('opportunities.write')}
              stages={stages}
              opportunities={contact.opportunities.map((o) => ({
                id: o.id, title: o.title, value: o.value ? Number(o.value) : null, status: o.status, stageId: o.stageId, stageName: o.stage.name, stageColor: o.stage.color, pipelineId: o.pipelineId,
              }))}
            />
          </Card>
          <Card>
            <CardHeader title="Tarefas pendentes" />
            <ul className="divide-y text-sm">
              {contact.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 px-4 py-2.5">
                  <CheckSquare className="h-4 w-4 text-fg-muted" />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <span className={t.dueAt && t.dueAt < new Date() ? 'text-xs text-danger' : 'text-xs text-fg-muted'}>{t.dueAt ? fmtDate(t.dueAt, 'dd/MM HH:mm') : ''}</span>
                </li>
              ))}
              {!contact.tasks.length && <li className="px-4 py-4 text-xs text-fg-muted">Nenhuma tarefa pendente.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Próximos compromissos" />
            <ul className="divide-y text-sm">
              {contact.appointments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 px-4 py-2.5">
                  <CalendarDays className="h-4 w-4 text-fg-muted" />
                  <span className="min-w-0 flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-fg-muted">{fmtDate(a.startsAt, 'dd/MM HH:mm')}</span>
                </li>
              ))}
              {!contact.appointments.length && <li className="px-4 py-4 text-xs text-fg-muted">Nenhum compromisso.</li>}
            </ul>
          </Card>
          {contact.conversations.length > 0 && (
            <Card>
              <CardHeader title="Conversas" />
              <ul className="divide-y text-sm">
                {contact.conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/inbox?c=${c.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50">
                      <span>{({ WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', EMAIL: 'E-mail', WEBCHAT: 'Chat do site' } as const)[c.channel]}</span>
                      <span className="text-xs text-fg-muted">{timeAgo(c.lastMessageAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
