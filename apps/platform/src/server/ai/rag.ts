import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertWithinLimit } from '../billing/limits';
import { getAiProvider } from './provider';

/**
 * RAG por organização. Toda leitura/escrita passa por `ctx.db` (escopo do tenant + RLS),
 * portanto a IA nunca recupera conhecimento de outra empresa.
 *
 * Recuperação: similaridade de cosseno quando há embeddings; caso contrário (ou como reforço),
 * pontuação por palavras-chave. Os embeddings ficam em `Float[]` — migração futura para pgvector
 * exige apenas trocar a coluna e a consulta em `retrieve`.
 */

const STOPWORDS = new Set(
  'a o e de da do das dos em no na nos nas um uma uns umas para por com sem que se ao aos à às é ser são foi tem ter como mais menos muito qual quais quando onde ou meu minha seu sua isso esse essa este esta vocês você eu nós the and of to in is are'.split(' '),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Divide texto em blocos (~maxChars) respeitando parágrafos, com sobreposição. */
export function chunkText(text: string, maxChars = 900, overlap = 150): string[] {
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > maxChars && current) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + '\n\n' + p;
    } else current = current ? `${current}\n\n${p}` : p;
    while (current.length > maxChars * 1.5) {
      chunks.push(current.slice(0, maxChars).trim());
      current = current.slice(maxChars - overlap);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export function keywordScore(query: string, content: string): number {
  const q = new Set(tokenize(query));
  if (!q.size) return 0;
  const tokens = tokenize(content);
  if (!tokens.length) return 0;
  let hits = 0;
  const seen = new Set<string>();
  for (const t of tokens) {
    if (q.has(t)) {
      hits++;
      seen.add(t);
    }
  }
  return seen.size / q.size + Math.min(hits / tokens.length, 0.2);
}

export async function indexDocument(ctx: ServiceCtx, documentId: string) {
  const doc = await ctx.db.knowledgeDocument.findFirst({ where: { id: documentId } });
  if (!doc) throw new NotFoundError('Documento não encontrado.');
  const chunks = chunkText(`${doc.title}\n\n${doc.content}`);
  let embeddings: number[][] = [];
  let embedded = false;
  let error: string | null = null;
  const provider = getAiProvider();
  if (provider?.embed && chunks.length) {
    try {
      embeddings = await provider.embed(chunks);
      embedded = embeddings.length === chunks.length;
    } catch (err) {
      error = 'Falha ao gerar embeddings; usando busca por palavras-chave.';
      logger.warn('rag.embed_failed', { orgId: ctx.orgId, err });
    }
  }
  await ctx.db.knowledgeChunk.deleteMany({ where: { documentId } });
  if (chunks.length) {
    await ctx.db.knowledgeChunk.createMany({
      data: chunks.map((content, index) => ({
        organizationId: ctx.orgId,
        documentId,
        index,
        content,
        embedding: embedded ? embeddings[index]! : [],
      })),
    });
  }
  await ctx.db.knowledgeDocument.update({ where: { id: documentId }, data: { status: 'READY', embedded, error } });
  return { chunks: chunks.length, embedded };
}

export async function retrieve(ctx: ServiceCtx, query: string, k = 5) {
  const chunks = await ctx.db.knowledgeChunk.findMany({
    select: { id: true, content: true, embedding: true, document: { select: { title: true } } },
    take: 3000,
  });
  if (!chunks.length || !query.trim()) return [];
  let queryEmbedding: number[] | null = null;
  const provider = getAiProvider();
  if (provider?.embed && chunks.some((c) => c.embedding.length)) {
    try {
      queryEmbedding = (await provider.embed([query]))[0] ?? null;
    } catch (err) {
      logger.warn('rag.query_embed_failed', { err });
    }
  }
  const scored = chunks.map((c) => {
    const kw = keywordScore(query, c.content);
    const vec = queryEmbedding && c.embedding.length ? cosine(queryEmbedding, c.embedding) : 0;
    return { id: c.id, title: c.document.title, content: c.content, score: queryEmbedding ? vec * 0.8 + kw * 0.2 : kw };
  });
  return scored
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ─────────────── CRUD da base de conhecimento ───────────────

export async function getDefaultKnowledgeBase(ctx: ServiceCtx) {
  return (
    (await ctx.db.knowledgeBase.findFirst({ orderBy: { createdAt: 'asc' } })) ??
    (await ctx.db.knowledgeBase.create({ data: { organizationId: ctx.orgId, name: 'Base principal' } }))
  );
}

export async function saveKnowledgeDocument(
  ctx: ServiceCtx,
  id: string | null,
  input: { title: string; content: string; category?: string | null; sourceType?: string },
) {
  assertCan(ctx, 'knowledge.manage');
  let doc;
  if (id) {
    if (!(await ctx.db.knowledgeDocument.findFirst({ where: { id } }))) throw new NotFoundError('Documento não encontrado.');
    doc = await ctx.db.knowledgeDocument.update({ where: { id }, data: { title: input.title, content: input.content, category: input.category ?? null, status: 'INDEXING' } });
  } else {
    await assertWithinLimit(ctx, 'knowledgeDocuments');
    const kb = await getDefaultKnowledgeBase(ctx);
    doc = await ctx.db.knowledgeDocument.create({
      data: {
        organizationId: ctx.orgId,
        knowledgeBaseId: kb.id,
        title: input.title,
        content: input.content,
        category: input.category ?? null,
        sourceType: input.sourceType ?? 'text',
        status: 'INDEXING',
      },
    });
  }
  const result = await indexDocument(ctx, doc.id);
  return { doc, ...result };
}

export async function deleteKnowledgeDocument(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'knowledge.manage');
  await ctx.db.knowledgeDocument.delete({ where: { id } });
}

export async function reindexAll(ctx: ServiceCtx) {
  assertCan(ctx, 'knowledge.manage');
  const docs = await ctx.db.knowledgeDocument.findMany({ select: { id: true } });
  let embedded = 0;
  for (const d of docs) if ((await indexDocument(ctx, d.id)).embedded) embedded++;
  return { total: docs.length, embedded };
}
