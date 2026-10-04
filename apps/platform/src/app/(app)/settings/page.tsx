import type { Metadata } from 'next';
import { AccountForms, OrgSettingsForm, TagsManager } from '@/components/org/settings-forms';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/misc';
import { fmtDateTime } from '@/components/shared/format';
import { requirePageContext } from '@/lib/auth/context';
import { listTags } from '@/server/contacts';

export const metadata: Metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  const ctx = await requirePageContext();
  const [tags, logs] = await Promise.all([
    listTags(ctx),
    ctx.permissions.has('audit.view') ? ctx.db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }) : Promise.resolve([]),
  ]);
  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter(Boolean))] as string[];
  const members = actorIds.length ? await ctx.db.membership.findMany({ where: { userId: { in: actorIds } }, include: { user: { select: { id: true, name: true } } } }) : [];
  const names = new Map(members.map((m) => [m.user.id, m.user.name]));
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Configurações" />
      {ctx.permissions.has('settings.manage') && <OrgSettingsForm org={{ name: ctx.org.name, segment: ctx.org.segment, timezone: ctx.org.timezone, retentionDays: ctx.org.retentionDays }} />}
      <TagsManager tags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))} canDelete={ctx.permissions.has('settings.manage')} />
      <AccountForms name={ctx.user.name} email={ctx.user.email} />
      {ctx.permissions.has('audit.view') && (
        <Card className="overflow-hidden">
          <CardHeader title="Auditoria" description="Últimas 50 ações registradas nesta empresa" />
          <ul className="max-h-[420px] divide-y overflow-y-auto text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                <Badge tone={l.severity === 'error' ? 'red' : l.severity === 'warning' ? 'yellow' : 'gray'}>{l.action}</Badge>
                <span className="flex-1 text-xs text-fg-muted">{l.actorUserId ? names.get(l.actorUserId) ?? 'Suporte HR Tech' : l.actorType}</span>
                <span className="text-xs text-fg-muted">{fmtDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
