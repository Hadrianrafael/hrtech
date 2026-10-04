import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms';
import { getUser } from '@/lib/auth/context';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getUser()) redirect('/dashboard');
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <p className="mb-6 mt-1 text-sm text-fg-muted">Acesse a central de atendimento da sua empresa.</p>
      <LoginForm next={sp.next} notice={sp.reset ? 'Senha redefinida. Faça login com a nova senha.' : undefined} />
    </>
  );
}
