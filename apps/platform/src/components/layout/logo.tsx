import { cn } from '@/lib/utils';

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-[11px] font-bold text-white shadow-sm">HR</span>
      {!compact && (
        <span>
          HR Tech <span className="font-normal text-fg-muted">Omni</span>
        </span>
      )}
    </span>
  );
}
