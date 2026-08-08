'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import { cn } from '../lib/cn';

export interface MenuItem {
  label: string;
  href: string;
}

export interface MenuProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  cta?: React.ReactNode;
  activeHref?: string;
}

export function Menu({ open, onClose, items, cta, activeHref }: MenuProps) {
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-white border-l border-border p-6 lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            aria-label="Menu de navegação"
          >
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="flex h-10 w-10 items-center justify-center rounded-md text-ink/60 hover:bg-ink/[0.05] hover:text-ink transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>
            <ul className="mt-8 flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'block rounded-md px-3 py-3 text-lg font-medium text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink',
                      activeHref === item.href && 'text-ink bg-ink/[0.04]',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {cta && <div className="mt-auto pt-8">{cta}</div>}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
