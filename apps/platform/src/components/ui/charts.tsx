import { cn } from '@/lib/utils';

/** Gráficos leves em SVG/CSS (sem dependências), acessíveis e compatíveis com tema escuro. */

export function BarList({ items, format = (n: number) => String(n), empty = 'Sem dados no período.' }: { items: { label: string; value: number; color?: string }[]; format?: (n: number) => string; empty?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (!items.length || max === 0) return <p className="py-6 text-center text-xs text-fg-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="truncate">{i.label}</span>
            <span className="font-medium tabular-nums">{format(i.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, backgroundColor: i.color ?? 'rgb(var(--brand))' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ data, height = 160, empty = 'Sem dados no período.' }: { data: { label: string; value: number }[]; height?: number; empty?: string }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!data.length || max === 0) return <p className="py-10 text-center text-xs text-fg-muted">{empty}</p>;
  const step = Math.max(1, Math.ceil(data.length / 7));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }} role="img" aria-label="Gráfico de colunas">
        {data.map((d) => (
          <div key={d.label} className="group relative flex-1">
            <div className="w-full rounded-t bg-brand/80 transition group-hover:bg-brand" style={{ height: `${Math.max((d.value / max) * height, d.value ? 3 : 1)}px` }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[10px] text-bg group-hover:block">
              {d.label}: {d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] text-fg-muted">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {i % step === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ items, size = 120 }: { items: { label: string; value: number; color: string }[]; size?: number }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return <p className="py-6 text-center text-xs text-fg-muted">Sem dados no período.</p>;
  const r = 15.915;
  let offset = 25;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label="Gráfico de rosca">
        <circle cx="21" cy="21" r={r} fill="transparent" stroke="rgb(var(--muted))" strokeWidth="6" />
        {items.map((i) => {
          const pct = (i.value / total) * 100;
          const el = <circle key={i.label} cx="21" cy="21" r={r} fill="transparent" stroke={i.color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
          offset -= pct;
          return el;
        })}
      </svg>
      <ul className="space-y-1 text-xs">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
            <span className="text-fg-muted">{i.label}</span>
            <span className="font-medium tabular-nums">{Math.round((i.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Progress({ value, max, className }: { value: number; max: number | null; className?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-brand')} style={{ width: `${max ? pct : 0}%` }} />
    </div>
  );
}
