'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'custom', label: 'Personalizado' },
];

export function PeriodFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [from, setFrom] = useState(sp.get('from') ?? '');
  const [to, setTo] = useState(sp.get('to') ?? '');
  const [custom, setCustom] = useState(current === 'custom');

  const go = (period: string, extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ period, ...extra });
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border bg-surface p-0.5" role="group" aria-label="Período">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => (o.key === 'custom' ? setCustom(true) : (setCustom(false), go(o.key)))}
            className={cn('rounded-md px-2.5 py-1 text-xs font-medium', (custom ? o.key === 'custom' : current === o.key) ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:text-fg')}
          >
            {o.label}
          </button>
        ))}
      </div>
      {custom && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to) go('custom', { from, to });
          }}
        >
          <input type="date" className="input h-8 w-36 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Data inicial" required />
          <span className="text-xs text-fg-muted">até</span>
          <input type="date" className="input h-8 w-36 text-xs" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Data final" required />
          <button type="submit" className="h-8 rounded-lg bg-brand px-3 text-xs font-medium text-brand-fg">Aplicar</button>
        </form>
      )}
    </div>
  );
}
