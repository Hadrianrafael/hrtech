import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-60 active:translate-y-px';

const variants: Record<Variant, string> = {
  primary:
    // bg-brand-strong (não bg-brand) para o texto branco atingir 4.5:1 de contraste (WCAG AA).
    'bg-brand-strong text-white shadow-[0_0_0_1px_rgb(var(--brand)/0.4),0_10px_30px_-10px_rgb(var(--brand)/0.7)] hover:bg-[#1d4ed8] hover:shadow-[0_0_0_1px_rgb(var(--brand)/0.5),0_14px_40px_-12px_rgb(var(--brand)/0.9)]',
  secondary: 'border border-line/[0.14] bg-white/[0.03] text-fg hover:border-line/[0.28] hover:bg-white/[0.07]',
  ghost: 'text-muted hover:text-fg',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: Omit<CommonProps, 'children'>) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = CommonProps & Omit<ComponentProps<typeof Link>, 'className' | 'children'> & { external?: boolean };

export function ButtonLink({ variant, size, className, children, external, href, ...props }: ButtonLinkProps) {
  const classes = buttonClasses({ variant, size, className });
  if (external) {
    return (
      <a href={String(href)} className={classes} target="_blank" rel="noopener noreferrer" {...(props as ComponentProps<'a'>)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

type ButtonProps = CommonProps & Omit<ComponentProps<'button'>, 'className' | 'children'>;

export function Button({ variant, size, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
