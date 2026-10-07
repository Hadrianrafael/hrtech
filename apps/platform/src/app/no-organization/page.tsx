import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

export default function NoOrg() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Nenhuma empresa vinculada</h1>
      <p className="max-w-md text-sm text-fg-muted">Sua conta ainda não faz parte de nenhuma empresa ativa. Peça um convite ao administrador da sua empresa.</p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">Sair</Button>
      </form>
      <Link href="/login" className="text-xs text-fg-muted underline">Voltar</Link>
    </main>
  );
}
