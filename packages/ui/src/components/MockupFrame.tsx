import * as React from 'react';
import { cn } from '../lib/cn';

export interface MockupFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function MockupFrame({ label, className, children, ...props }: MockupFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-[#0A0A0A] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        {label && <span className="ml-3 truncate text-xs text-white/35">{label}</span>}
      </div>
      <div className="p-5 md:p-7">{children}</div>
    </div>
  );
}
