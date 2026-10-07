import type { Metadata } from 'next';
import { KnowledgeManager } from '@/components/ai/knowledge-manager';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';

export const metadata: Metadata = { title: 'Base de conhecimento' };

export default async function KnowledgePage() {
  const ctx = await requirePageContext('knowledge.manage');
  const docs = await ctx.db.knowledgeDocument.findMany({ orderBy: { updatedAt: 'desc' }, include: { _count: { select: { chunks: true } } } });
  return (
    <div>
      <PageHeader title="Base de conhecimento" description="Informações da empresa usadas pela IA para responder clientes (RAG)." />
      <KnowledgeManager
        docs={docs.map((d) => ({
          id: d.id, title: d.title, category: d.category, content: d.content, chunks: d._count.chunks, embedded: d.embedded, status: d.status, error: d.error, updatedAt: d.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
