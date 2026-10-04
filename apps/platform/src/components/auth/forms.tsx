'use client';

import Link from 'next/link';
import { useState } from 'react';
import { acceptInviteAction, forgotPasswordAction, loginAction, resetPasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Alert } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const { run, pending, fieldErrors } = useAction(loginAction, { refresh: false });
  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-4">
      {notice && <Alert tone="green">{notice}</Alert>}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="E-mail" htmlFor="email" error={fieldErrors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Senha" htmlFor="password" error={fieldErrors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-brand hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" loading={pending} className="w-full justify-center">
        Entrar
      </Button>
    </form>
  );
}

export function ForgotForm() {
  const [done, setDone] = useState<{ devLink?: string } | null>(null);
  const { run, pending, fieldErrors } = useAction(forgotPasswordAction, { refresh: false, onSuccess: (d) => setDone(d) });
  if (done)
    return (
      <div className="space-y-3">
        <Alert tone="green" title="Verifique seu e-mail">
          Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha (válido por 1 hora).
        </Alert>
        {done.devLink && (
          <Alert tone="blue" title="Modo desenvolvimento (SMTP não configurado)">
            <a href={done.devLink} className="break-all underline">
              {done.devLink}
            </a>
          </Alert>
        )}
        <Link href="/login" className="text-sm text-brand hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-4">
      <Field label="E-mail" htmlFor="email" error={fieldErrors.email}>
        <Input id="email" name="email" type="email" required autoFocus />
      </Field>
      <Button type="submit" loading={pending} className="w-full justify-center">
        Enviar link de redefinição
      </Button>
      <Link href="/login" className="block text-center text-xs text-fg-muted hover:underline">
        Voltar ao login
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { run, pending, fieldErrors } = useAction(resetPasswordAction, { refresh: false });
  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" htmlFor="password" error={fieldErrors.password} hint="Mínimo de 8 caracteres, com letras e números.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirmar senha" htmlFor="confirm" error={fieldErrors.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full justify-center">
        Redefinir senha
      </Button>
    </form>
  );
}

export function AcceptInviteForm({ token, userExists, defaultName }: { token: string; userExists: boolean; defaultName?: string | null }) {
  const { run, pending, fieldErrors } = useAction(acceptInviteAction, { refresh: false });
  return (
    <form action={async (fd) => void (await run(fd))} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {!userExists && (
        <Field label="Seu nome" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" name="name" defaultValue={defaultName ?? ''} required />
        </Field>
      )}
      <Field
        label={userExists ? 'Senha da sua conta existente' : 'Crie uma senha'}
        htmlFor="password"
        error={fieldErrors.password}
        hint={userExists ? 'Você já possui conta na plataforma: confirme sua senha para entrar na nova empresa.' : 'Mínimo de 8 caracteres, com letras e números.'}
      >
        <Input id="password" name="password" type="password" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full justify-center">
        Aceitar convite
      </Button>
    </form>
  );
}
