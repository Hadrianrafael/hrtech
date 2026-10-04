import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-semibold text-brand">404</p>
      <h1 className="text-lg font-semibold">Página não encontrada</h1>
      <p className="text-sm text-fg-muted">O endereço acessado não existe ou foi removido.</p>
      <Link href="/dashboard" className={buttonClass('primary', 'md', 'mt-2')}>
        Voltar ao início
      </Link>
    </main>
  );
}
