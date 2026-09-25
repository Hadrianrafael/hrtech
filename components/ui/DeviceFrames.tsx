import Image from 'next/image';
import type { ReactNode } from 'react';
import { asset } from '@/lib/paths';
import { cn } from '@/lib/cn';

type BrowserFrameProps = {
  children?: ReactNode;
  src?: string;
  alt?: string;
  url?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrowserFrame({ children, src, alt = '', url, className, priority, sizes = '(min-width: 1024px) 60vw, 100vw' }: BrowserFrameProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line/[0.1] bg-elevated shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]', className)}>
      <div className="flex h-8 items-center gap-1.5 border-b border-line/[0.08] bg-surface px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        {url && (
          <span className="ml-3 hidden min-w-0 truncate rounded-md bg-white/[0.04] px-3 py-0.5 font-mono text-[10.5px] text-subtle sm:block">
            {url}
          </span>
        )}
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
        {src ? (
          <Image src={asset(src)} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function PhoneFrame({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[2rem] border border-line/[0.14] bg-elevated p-1.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]', className)}>
      <div className="relative aspect-[390/844] w-full overflow-hidden rounded-[1.6rem] bg-surface">
        <Image src={asset(src)} alt={alt} fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-cover object-top" />
      </div>
    </div>
  );
}
