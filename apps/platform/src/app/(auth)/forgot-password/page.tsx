import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
      <p className="mb-6 mt-1 text-sm text-fg-muted">Informe seu e-mail para receber o link de redefinição.</p>
      <ForgotForm />
    </>
  );
}
