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
        <span
          className="text-xs font-semibold uppercase tracking-[0.16em] bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
        >
          {eyebrow}
        </span>
      )}
      <h2 className={cn('mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl md:text-[2.75rem]')}>
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">{description}</p>}
    </Reveal>
  );
}
