import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
};

export function SectionHeading({ id, eyebrow, title, description, align = 'left', className, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className={cn('eyebrow', align === 'center' && 'justify-center')}>
        <span className="h-px w-6 bg-brand-soft/60" aria-hidden="true" />
        {eyebrow}
      </p>
      <Tag
        id={id}
        className={cn(
          'mt-5 font-semibold tracking-tightest text-fg',
          Tag === 'h1' ? 'text-[2.4rem] leading-[1.05] sm:text-5xl lg:text-6xl' : 'text-[2rem] leading-[1.08] sm:text-[2.6rem] lg:text-5xl',
        )}
      >
        {title}
      </Tag>
      {description && <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}
