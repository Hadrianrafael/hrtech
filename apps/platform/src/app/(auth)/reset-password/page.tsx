import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetForm } from '@/components/auth/forms';
import { Alert } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'Redefinir senha' };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Definir nova senha</h1>
      <p className="mb-6 mt-1 text-sm text-fg-muted">Escolha uma senha forte para sua conta.</p>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Alert tone="red" title="Link inválido">
          <Link href="/forgot-password" className="underline">Solicite um novo link.</Link>
        </Alert>
      )}
    </>
  );
}
