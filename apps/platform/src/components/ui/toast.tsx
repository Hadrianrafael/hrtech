'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const Ctx = createContext<(kind: ToastKind, message: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100%-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info;
          return (
            <div key={t.id} className="pointer-events-auto flex items-start gap-2 rounded-lg border bg-surface px-3 py-2.5 text-sm shadow-pop">
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.kind === 'success' ? 'text-success' : t.kind === 'error' ? 'text-danger' : 'text-info')} />
              <p className="flex-1">{t.message}</p>
              <button type="button" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="text-fg-muted" aria-label="Fechar">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const push = useContext(Ctx);
  return {
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
  };
}
