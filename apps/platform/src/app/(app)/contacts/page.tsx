import { Download, Search, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NewContactButton } from '@/components/crm/new-contact-button';
import { Button, buttonClass } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Avatar, Badge, Card, EmptyState, PageHeader } from '@/components/ui/misc';
import { timeAgo } from '@/components/shared/format';
import { requirePageContext } from '@/lib/auth/context';
import { formatMoney, formatPhone } from '@/lib/utils';
import { LEAD_STATUS_LABELS, listContacts, SOURCE_LABELS } from '@/server/contacts';
import { getContactFormOptions } from '@/server/form-options';

export const metadata: Metadata = { title: 'Leads e clientes' };

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'brand'> = {
  NEW: 'brand', CONTACTED: 'blue', IN_CONVERSATION: 'blue', QUALIFIED: 'yellow', CUSTOMER: 'green', UNQUALIFIED: 'gray', LOST: 'red',
};

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('contacts.read');
  const [result, options] = await Promise.all([
    listContacts(ctx, { q: sp.q, status: sp.status, source: sp.source, ownerId: sp.ownerId, tagId: sp.tagId, kind: sp.kind, page: Number(sp.page ?? 1) }),
    getContactFormOptions(ctx),
  ]);
  const owners = new Map(options.members.map((m) => [m.id, m.name]));
  const qs = (page: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    p.set('page', String(page));
    return `?${p.toString()}`;
  };
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][]).toString();

  return (
    <div>
      <PageHeader
        title="Leads e clientes"
        description={`${result.total} contato(s) encontrado(s)`}
        actions={
          <>
            {ctx.permissions.has('contacts.export') && (
              <a href={`/api/app/contacts/export?${exportQs}`} className={buttonClass('outline')}>
                <Download className="h-4 w-4" /> Exportar CSV
              </a>
            )}
            {ctx.permissions.has('contacts.write') && <NewContactButton options={options} />}
          </>
        }
      />

      <Card className="mb-4 p-3">
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-fg-muted" />
            <Input name="q" defaultValue={sp.q} placeholder="Buscar nome, e-mail, telefone, cidade..." className="pl-8" aria-label="Buscar" />
          </div>
          <Select name="status" defaultValue={sp.status ?? ''} aria-label="Status">
            <option value="">Todos os status</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select name="source" defaultValue={sp.source ?? ''} aria-label="Origem">
            <option value="">Todas as origens</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select name="ownerId" defaultValue={sp.ownerId ?? ''} aria-label="Responsável">
            <option value="">Todos os responsáveis</option>
            <option value="none">Sem responsável</option>
            {options.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <div className="flex gap-2">
            <Select name="tagId" defaultValue={sp.tagId ?? ''} aria-label="Etiqueta">
              <option value="">Etiquetas</option>
              {options.tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Button type="submit" variant="secondary">Filtrar</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" />} title="Nenhum contato encontrado" description="Ajuste os filtros ou cadastre um novo lead." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs text-fg-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Contato</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Origem</th>
                  <th className="px-4 py-2.5 font-medium">Responsável</th>
                  <th className="px-4 py-2.5 font-medium">Etiquetas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-4 py-2.5 font-medium">Última interação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.items.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-2.5">
                        <Avatar name={c.name} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium hover:text-brand">{c.name}</span>
                          <span className="block truncate text-xs text-fg-muted">{[c.companyName, c.email, formatPhone(c.phone)].filter(Boolean).join(' · ') || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[c.status]}>{LEAD_STATUS_LABELS[c.status]}</Badge></td>
                    <td className="px-4 py-2.5 text-xs">{SOURCE_LABELS[c.source] ?? c.source}</td>
                    <td className="px-4 py-2.5 text-xs">{c.ownerId ? owners.get(c.ownerId) ?? '—' : <span className="text-fg-muted">Sem responsável</span>}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => <Badge key={t.tagId} color={t.tag.color}>{t.tag.name}</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(c.potentialValue?.toString())}</td>
                    <td className="px-4 py-2.5 text-xs text-fg-muted">{timeAgo(c.lastInteractionAt ?? c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-fg-muted">
            <span>Página {result.page} de {result.pages}</span>
            <div className="flex gap-2">
              {result.page > 1 && <Link href={qs(result.page - 1)} className={buttonClass('outline', 'sm')}>Anterior</Link>}
              {result.page < result.pages && <Link href={qs(result.page + 1)} className={buttonClass('outline', 'sm')}>Próxima</Link>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
