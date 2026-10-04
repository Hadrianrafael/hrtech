import { PlanList } from '@/components/admin/admin-forms';
import { PageHeader } from '@/components/ui/misc';
import { systemDb } from '@/lib/db';
import { LIMIT_KEYS } from '@/server/billing/limits';
import { requirePlatformAdminPage } from '@/lib/auth/context';

export const metadata = { title: 'Planos' };

export default async function PlansPage() {
  // Cada página do painel verifica o acesso: o layout sozinho não protege requisições RSC parciais.
  await requirePlatformAdminPage();
  const plans = await systemDb.plan.findMany({ orderBy: { position: 'asc' }, include: { _count: { select: { subscriptions: true } } } });
  return (
    <div>
      <PageHeader title="Planos" description="Preços e limites são configuráveis aqui — nada fica fixo no código." />
      <PlanList
        limitLabels={LIMIT_KEYS}
        plans={plans.map((p) => ({
          id: p.id, key: p.key, name: p.name, description: p.description, priceCents: p.priceCents, limits: p.limits as Record<string, number>, features: p.features,
          active: p.active, isPublic: p.isPublic, position: p.position, subscriptions: p._count.subscriptions,
        }))}
      />
    </div>
  );
}
