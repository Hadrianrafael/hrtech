import type { Metadata } from 'next';
import Link from 'next/link';
import { AcceptInviteForm } from '@/components/auth/forms';
import { Alert } from '@/components/ui/misc';
import { getInvitationByToken } from '@/server/auth-service';

export const metadata: Metadata = { title: 'Aceitar convite' };

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const inv = token ? await getInvitationByToken(token) : null;
  if (!token || !inv)
    return (
      <Alert tone="red" title="Convite inválido ou expirado">
        Peça ao administrador da empresa um novo convite. <Link href="/login" className="underline">Ir para o login</Link>
      </Alert>
    );
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Você foi convidado(a)</h1>
      <p className="mb-6 mt-1 text-sm text-fg-muted">
        Entrar na equipe <strong className="text-fg">{inv.organization.name}</strong> como <strong className="text-fg">{inv.role.name}</strong> ({inv.email}).
      </p>
      <AcceptInviteForm token={token} userExists={inv.userExists} defaultName={inv.name} />
    </>
  );
}
