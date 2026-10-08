import type { Metadata } from 'next';
import { MemoryManager, type MemoryRow } from '@/components/ai-team/memory-manager';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listMemories, MEMORY_KINDS } from '@/server/ai-company/memory';

export const metadata: Metadata = { title: 'Memória da Equipe IA' };

export default async function AiMemoryPage() {
  const ctx = await requirePageContext('ai_team.view');
  const [memories, agents] = await Promise.all([
    listMemories(ctx),
    ctx.db.aiAgent.findMany({ orderBy: [{ isCeo: 'desc' }, { createdAt: 'asc' }], select: { id: true, name: true } }),
  ]);
  const now = Date.now();

  const rows: MemoryRow[] = memories.map((m) => ({
    id: m.id,
    agentId: m.agentId,
    scope: m.scope === 'AGENT' && m.agentId ? 'AGENT' : 'COMPANY',
    kind: m.kind,
    title: m.title,
    content: m.content.slice(0, 2000),
    source: m.source,
    importance: m.importance,
    pinned: m.pinned,
    sourceTaskId: m.sourceTaskId,
    expired: !!m.expiresAt && m.expiresAt.getTime() <= now,
    expiresAt: m.expiresAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Memória"
        description="O que a Equipe IA sabe sobre a sua empresa: fatos, preferências, metas e aprendizados usados pelos agentes a cada tarefa."
      />
      <MemoryManager
        memories={rows}
        agents={agents}
        kinds={Object.entries(MEMORY_KINDS).map(([key, label]) => ({ key, label }))}
        canManage={ctx.permissions.has('ai_team.manage')}
      />
    </div>
  );
}
