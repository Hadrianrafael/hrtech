import { cn } from '@/lib/cn';

/**
 * Marca HR Tech: glifo "HR" combinado (a haste direita do H é a haste do R)
 * alimentado por três trilhas de circuito — identidade oficial (degradê
 * laranja/dourado da logo, com as trilhas de circuito em vermelho como
 * toque de destaque).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="hr-mark" x1="8" y1="2" x2="50" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDBA74" />
          <stop offset="0.55" stopColor="#F97316" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="hr-mark-accent" x1="0" y1="8" x2="10" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F87171" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      {/* trilhas de circuito — toque de vermelho */}
      <g stroke="url(#hr-mark-accent)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="2" y1="8" x2="10" y2="8" />
        <line x1="1" y1="20" x2="10" y2="20" />
        <line x1="4" y1="32" x2="10" y2="32" />
      </g>
      <g fill="url(#hr-mark-accent)">
        <circle cx="2" cy="8" r="1.5" />
        <circle cx="1.5" cy="20" r="1.5" />
        <circle cx="4" cy="32" r="1.5" />
      </g>
      {/* glifo HR — laranja/dourado, cor principal da marca */}
      <g fill="url(#hr-mark)">
        <rect x="10" y="4" width="6" height="32" rx="2" />
        <rect x="26" y="4" width="6" height="32" rx="2" />
        <rect x="10" y="17" width="22" height="6" rx="2" />
        <rect x="32" y="4" width="15" height="16" rx="8" />
      </g>
      <path d="M34 20 47 36" stroke="url(#hr-mark)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-[22px] w-auto" />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
          HR Tech <span className="font-normal text-muted">Sistemas</span>
        </span>
        {showTagline && (
          <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">Software house</span>
        )}
      </span>
    </span>
  );
}
