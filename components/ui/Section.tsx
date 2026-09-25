import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionProps = {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
  'aria-labelledby'?: string;
};

export function Section({ id, className, containerClassName, children, ...rest }: SectionProps) {
  return (
    <section id={id} className={cn('relative py-20 sm:py-24 lg:py-32', className)} {...rest}>
      <div className={cn('container', containerClassName)}>{children}</div>
    </section>
  );
}
