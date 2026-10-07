'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-warning" />
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-fg-muted">
        Não foi possível carregar esta tela. Tente novamente; se o problema persistir, informe o código abaixo ao suporte.
      </p>
      {error.digest && <code className="kbd">{error.digest}</code>}
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
