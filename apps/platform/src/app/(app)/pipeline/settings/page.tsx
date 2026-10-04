import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StageSettings } from '@/components/pipeline/stage-settings';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listPipelines } from '@/server/pipeline';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Configurar funil' };

export default async function PipelineSettingsPage({ searchParams }: { searchParams: Promise<{ pipeline?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('pipeline.manage');
  const [pipelines, members] = await Promise.all([listPipelines(ctx), getMembers(ctx)]);
  const pipeline = pipelines.find((p) => p.id === sp.pipeline) ?? pipelines[0];
  if (!pipeline) return null;
  const counts = await ctx.db.opportunity.groupBy({ by: ['stageId'], where: { pipelineId: pipeline.id }, _count: { _all: true } });
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/pipeline" className="mb-3 inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao funil
      </Link>
      <PageHeader
        title={`Configurar: ${pipeline.name}`}
        description={pipelines.length > 1 ? `Funis: ${pipelines.map((p) => p.name).join(', ')}` : undefined}
      />
      <StageSettings
        pipelineId={pipeline.id}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        stages={pipeline.stages.map((s) => ({
          id: s.id, name: s.name, key: s.key, color: s.color, kind: s.kind, probability: s.probability, defaultOwnerId: s.defaultOwnerId,
          requireValue: !!(s.rules as { requireValue?: boolean })?.requireValue, count: counts.find((c) => c.stageId === s.id)?._count._all ?? 0,
        }))}
      />
    </div>
  );
}
