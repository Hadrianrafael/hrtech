import * as React from 'react';
import { cn } from '../lib/cn';
import { LogoMark } from './LogoMark';

export interface LogoProps {
  className?: string;
  markOnly?: boolean;
  tagline?: boolean;
  /** 'onLight' (default) for the white/off-white site body, 'onDark' for the footer or dark accent sections. */
  tone?: 'onLight' | 'onDark';
}

export function Logo({ className, markOnly = false, tagline = false, tone = 'onLight' }: LogoProps) {
  const wordmark = tone === 'onDark' ? 'text-white' : 'text-ink';
  const wordmarkSoft = tone === 'onDark' ? 'text-white/45' : 'text-ink/40';
  const taglineColor = tone === 'onDark' ? 'text-white/35' : 'text-ink/35';

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={32} />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className={cn('text-[17px] font-semibold tracking-[-0.01em]', wordmark)}>
            HR<span className={cn('font-normal', wordmarkSoft)}> Tech</span>
          </span>
          {tagline && (
            <span className={cn('mt-1 font-mono text-[10px] uppercase tracking-[0.16em]', taglineColor)}>
              Desenvolvimento de Sistemas
            </span>
          )}
        </span>
      )}
    </span>
  );
}
