import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TagProps = { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning'; className?: string };

const tones = {
  neutral: 'border-line/[0.1] bg-white/[0.03] text-muted',
  brand: 'border-brand/30 bg-brand/10 text-brand-soft',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
};

export function Tag({ children, tone = 'neutral', className }: TagProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]', tones[tone], className)}>
      {children}
    </span>
  );
}
