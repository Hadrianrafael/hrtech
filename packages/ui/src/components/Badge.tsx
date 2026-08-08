import * as React from 'react';
import { cn } from '../lib/cn';

export type BadgeVariant = 'default' | 'gradient' | 'outline' | 'success' | 'warning' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-alt text-ink/70 border border-border',
  gradient: 'text-white bg-[linear-gradient(135deg,#E92034_0%,#FF871F_100%)]',
  outline: 'text-ink/60 border border-border bg-transparent',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = 'default', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
