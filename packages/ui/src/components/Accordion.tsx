'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '../lib/cn';

export interface AccordionItem {
  value: string;
  question: string;
  answer: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [open, setOpen] = React.useState<string[]>([]);

  const toggle = (value: string) => {
    setOpen((prev) => {
      const isOpen = prev.includes(value);
      if (allowMultiple) {
        return isOpen ? prev.filter((v) => v !== value) : [...prev, value];
      }
      return isOpen ? [] : [value];
    });
  };

  return (
    <div className={cn('flex flex-col divide-y divide-border border-y border-border', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.value);
        return (
          <div key={item.value}>
            <button
              onClick={() => toggle(item.value)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[15px] font-medium text-white">{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-white/70"
              >
                <IconPlus size={14} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 pr-10 text-sm leading-relaxed text-white/55">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
