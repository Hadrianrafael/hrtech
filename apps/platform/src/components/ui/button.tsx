import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg hover:bg-brand/90 shadow-sm',
  secondary: 'bg-muted text-fg hover:bg-muted/70',
  outline: 'border bg-surface text-fg hover:bg-muted',
  ghost: 'text-fg-muted hover:bg-muted hover:text-fg',
  danger: 'bg-danger text-white hover:bg-danger/90',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn('inline-flex shrink-0 items-center rounded-lg font-medium transition', variants[variant], sizes[size], className);
}
