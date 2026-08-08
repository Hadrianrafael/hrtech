import * as React from 'react';
import { cn } from '../lib/cn';

export interface MarqueeProps {
  items: string[];
  className?: string;
  speed?: number;
}

/**
 * Infinite horizontal band — pure CSS transform, no JS/rAF, cheap even on
 * low-end mobile. Duplicates the item list once so the loop has no seam.
 */
export function Marquee({ items, className, speed = 32 }: MarqueeProps) {
  return (
    <div
      className={cn('group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]', className)}
      aria-hidden
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className="flex shrink-0 items-center gap-10 pr-10 motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused]"
          style={{ ['--marquee-duration' as string]: `${speed}s` }}
        >
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              <span className="font-mono text-sm uppercase tracking-[0.2em] text-white/35">{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange/50" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
