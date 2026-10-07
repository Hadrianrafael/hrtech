'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, type ReactNode } from 'react';
import { Badge, type Tone } from '@/components/ui/misc';

export const TASK_STATUS: Record<string, { label: string; tone: Tone }> = {
  QUEUED: { label: 'Na fila', tone: 'gray' },
  RUNNING: { label: 'Em execução', tone: 'blue' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  COMPLETED: { label: 'Concluída', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  CANCELLED: { label: 'Cancelada', tone: 'gray' },
};

export const OBJECTIVE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Aberto', tone: 'gray' },
  IN_PROGRESS: { label: 'Em andamento', tone: 'blue' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', tone: 'yellow' },
  COMPLETED: { label: 'Concluído', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  CANCELLED: { label: 'Cancelado', tone: 'gray' },
};

export const AGENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Ativo', tone: 'green' },
  PAUSED: { label: 'Pausado', tone: 'yellow' },
  DISABLED: { label: 'Desativado', tone: 'gray' },
};

export const RISK: Record<string, { label: string; tone: Tone }> = {
  read: { label: 'Leitura', tone: 'gray' },
  low: { label: 'Baixo', tone: 'blue' },
  medium: { label: 'Médio', tone: 'yellow' },
  high: { label: 'Alto', tone: 'red' },
  critical: { label: 'Crítico', tone: 'red' },
};

export const APPROVAL_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pendente', tone: 'yellow' },
  APPROVED: { label: 'Aprovada', tone: 'green' },
  REJECTED: { label: 'Rejeitada', tone: 'red' },
  EXPIRED: { label: 'Expirada', tone: 'gray' },
};

export function StatusBadge({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value: string }) {
  const s = map[value] ?? { label: value, tone: 'gray' as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Custo em micro-dólares → texto (US$). */
export function usd(micro: number | null | undefined) {
  const v = (micro ?? 0) / 1_000_000;
  return `US$ ${v < 0.01 && v > 0 ? v.toFixed(4) : v.toFixed(2)}`;
}

/** Atualiza a página periodicamente enquanto houver trabalho em andamento. */
export function AutoRefresh({ active, seconds = 5 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [active, seconds, router]);
  return null;
}

function inline(text: string): ReactNode[] {
  // Somente **negrito**: o resto é texto puro (sem HTML — à prova de XSS).
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Renderizador mínimo e seguro de markdown (títulos, listas, numeração, negrito, parágrafos). */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length} className="ml-5 list-decimal space-y-0.5">{items}</ol> : <ul key={blocks.length} className="ml-5 list-disc space-y-0.5">{items}</ul>);
    list = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const level = h[1]!.length;
      blocks.push(
        level <= 1 ? <h3 key={blocks.length} className="mt-3 text-base font-semibold first:mt-0">{inline(h[2]!)}</h3> : level === 2 ? <h4 key={blocks.length} className="mt-3 text-sm font-semibold first:mt-0">{inline(h[2]!)}</h4> : <h5 key={blocks.length} className="mt-2 text-sm font-medium">{inline(h[2]!)}</h5>,
      );
    } else if (bullet || numbered) {
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]!);
    } else if (!line.trim()) {
      flush();
    } else {
      flush();
      blocks.push(<p key={blocks.length}>{inline(line)}</p>);
    }
  }
  flush();
  return <div className={className ?? 'space-y-1.5 text-sm leading-relaxed'}>{blocks}</div>;
}
