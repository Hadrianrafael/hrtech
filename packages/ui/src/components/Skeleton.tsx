import * as React from 'react';
import { cn } from '../lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Used inside MockupFrame (a deliberately dark product-screenshot surface),
 * so this stays dark-toned regardless of the site's light theme.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
