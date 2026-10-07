'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/action';
import { useToast } from './toast';

/**
 * Executa uma server action com feedback padronizado: estado de carregamento,
 * toast de sucesso/erro, erros por campo e atualização da página.
 */
export function useAction<A extends unknown[], T>(
  action: (...args: A) => Promise<ActionResult<T>>,
  opts: { success?: string | ((data: T) => string | null); onSuccess?: (data: T) => void; refresh?: boolean } = {},
) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = (...args: A) =>
    new Promise<ActionResult<T>>((resolve) => {
      startTransition(async () => {
        let result: ActionResult<T>;
        try {
          result = await action(...args);
        } catch {
          result = { ok: false, error: 'Falha de comunicação com o servidor. Verifique sua conexão.' };
        }
        if (result.ok) {
          setFieldErrors({});
          const msg = typeof opts.success === 'function' ? opts.success(result.data) : (opts.success ?? result.message);
          if (msg) toast.success(msg);
          opts.onSuccess?.(result.data);
          if (opts.refresh !== false) router.refresh();
        } else {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error(result.error);
        }
        resolve(result);
      });
    });

  return { run, pending, fieldErrors };
}
