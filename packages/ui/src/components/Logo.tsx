import * as React from 'react';

export interface LogoProps {
  className?: string;
  markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={className ? `inline-flex items-center gap-2.5 ${className}` : 'inline-flex items-center gap-2.5'}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
        aria-hidden
      >
        H
      </span>
      {!markOnly && (
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-white">
          HR<span className="text-white/50 font-normal"> Tech</span>
        </span>
      )}
    </span>
  );
}
