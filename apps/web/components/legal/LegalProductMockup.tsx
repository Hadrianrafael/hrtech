'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconFileText, IconFileTypePdf, IconFileTypeDocx, IconSparkles, IconBell } from '@tabler/icons-react';
import { Skeleton } from '@hrtech/ui';

const NAV_ITEMS = [
  'Dashboard',
  'Processos',
  'Clientes',
  'Agenda',
  'Tarefas',
  'Documentos',
  'Financeiro',
  'Relatórios',
  'IA',
  'Configurações',
] as const;

type Screen = 'Dashboard' | 'Processos' | 'Clientes' | 'Agenda' | 'Documentos' | 'Financeiro' | 'IA';

const SCREENS: Screen[] = ['Dashboard', 'Processos', 'Clientes', 'Agenda', 'Documentos', 'Financeiro', 'IA'];

function AppHeader() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-dark-border pb-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'linear-gradient(135deg, #E92034, #FF871F)' }} />
        <span className="text-xs font-semibold text-white">Legal Tech</span>
      </div>
      <div className="hidden max-w-[220px] flex-1 sm:block">
        <div className="flex h-7 items-center rounded-md border border-dark-border bg-white/[0.03] px-3">
          <span className="text-[10px] text-white/25">Pesquisar...</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <IconBell size={15} className="text-white/35" />
        <span className="h-6 w-6 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function DashboardScreen() {
  const bars = [62, 40, 78, 55, 90, 34, 66];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['Processos ativos', 'Clientes', 'Prazos próximos', 'Tarefas pendentes'].map((label) => (
          <div key={label} className="rounded-lg border border-dark-border bg-dark-surface p-4">
            <span className="text-[11px] text-white/40">{label}</span>
            <Skeleton className="mt-3 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
          <span className="text-[11px] text-white/40">Próximos prazos</span>
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
          <span className="text-[11px] text-white/40">Processos por status</span>
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

function AgendaScreen() {
  const events = [
    { time: '09:00', day: 'SEG', label: 'Audiência', highlight: false },
    { time: '11:00', day: 'QUA', label: 'Prazo — Contestação', highlight: true },
    { time: '14:30', day: 'TER', label: 'Reunião com cliente', highlight: false },
    { time: '16:00', day: 'QUI', label: 'Audiência', highlight: false },
  ];
  return (
    <div className="rounded-lg border border-dark-border bg-dark-surface">
      <div className="grid grid-cols-5 gap-px overflow-hidden rounded-t-lg bg-dark-border">
        {['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((d) => (
          <div key={d} className="bg-dark-surface py-2.5 text-center">
            <span className="text-[10px] text-white/35">{d}</span>
          </div>
        ))}
      </div>
      <div className="divide-y divide-dark-border">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 shrink-0 font-mono text-[11px] text-white/40">{e.time}</span>
            <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (e.highlight ? 'bg-brand-orange' : 'bg-white/25')} />
            <Skeleton className="h-3 max-w-[140px] flex-1" />
            <span className="ml-auto text-[10px] text-white/30">{e.day}</span>
          </div>
        ))}
      </div>
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

function FinanceiroScreen() {
  const bars = [30, 55, 40, 70, 50, 85, 60];
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {['Receitas', 'Despesas', 'Saldo'].map((label) => (
          <div key={label} className="rounded-lg border border-dark-border bg-dark-surface p-4">
            <span className="text-[11px] text-white/40">{label}</span>
            <Skeleton className="mt-3 h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
          <span className="text-[11px] text-white/40">Fluxo financeiro</span>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 5 ? 'linear-gradient(180deg, #FF871F 0%, #E92034 100%)' : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
          <span className="text-[11px] text-white/40">Cobranças</span>
          <div className="mt-3 space-y-3">
            {['Pago', 'Pendente', 'Pago'].map((status, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16" />
                <span className={'text-[10px] ' + (status === 'Pendente' ? 'text-brand-orange' : 'text-white/35')}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IAScreen() {
  const chips = ['Resumir processo', 'Buscar cláusula', 'Gerar minuta', 'Organizar prazos'];
  return (
    <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg, #E92034, #FF871F)' }}
        >
          <IconSparkles size={14} className="text-white" />
        </span>
        <span className="text-[11px] text-white/40">Assistente jurídico (conceito)</span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="max-w-[75%] rounded-lg rounded-tl-sm bg-white/[0.04] p-3">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="mt-2 h-2.5 w-3/4" />
        </div>
        <div
          className="ml-auto max-w-[65%] rounded-lg rounded-tr-sm p-3"
          style={{ background: 'linear-gradient(135deg, rgba(233,32,52,0.18), rgba(255,135,31,0.14))' }}
        >
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/50">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

const SCREEN_MAP: Record<Screen, React.ComponentType> = {
  Dashboard: DashboardScreen,
  Processos: ProcessosScreen,
  Clientes: ClientesScreen,
  Agenda: AgendaScreen,
  Documentos: DocumentosScreen,
  Financeiro: FinanceiroScreen,
  IA: IAScreen,
};

export interface LegalProductMockupProps {
  /** Which screen to show. When `interactive` is false this is the only screen rendered. */
  defaultScreen?: Screen;
  /** Full tab-switching experience (sidebar + mobile tabs) vs. a single locked screen. */
  interactive?: boolean;
}

export function LegalProductMockup({ defaultScreen = 'Dashboard', interactive = true }: LegalProductMockupProps) {
  const [current, setCurrent] = React.useState<Screen>(defaultScreen);
  const ActiveScreen = SCREEN_MAP[current];

  return (
    <div>
      <AppHeader />
      <div className={interactive ? 'grid grid-cols-1 gap-4 lg:grid-cols-[190px_1fr]' : ''}>
        {interactive && (
          <div className="hidden flex-col gap-1 lg:flex">
            {NAV_ITEMS.map((label) => {
              const isScreen = SCREENS.includes(label as Screen);
              const isActive = label === current;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!isScreen}
                  onClick={() => isScreen && setCurrent(label as Screen)}
                  className={
                    'rounded-md px-3 py-2.5 text-left text-xs transition-colors ' +
                    (isActive
                      ? 'bg-brand-gradient-soft text-white'
                      : isScreen
                        ? 'text-white/45 hover:text-white/70'
                        : 'text-white/20')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div>
          {interactive && (
            <div className="mb-3 flex flex-wrap gap-1 lg:hidden">
              {SCREENS.map((screen) => (
                <button
                  key={screen}
                  type="button"
                  onClick={() => setCurrent(screen)}
                  className={
                    'rounded-md px-3 py-1.5 text-[11px] transition-colors ' +
                    (screen === current ? 'bg-brand-gradient-soft text-white' : 'text-white/40')
                  }
                >
                  {screen}
                </button>
              ))}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
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
    </div>
  );
}
