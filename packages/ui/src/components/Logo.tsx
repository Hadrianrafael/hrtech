import * as React from 'react';
import { LogoMark } from './LogoMark';

export interface LogoProps {
  className?: string;
  markOnly?: boolean;
  tagline?: boolean;
}

export function Logo({ className, markOnly = false, tagline = false }: LogoProps) {
  return (
    <span className={className ? `inline-flex items-center gap-2.5 ${className}` : 'inline-flex items-center gap-2.5'}>
      <LogoMark size={32} />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-white">
            HR<span className="text-white/50 font-normal"> Tech</span>
          </span>
          {tagline && (
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Desenvolvimento de Sistemas
            </span>
          )}
        </span>
      )}
    </span>
  );
}
