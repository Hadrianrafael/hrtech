import { logoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

export default function Suspended() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Conta suspensa</h1>
      <p className="max-w-md text-sm text-fg-muted">O acesso desta empresa está temporariamente suspenso. Entre em contato com a HR Tech para regularizar.</p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">Sair</Button>
      </form>
    </main>
  );
}
