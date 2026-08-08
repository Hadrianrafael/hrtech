import * as React from 'react';
import { cn } from '../lib/cn';
import { Reveal } from './Reveal';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, align = 'left', className }: SectionHeadingProps) {
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-orange">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-ink/55 md:text-lg">{description}</p>}
    </Reveal>
  );
}
