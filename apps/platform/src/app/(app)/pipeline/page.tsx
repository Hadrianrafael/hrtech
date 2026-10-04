import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewContactButton } from '@/components/crm/new-contact-button';
import { KanbanBoard } from '@/components/pipeline/kanban';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { getContactFormOptions } from '@/server/form-options';
import { getBoard } from '@/server/pipeline';

export const metadata: Metadata = { title: 'Funil comercial' };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('contacts.read');
  const [board, options] = await Promise.all([getBoard(ctx, sp.pipeline, { ownerId: sp.owner, q: sp.q }), getContactFormOptions(ctx)]);
  if (!board.pipeline) return <EmptyState title="Nenhum funil configurado" />;
  return (
    <div>
      <PageHeader
        title="Funil comercial"
        description="Arraste as oportunidades entre as etapas. Toda movimentação é registrada na timeline do contato."
        actions={ctx.permissions.has('contacts.write') && <NewContactButton options={options} />}
      />
      <Suspense>
        <KanbanBoard
          pipelines={board.pipelines.map((p) => ({ id: p.id, name: p.name }))}
          pipelineId={board.pipeline.id}
          stages={board.pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            kind: s.kind,
            probability: s.probability,
            count: board.totals[s.id]?.count ?? 0,
            value: board.totals[s.id]?.value ?? 0,
          }))}
          cards={board.opportunities.map((o) => ({
            id: o.id,
            title: o.title,
            value: o.value ? Number(o.value) : null,
            stageId: o.stageId,
            ownerId: o.ownerId,
            contactId: o.contact.id,
            contactName: o.contact.name,
            stageChangedAt: o.stageChangedAt.toISOString(),
            tags: o.contact.tags.map((t) => ({ name: t.tag.name, color: t.tag.color })),
          }))}
          members={options.members}
          canMove={ctx.permissions.has('opportunities.write')}
          canConfigure={ctx.permissions.has('pipeline.manage')}
        />
      </Suspense>
    </div>
  );
}
