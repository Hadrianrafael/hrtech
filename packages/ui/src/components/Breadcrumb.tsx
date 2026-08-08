import * as React from 'react';
import { IconChevronRight } from '@tabler/icons-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <IconChevronRight size={14} className="text-white/25" />}
            {item.href && !isLast ? (
              <a href={item.href} className="text-white/45 transition-colors hover:text-white">
                {item.label}
              </a>
            ) : (
              <span className={isLast ? 'text-white/85' : 'text-white/45'} aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
