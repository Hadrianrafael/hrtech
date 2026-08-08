'use client';

import * as React from 'react';
import { IconArrowRight, IconLoader2 } from '@tabler/icons-react';
import { Button, Input, Textarea, useToast } from '@hrtech/ui';

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}

const initialState: FormState = { name: '', company: '', email: '', phone: '', message: '' };

export function ContactForm() {
  const { push } = useToast();
  const [form, setForm] = React.useState<FormState>(initialState);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Informe seu nome completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Informe um e-mail válido.';
    if (form.message.trim().length < 10) nextErrors.message = 'Conte um pouco mais sobre o que você precisa.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company || undefined,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
        }),
      });

      if (res.status === 204) {
        push('Mensagem enviada! Vamos responder em breve.', 'success');
        setForm(initialState);
      } else {
        const data = await res.json().catch(() => null);
        const message =
          typeof data?.message === 'string'
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(' ')
              : 'Não foi possível enviar sua mensagem. Tente novamente.';
        push(message, 'error');
      }
    } catch {
      push('Não foi possível conectar ao servidor. Tente novamente em instantes.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Nome"
          placeholder="Seu nome completo"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          required
        />
        <Input
          label="Empresa"
          placeholder="Nome da sua empresa (opcional)"
          value={form.company}
          onChange={update('company')}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@empresa.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <Input
          label="Telefone"
          placeholder="(11) 91234-5678 (opcional)"
          value={form.phone}
          onChange={update('phone')}
        />
      </div>
      <Textarea
        label="Mensagem"
        placeholder="Conte o que você precisa..."
        value={form.message}
        onChange={update('message')}
        error={errors.message}
        required
      />
      <Button type="submit" size="lg" disabled={submitting} iconRight={submitting ? undefined : <IconArrowRight size={18} />}>
        {submitting ? (
          <>
            <IconLoader2 size={18} className="animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar mensagem'
        )}
      </Button>
    </form>
  );
}
