import * as React from 'react';
import { cn } from '../lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-surface via-surface-elevated to-surface bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
