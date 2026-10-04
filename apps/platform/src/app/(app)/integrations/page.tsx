import type { Metadata } from 'next';
import { IntegrationsManager } from '@/components/org/integrations-manager';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listIntegrations, platformIntegrationStatus } from '@/server/integrations';

export const metadata: Metadata = { title: 'Integrações' };

export default async function IntegrationsPage() {
  const ctx = await requirePageContext('integrations.manage');
  const items = await listIntegrations(ctx);
  return (
    <div>
      <PageHeader title="Integrações" description="Conecte os canais oficiais da sua empresa. Credenciais ficam criptografadas e isoladas por empresa." />
      <IntegrationsManager
        platform={platformIntegrationStatus()}
        items={items.map((i) => ({
          id: i.id, type: i.type, name: i.name, status: i.status, externalId: i.externalId, config: i.config as Record<string, unknown>, lastError: i.lastError,
          lastEventAt: i.lastEventAt?.toISOString() ?? null, hasSecrets: i.hasSecrets,
          email: i.emailAccount ? { address: i.emailAccount.address, lastSyncAt: i.emailAccount.lastSyncAt?.toISOString() ?? null, syncError: i.emailAccount.syncError, imapHost: i.emailAccount.imapHost } : null,
        }))}
      />
    </div>
  );
}
