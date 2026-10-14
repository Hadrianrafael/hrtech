import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionProps = {
  id?: string;
  /** Adia o cálculo de layout/pintura enquanto a seção está longe da tela (seções abaixo da dobra). */
  defer?: boolean;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
  'aria-labelledby'?: string;
};

export function Section({ id, defer = true, className, containerClassName, children, ...rest }: SectionProps) {
  return (
    <section id={id} className={cn('relative py-20 sm:py-24 lg:py-32', defer && 'defer-render', className)} {...rest}>
      <div className={cn('container', containerClassName)}>{children}</div>
    </section>
  );
}
