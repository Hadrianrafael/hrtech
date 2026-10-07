import type { Metadata } from 'next';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { AcceptInviteAsUserButton, AcceptInviteForm } from '@/components/auth/forms';
import { Button, buttonClass } from '@/components/ui/button';
import { Alert } from '@/components/ui/misc';
import { getUser } from '@/lib/auth/context';
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
  const auth = await getUser();
  const header = (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Você foi convidado(a)</h1>
      <p className="mb-6 mt-1 text-sm text-fg-muted">
        Entrar na equipe <strong className="text-fg">{inv.organization.name}</strong> como <strong className="text-fg">{inv.role.name}</strong> ({inv.email}).
      </p>
    </>
  );

  if (!inv.userExists) {
    return (
      <>
        {header}
        <AcceptInviteForm token={token} defaultName={inv.name} />
      </>
    );
  }

  // Conta já existente: aceite apenas com a sessão da própria conta (login normal, com bloqueio por tentativas).
  if (auth && auth.user.email === inv.email) {
    return (
      <>
        {header}
        <AcceptInviteAsUserButton token={token} />
      </>
    );
  }
  const next = `/accept-invite?token=${encodeURIComponent(token)}`;
  return (
    <>
      {header}
      {auth ? (
        <div className="space-y-3">
          <Alert tone="yellow" title="Você está conectado com outra conta">
            Este convite é para {inv.email}. Saia e entre com essa conta para aceitá-lo.
          </Alert>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full justify-center">Sair</Button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">Este e-mail já possui conta na plataforma. Entre com ela para aceitar o convite.</p>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClass('primary', 'md', 'w-full justify-center')}>
            Entrar para aceitar
          </Link>
        </div>
      )}
    </>
  );
}
