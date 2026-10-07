import Link from 'next/link';
import { Badge, Card, PageHeader } from '@/components/ui/misc';
import { fmtDateTime } from '@/components/shared/format';
import { systemDb } from '@/lib/db';
import { buttonClass } from '@/components/ui/button';
import { requirePlatformAdminPage } from '@/lib/auth/context';

export const metadata = { title: 'Logs' };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ severity?: string; action?: string; page?: string; tab?: string }> }) {
  // Cada página do painel verifica o acesso: o layout sozinho não protege requisições RSC parciais.
  await requirePlatformAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  if (sp.tab === 'webhooks') {
    const events = await systemDb.webhookEvent.findMany({ orderBy: { receivedAt: 'desc' }, take: 100, select: { id: true, provider: true, eventKey: true, status: true, error: true, attempts: true, receivedAt: true, organizationId: true } });
    return (
      <div>
        <PageHeader title="Webhooks recebidos" actions={<Link href="/admin/logs" className={buttonClass('outline', 'sm')}>Auditoria</Link>} />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-fg-muted"><tr><th className="px-4 py-2">Recebido</th><th className="px-4 py-2">Provedor</th><th className="px-4 py-2">Evento</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Tentativas</th><th className="px-4 py-2">Erro</th></tr></thead>
            <tbody className="divide-y">
              {events.map((e) => (
                <tr key={e.id}><td className="px-4 py-2 text-xs">{fmtDateTime(e.receivedAt)}</td><td className="px-4 py-2">{e.provider}</td><td className="px-4 py-2 font-mono text-xs">{e.eventKey.slice(0, 40)}</td><td className="px-4 py-2"><Badge tone={e.status === 'PROCESSED' ? 'green' : e.status === 'FAILED' ? 'red' : 'gray'}>{e.status}</Badge></td><td className="px-4 py-2">{e.attempts}</td><td className="px-4 py-2 text-xs text-danger">{e.error}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }
  const where = { ...(sp.severity ? { severity: sp.severity } : {}), ...(sp.action ? { action: { contains: sp.action } } : {}) };
  const logs = await systemDb.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, skip: (page - 1) * 100, include: { organization: { select: { name: true } } } });
  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter(Boolean))] as string[];
  const actors = await systemDb.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const names = new Map(actors.map((a) => [a.id, a.name]));
  return (
    <div>
      <PageHeader title="Auditoria e erros" description="Login, permissões, movimentações, ações administrativas, automações e falhas de integração." actions={<Link href="/admin/logs?tab=webhooks" className={buttonClass('outline', 'sm')}>Webhooks</Link>} />
      <form className="mb-3 flex flex-wrap gap-2" method="get">
        <select name="severity" defaultValue={sp.severity ?? ''} className="input w-40" aria-label="Severidade"><option value="">Todas</option><option value="info">Info</option><option value="warning">Alerta</option><option value="error">Erro</option></select>
        <input name="action" defaultValue={sp.action} placeholder="Ação (ex.: auth.login)" className="input w-60" aria-label="Ação" />
        <button className="rounded-lg bg-muted px-3 text-sm">Filtrar</button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-fg-muted"><tr><th className="px-4 py-2">Data</th><th className="px-4 py-2">Ação</th><th className="px-4 py-2">Empresa</th><th className="px-4 py-2">Autor</th><th className="px-4 py-2">Detalhes</th></tr></thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-2 text-xs">{fmtDateTime(l.createdAt)}</td>
                <td className="px-4 py-2"><Badge tone={l.severity === 'error' ? 'red' : l.severity === 'warning' ? 'yellow' : 'gray'}>{l.action}</Badge></td>
                <td className="px-4 py-2 text-xs">{l.organization?.name ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{l.actorUserId ? names.get(l.actorUserId) ?? l.actorUserId : l.actorType}</td>
                <td className="max-w-md truncate px-4 py-2 font-mono text-[11px] text-fg-muted">{JSON.stringify(l.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-3 flex gap-2">
        {page > 1 && <Link href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`} className={buttonClass('outline', 'sm')}>Anterior</Link>}
        {logs.length === 100 && <Link href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`} className={buttonClass('outline', 'sm')}>Próxima</Link>}
      </div>
    </div>
  );
}
