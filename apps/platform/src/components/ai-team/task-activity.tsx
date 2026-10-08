'use client';

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Time } from '@/components/shared/time';

/** Item da linha do tempo de atividades da Equipe IA (dados já serializados pela página). */
export interface ActivityItem {
  id: string;
  message: string;
  level: string;
  createdAt: string;
  agentName: string | null;
  href: string | null;
}

function LevelIcon({ level }: { level: string }) {
  if (level === 'error') return <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="Erro" />;
  if (level === 'warning') return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="Atenção" />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />;
}

/** Lista de atividades. As mensagens são texto puro (podem conter dados vindos de agentes ou de clientes). */
export function ActivityList({ items, mode = 'ago', empty = 'Nenhuma atividade registrada.' }: { items: ActivityItem[]; mode?: 'ago' | 'datetime'; empty?: string }) {
  if (!items.length) return <p className="px-4 py-6 text-center text-xs text-fg-muted">{empty}</p>;
  return (
    <ol className="divide-y">
      {items.map((a) => (
        <li key={a.id} className="flex gap-2.5 px-4 py-2.5">
          <LevelIcon level={a.level} />
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm">
              {a.href ? (
                <Link href={a.href} className="hover:underline">
                  {a.message}
                </Link>
              ) : (
                a.message
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              {a.agentName ? `${a.agentName} · ` : ''}
              <Time date={a.createdAt} mode={mode} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
