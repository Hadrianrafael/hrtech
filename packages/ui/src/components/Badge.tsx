import * as React from 'react';
import { cn } from '../lib/cn';

export type BadgeVariant = 'default' | 'gradient' | 'outline' | 'success' | 'warning' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.06] text-white/80 border border-white/10',
  gradient: 'text-white bg-[linear-gradient(135deg,#E92034_0%,#FF871F_100%)]',
  outline: 'text-white/70 border border-border bg-transparent',
  success: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  warning: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  info: 'bg-sky-400/10 text-sky-400 border border-sky-400/20',
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
