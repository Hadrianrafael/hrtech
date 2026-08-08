import * as React from 'react';
import { cn } from '../lib/cn';

export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'py-16 md:py-20',
  md: 'py-20 md:py-28',
  lg: 'py-28 md:py-36',
};

export function Section({ className, children, size = 'md', ...props }: SectionProps) {
  return (
    <section className={cn(sizeStyles[size], className)} {...props}>
      {children}
    </section>
  );
}
