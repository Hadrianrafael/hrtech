'use client';

import { BookOpen, FileUp, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteKnowledgeAction, reindexKnowledgeAction, saveKnowledgeAction, searchKnowledgeAction } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';

export interface DocRow {
  id: string;
  title: string;
  category: string | null;
  content: string;
  chunks: number;
  embedded: boolean;
  status: string;
  error: string | null;
  updatedAt: string;
}

const TEMPLATES = ['Quartos e acomodações', 'Preços e tarifas', 'Check-in e check-out', 'Localização e como chegar', 'Políticas (cancelamento, pets, crianças)', 'Café da manhã e serviços', 'Promoções vigentes'];

export function KnowledgeManager({ docs }: { docs: DocRow[] }) {
  const toast = useToast();
  const [editing, setEditing] = useState<Partial<DocRow> | null>(null);
  const [content, setContent] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ title: string; content: string; score: number }[] | null>(null);
  const save = useAction((fd: FormData) => saveKnowledgeAction(editing?.id ?? null, fd), {
    success: (d) => `Documento indexado em ${d.chunks} trecho(s)${d.embedded ? ' com embeddings' : ' (busca por palavras-chave)'}.`,
    onSuccess: () => setEditing(null),
  });
  const del = useAction((id: string) => deleteKnowledgeAction(id));
  const reindex = useAction(() => reindexKnowledgeAction(), { success: (d) => `${d.total} documento(s) reindexado(s); ${d.embedded} com embeddings.` });
  const search = useAction((q: string) => searchKnowledgeAction(q), { refresh: false, onSuccess: setResults });

  const open = (d: Partial<DocRow>) => {
    setEditing(d);
    setContent(d.content ?? '');
  };

  const onFile = async (file: File) => {
    if (file.size > 1_000_000) return toast.error('Arquivo muito grande (máx. 1 MB).');
    if (!/\.(txt|md|csv|json)$/i.test(file.name)) return toast.error('Formatos aceitos: .txt, .md, .csv, .json. Para PDF/Word, copie e cole o texto.');
    setContent(await file.text());
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader
          title="Documentos"
          description="Conteúdo exclusivo da sua empresa — nunca é compartilhado com outras contas."
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" loading={reindex.pending} onClick={() => reindex.run()}><RefreshCw className="h-3.5 w-3.5" /> Reindexar</Button>
              <Button size="sm" onClick={() => open({})}><Plus className="h-3.5 w-3.5" /> Documento</Button>
            </div>
          }
        />
        {docs.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="Sua base de conhecimento está vazia"
            description="Cadastre quartos, preços, políticas, localização e perguntas frequentes para que a IA responda com informações corretas."
            action={<div className="flex flex-wrap justify-center gap-1.5">{TEMPLATES.map((t) => <Button key={t} size="sm" variant="outline" onClick={() => open({ title: t })}>{t}</Button>)}</div>}
          />
        ) : (
          <ul className="divide-y">
            {docs.map((d) => (
              <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="line-clamp-2 text-xs text-fg-muted">{d.content}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {d.category && <Badge>{d.category}</Badge>}
                    <Badge tone={d.embedded ? 'green' : 'gray'}>{d.embedded ? 'Embeddings' : 'Palavras-chave'}</Badge>
                    <Badge>{d.chunks} trecho(s)</Badge>
                    <span className="text-[11px] text-fg-muted">atualizado <Time date={d.updatedAt} /></span>
                  </div>
                  {d.error && <p className="mt-1 text-[11px] text-warning">{d.error}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => open(d)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`Excluir "${d.title}"?`) && del.run(d.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="h-fit">
        <CardHeader title="Testar busca (RAG)" description="Veja quais trechos a IA usaria para responder" />
        <form className="flex gap-2 p-3" onSubmit={(e) => (e.preventDefault(), query.trim() && void search.run(query))}>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: aceita cachorro?" aria-label="Pergunta" />
          <Button type="submit" variant="secondary" loading={search.pending} aria-label="Buscar"><Search className="h-4 w-4" /></Button>
        </form>
        {results && (
          <ul className="space-y-2 px-3 pb-3">
            {results.map((r, i) => (
              <li key={i} className="rounded-lg border p-2.5 text-xs">
                <p className="mb-1 flex justify-between font-medium"><span>{r.title}</span><span className="text-fg-muted">relevância {r.score}</span></p>
                <p className="line-clamp-4 text-fg-muted">{r.content}</p>
              </li>
            ))}
            {!results.length && <li className="text-xs text-fg-muted">Nenhum trecho relevante encontrado.</li>}
          </ul>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar documento' : 'Novo documento'} size="lg">
        <form action={async (fd) => void (await save.run(fd))} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título *" error={save.fieldErrors.title}><Input name="title" defaultValue={editing?.title} required /></Field>
            <Field label="Categoria"><Input name="category" defaultValue={editing?.category ?? ''} placeholder="Ex.: Políticas" /></Field>
          </div>
          <Field label="Conteúdo *" error={save.fieldErrors.content} hint="Escreva de forma clara e completa. Preços, regras e condições devem estar atualizados.">
            <Textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={12} required />
          </Field>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-brand">
            <FileUp className="h-4 w-4" /> Importar de arquivo (.txt, .md, .csv)
            <input type="file" accept=".txt,.md,.csv,.json,text/plain" className="sr-only" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
          </label>
          <input type="hidden" name="sourceType" value="text" />
          <div className="flex justify-end border-t pt-3">
            <Button type="submit" loading={save.pending}>Salvar e indexar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
