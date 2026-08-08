'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconFileText, IconFileTypePdf, IconFileTypeDocx } from '@tabler/icons-react';
import { Skeleton } from '@hrtech/ui';

const NAV_ITEMS = ['Dashboard', 'Processos', 'Clientes', 'Documentos', 'Agenda', 'Financeiro'];

type Screen = 'Dashboard' | 'Processos' | 'Clientes' | 'Documentos';

const SCREENS: Screen[] = ['Dashboard', 'Processos', 'Clientes', 'Documentos'];

function DashboardScreen() {
  const bars = [62, 40, 78, 55, 90, 34, 66];
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {['Processos ativos', 'Prazos esta semana', 'Audiências hoje'].map((label) => (
          <div key={label} className="rounded-lg border border-dark-border bg-dark-surface p-4">
            <span className="text-[11px] text-white/40">{label}</span>
            <Skeleton className="mt-3 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
          <span className="text-[11px] text-white/40">Processos recentes</span>
          <div className="mt-3 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
          <span className="text-[11px] text-white/40">Indicadores da semana</span>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 4 ? 'linear-gradient(180deg, #FF871F 0%, #E92034 100%)' : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessosScreen() {
  const statuses = ['Em andamento', 'Prazo próximo', 'Em andamento', 'Aguardando', 'Em andamento'];
  return (
    <div className="rounded-lg border border-dark-border bg-dark-surface">
      <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
        <span className="text-[11px] text-white/40">Processos</span>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <div className="divide-y divide-dark-border">
        {statuses.map((status, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <span
              className={
                'flex items-center gap-1.5 text-[11px] ' +
                (status === 'Prazo próximo' ? 'text-brand-orange' : 'text-white/35')
              }
            >
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' + (status === 'Prazo próximo' ? 'bg-brand-orange' : 'bg-white/25')
                }
              />
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientesScreen() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-dark-border bg-dark-surface p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentosScreen() {
  const icons = [IconFileTypePdf, IconFileText, IconFileTypeDocx, IconFileText, IconFileTypePdf, IconFileText];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {icons.map((Icon, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-dark-border bg-dark-surface p-4">
          <Icon size={20} className="text-brand-orange" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

const SCREEN_MAP: Record<Screen, React.ComponentType> = {
  Dashboard: DashboardScreen,
  Processos: ProcessosScreen,
  Clientes: ClientesScreen,
  Documentos: DocumentosScreen,
};

export function LegalProductMockup() {
  const [active, setActive] = React.useState<Screen>('Dashboard');
  const ActiveScreen = SCREEN_MAP[active];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
      <div className="hidden flex-col gap-1 lg:flex">
        {NAV_ITEMS.map((label) => {
          const isScreen = SCREENS.includes(label as Screen);
          const isActive = label === active;
          return (
            <button
              key={label}
              type="button"
              disabled={!isScreen}
              onClick={() => isScreen && setActive(label as Screen)}
              className={
                'rounded-md px-3 py-2.5 text-left text-xs transition-colors ' +
                (isActive ? 'bg-brand-gradient-soft text-white' : isScreen ? 'text-white/45 hover:text-white/70' : 'text-white/20')
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex gap-1 lg:hidden">
          {SCREENS.map((screen) => (
            <button
              key={screen}
              type="button"
              onClick={() => setActive(screen)}
              className={
                'rounded-md px-3 py-1.5 text-[11px] transition-colors ' +
                (screen === active ? 'bg-brand-gradient-soft text-white' : 'text-white/40')
              }
            >
              {screen}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ActiveScreen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
