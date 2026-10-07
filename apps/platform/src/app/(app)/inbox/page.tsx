import type { Metadata } from 'next';
import { InboxApp } from '@/components/inbox/inbox-app';
import { requirePageContext } from '@/lib/auth/context';
import { isAiConfigured } from '@/server/ai/provider';
import { listPipelines } from '@/server/pipeline';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Conversas' };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePageContext('inbox.use');
  const [members, pipelines] = await Promise.all([getMembers(ctx), listPipelines(ctx)]);
  return (
    <InboxApp
      initialId={sp.c ?? null}
      currentUserId={ctx.userId}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      stages={pipelines.flatMap((p) => p.stages.map((s) => ({ id: s.id, name: s.name, pipelineId: p.id })))}
      can={{
        assign: ctx.permissions.has('inbox.assign'),
        ai: ctx.permissions.has('ai.use'),
        editContact: ctx.permissions.has('contacts.write'),
        moveOpp: ctx.permissions.has('opportunities.write'),
      }}
      aiConfigured={isAiConfigured()}
    />
  );
}
