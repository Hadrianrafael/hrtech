import { AlertTriangle, Bot, Building2, CreditCard, DatabaseZap, Users, Webhook } from 'lucide-react';
import Link from 'next/link';
import { Alert, Badge, Card, CardHeader, PageHeader, StatCard } from '@/components/ui/misc';
import { fmtDateTime } from '@/components/shared/format';
import { checkDatabaseRole, systemDb } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { currentPeriod } from '@/lib/utils';
import { platformIntegrationStatus } from '@/server/integrations';
import { requirePlatformAdminPage } from '@/lib/auth/context';

export default async function AdminHome() {
  // Cada página do painel verifica o acesso: o layout sozinho não protege requisições RSC parciais.
  await requirePlatformAdminPage();
  const period = currentPeriod();
  const [orgs, users, subs, aiUsage, convUsage, errors, webhookFailed, integrations, dbRole] = await Promise.all([
    systemDb.organization.groupBy({ by: ['status'], _count: { _all: true } }),
    systemDb.user.count(),
    systemDb.subscription.findMany({ include: { plan: true } }),
    systemDb.usage.aggregate({ where: { metric: 'ai_messages', period }, _sum: { count: true } }),
    systemDb.usage.aggregate({ where: { metric: 'conversations', period }, _sum: { count: true } }),
    systemDb.auditLog.findMany({ where: { severity: 'error' }, orderBy: { createdAt: 'desc' }, take: 10, include: { organization: { select: { name: true } } } }),
    systemDb.webhookEvent.count({ where: { status: 'FAILED' } }),
    systemDb.integration.groupBy({ by: ['type', 'status'], _count: { _all: true } }),
    checkDatabaseRole(),
  ]);
  const count = (s: string) => orgs.find((o) => o.status === s)?._count._all ?? 0;
  const mrr = subs.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + s.plan.priceCents, 0) / 100;
  const byStatus = subs.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});
  const platform = platformIntegrationStatus();

  return (
    <div className="space-y-5">
      <PageHeader title="Plataforma HR Tech" description="Visão geral de empresas, assinaturas, consumo e saúde das integrações." />
      {!dbRole.ok && <Alert tone="red" title="Atenção: Row-Level Security não está sendo aplicado">{dbRole.reason}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Empresas" value={count('ACTIVE') + count('SUSPENDED')} hint={`${count('ACTIVE')} ativas · ${count('SUSPENDED')} bloqueadas`} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Usuários" value={users} icon={<Users className="h-4 w-4" />} tone="blue" />
        <StatCard label="Receita recorrente (estimada)" value={formatMoney(mrr)} hint={Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(' · ')} icon={<CreditCard className="h-4 w-4" />} tone="green" />
        <StatCard label="Uso de IA no mês" value={(aiUsage._sum.count ?? 0).toLocaleString('pt-BR')} hint={`${convUsage._sum.count ?? 0} novas conversas no mês`} icon={<Bot className="h-4 w-4" />} tone="yellow" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Erros importantes recentes" action={<Link href="/admin/logs?severity=error" className="text-xs text-brand">Ver todos</Link>} />
          <ul className="divide-y text-sm">
            {errors.map((e) => (
              <li key={e.id} className="px-4 py-2.5">
                <p className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-danger" /> <span className="font-medium">{e.action}</span> <span className="text-xs text-fg-muted">{e.organization?.name}</span></p>
                <p className="truncate text-xs text-fg-muted">{String((e.metadata as { error?: string })?.error ?? '')} · {fmtDateTime(e.createdAt)}</p>
              </li>
            ))}
            {!errors.length && <li className="px-4 py-6 text-center text-xs text-fg-muted">Nenhum erro registrado.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Integrações" description="Status consolidado de todas as empresas" />
          <div className="space-y-3 p-4 text-sm">
            <div className="flex flex-wrap gap-2">
              {integrations.map((i) => <Badge key={i.type + i.status} tone={i.status === 'CONNECTED' ? 'green' : i.status === 'ERROR' ? 'red' : 'gray'}>{i.type} · {i.status}: {i._count._all}</Badge>)}
            </div>
            <p className="flex items-center gap-2 text-xs"><Webhook className="h-3.5 w-3.5" /> Webhooks com falha aguardando reprocessamento: <strong>{webhookFailed}</strong></p>
            <p className="flex flex-wrap items-center gap-2 text-xs"><DatabaseZap className="h-3.5 w-3.5" /> Usuário do banco: <strong>{dbRole.role}</strong> {dbRole.ok ? <Badge tone="green">RLS ativo</Badge> : <Badge tone="red">RLS ignorado</Badge>}{dbRole.mode === 'app_role' && <Badge>via papel hrtech_rls</Badge>}</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-fg-muted">
              <span>META_APP_SECRET: {platform.metaAppSecret ? '✓' : 'pendente'}</span>
              <span>WHATSAPP_VERIFY_TOKEN: {platform.whatsappVerifyToken ? '✓' : 'pendente'}</span>
              <span>IA (OpenAI): {platform.ai ? '✓' : 'pendente'}</span>
              <span>SMTP: {platform.smtp ? '✓' : 'pendente'}</span>
              <span>Billing: {platform.billing}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
