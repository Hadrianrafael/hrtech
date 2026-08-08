'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-[linear-gradient(135deg,#E92034_0%,#FF871F_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_8px_30px_-8px_rgba(233,32,52,0.55)]',
  secondary: 'text-white bg-surface-elevated border border-border hover:border-white/20 hover:bg-white/[0.06]',
  outline: 'text-white bg-transparent border border-border hover:border-brand-orange/60 hover:bg-white/[0.03]',
  ghost: 'text-white/80 bg-transparent hover:text-white hover:bg-white/[0.06]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-6 text-[15px] gap-2',
  lg: 'h-14 px-8 text-base gap-2.5',
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

type ButtonAsButton = BaseProps &
  Omit<HTMLMotionProps<'button'>, keyof BaseProps | 'children'> & {
    href?: undefined;
    children?: React.ReactNode;
  };

type ButtonAsLink = BaseProps &
  Omit<HTMLMotionProps<'a'>, keyof BaseProps | 'children'> & {
    href: string;
    children?: React.ReactNode;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  'inline-flex items-center justify-center rounded-full font-medium tracking-[-0.01em] transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap select-none';

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variantStyles[variant], sizeStyles[size], fullWidth && 'w-full', className);

  const motionProps = {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  } as const;

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <motion.a href={href} className={classes} {...motionProps} {...rest}>
        {iconLeft}
        {children}
        {iconRight}
      </motion.a>
    );
  }

  return (
    <motion.button className={classes} {...motionProps} {...(props as ButtonAsButton)}>
      {iconLeft}
      {children}
      {iconRight}
    </motion.button>
  );
}
