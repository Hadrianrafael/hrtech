import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-semibold text-brand">403</p>
      <h1 className="text-lg font-semibold">Acesso não permitido</h1>
      <p className="max-w-md text-sm text-fg-muted">Seu perfil não tem permissão para acessar esta área. Fale com o administrador da sua empresa.</p>
      <Link href="/dashboard" className={buttonClass('primary')}>Voltar ao dashboard</Link>
    </main>
  );
}
