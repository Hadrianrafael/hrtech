'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue ?? items[0]?.value);
  const layoutId = React.useId();

  const activeItem = items.find((item) => item.value === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex items-center gap-1 overflow-x-auto border-b border-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(item.value)}
              className={cn(
                'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'text-ink' : 'text-ink/45 hover:text-ink/70',
              )}
            >
              {item.label}
              {isActive && (
                <motion.span
                  layoutId={`tabs-indicator-${layoutId}`}
                  className="absolute inset-x-0 -bottom-px h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, #E92034 0%, #FF871F 100%)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-6">{activeItem?.content}</div>
    </div>
  );
}
