'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/cn';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'ghost';
  hoverable?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  surface: 'bg-surface border border-border',
  elevated: 'bg-surface-elevated border border-border',
  ghost: 'bg-transparent border border-border/60',
};

const paddingStyles = {
  none: '',
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-10',
};

export function Card({
  children,
  variant = 'surface',
  hoverable = false,
  glow = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl transition-colors duration-300',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'hover:border-white/20 cursor-default',
        className,
      )}
      {...(hoverable ? { whileHover: { y: -4 } } : {})}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      {...props}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(135deg, rgba(233,32,52,0.15) 0%, rgba(255,135,31,0.15) 100%)',
            maskImage: 'linear-gradient(#000, #000)',
          }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function CardEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block text-xs font-semibold uppercase tracking-[0.14em] bg-[linear-gradient(135deg,#E92034_0%,#FF871F_100%)] bg-clip-text text-transparent',
        className,
      )}
    >
      {children}
    </span>
  );
}
