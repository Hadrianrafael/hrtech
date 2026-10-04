import type { ReactNode } from 'react';
import { cn, initials } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b px-4 py-3', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  gray: 'bg-muted text-fg-muted',
  brand: 'bg-brand-soft text-brand',
  green: 'bg-success/10 text-success',
  yellow: 'bg-warning/10 text-warning',
  red: 'bg-danger/10 text-danger',
  blue: 'bg-info/10 text-info',
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = 'gray', children, className, color }: { tone?: Tone; children: ReactNode; className?: string; color?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', !color && tones[tone], className)}
      style={color ? { backgroundColor: `${color}1f`, color } : undefined}
    >
      {children}
    </span>
  );
}

const palette = ['#ea580c', '#0ea5e9', '#8b5cf6', '#16a34a', '#db2777', '#f59e0b', '#0d9488', '#6366f1'];
export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const color = palette[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && <div className="mb-3 rounded-full bg-muted p-3 text-fg-muted">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'brand' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        {icon && <span className={cn('rounded-lg p-1.5', tones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

export function Alert({ tone = 'yellow', title, children, className }: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone], 'border-current/20', className)} role="status">
      {title && <p className="font-medium">{title}</p>}
      {children && <div className="text-xs opacity-90">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}
