'use client';

import { useId, useState, type FormEvent } from 'react';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';
import { budgetRanges, formatContactMessage, projectTypes, validateContact, type ContactErrors, type ContactPayload } from '@/lib/contact';
import { cn } from '@/lib/cn';
import { mailtoLink, whatsappLink } from '@/lib/whatsapp';

const emptyForm: ContactPayload = { name: '', company: '', email: '', whatsapp: '', projectType: '', budget: '', message: '' };

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; channel: 'endpoint' | 'whatsapp' | 'email' } | { kind: 'error'; message: string };

const fieldClass =
  'mt-2 block w-full rounded-xl border border-line/[0.12] bg-bg/60 px-4 py-3 text-[15px] text-fg placeholder:text-subtle/80 transition-[border-color,box-shadow] duration-200 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-rose-400/60';

export function ContactForm() {
  const formId = useId();
  const [form, setForm] = useState<ContactPayload>(emptyForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const hasEndpoint = Boolean(siteConfig.contactFormEndpoint);

  const update = (field: keyof ContactPayload) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const result = validateContact(form);
    setErrors(result);
    const firstError = Object.keys(result)[0];
    if (firstError) {
      document.getElementById(`${formId}-${firstError}`)?.focus();
      return false;
    }
    return true;
  };

  const sendByEmail = () => {
    if (!validate()) return;
    window.location.href = mailtoLink(`Orçamento — ${form.projectType} — ${form.name}`, formatContactMessage(form));
    setStatus({ kind: 'sent', channel: 'email' });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const honeypot = new FormData(event.currentTarget).get('website');
    if (honeypot) return;
    if (!validate()) return;

    if (!hasEndpoint) {
      window.open(whatsappLink(formatContactMessage(form)), '_blank', 'noopener,noreferrer');
      setStatus({ kind: 'sent', channel: 'whatsapp' });
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      const response = await fetch(siteConfig.contactFormEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, _subject: `Novo contato pelo site — ${form.projectType}` }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus({ kind: 'sent', channel: 'endpoint' });
      setForm(emptyForm);
    } catch {
      setStatus({ kind: 'error', message: 'Não foi possível enviar agora. Tente pelo WhatsApp ou e-mail.' });
    }
  };

  const field = (name: keyof ContactPayload) => ({
    id: `${formId}-${name}`,
    name,
    value: form[name],
    onChange: update(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${formId}-${name}-error` : undefined,
  });

  const errorText = (name: keyof ContactPayload) =>
    errors[name] ? (
      <p id={`${formId}-${name}-error`} className="mt-1.5 text-xs text-rose-300">
        {errors[name]}
      </p>
    ) : null;

  const label = (name: keyof ContactPayload, text: string, optional = false) => (
    <label htmlFor={`${formId}-${name}`} className="text-sm font-medium text-fg/90">
      {text}
      {optional ? <span className="ml-1 font-normal text-subtle">(opcional)</span> : <span className="ml-0.5 text-brand-soft" aria-hidden="true">*</span>}
    </label>
  );

  if (status.kind === 'sent') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
          <Icon name="check" size={26} strokeWidth={2} />
        </span>
        <h3 className="mt-6 text-xl font-semibold text-fg">
          {status.channel === 'endpoint' ? 'Mensagem enviada!' : 'Quase lá!'}
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {status.channel === 'endpoint' && 'Recebemos o seu contato e responderemos em breve.'}
          {status.channel === 'whatsapp' && 'Abrimos o WhatsApp com a sua mensagem pronta. É só tocar em enviar.'}
          {status.channel === 'email' && 'Abrimos o seu aplicativo de e-mail com a mensagem pronta. É só enviar.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {status.channel === 'whatsapp' && (
            <a href={whatsappLink(formatContactMessage(form))} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-soft underline-offset-4 hover:underline">
              O WhatsApp não abriu? Clique aqui
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={() => setStatus({ kind: 'idle' })}>
            Voltar ao formulário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Solicitar orçamento">
      {/* Campo invisível contra spam */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {label('name', 'Nome')}
          <input {...field('name')} type="text" autoComplete="name" required className={fieldClass} placeholder="Seu nome" />
          {errorText('name')}
        </div>
        <div>
          {label('company', 'Empresa', true)}
          <input {...field('company')} type="text" autoComplete="organization" className={fieldClass} placeholder="Nome da empresa" />
        </div>
        <div>
          {label('email', 'E-mail')}
          <input {...field('email')} type="email" autoComplete="email" inputMode="email" required className={fieldClass} placeholder="voce@empresa.com.br" />
          {errorText('email')}
        </div>
        <div>
          {label('whatsapp', 'WhatsApp', true)}
          <input {...field('whatsapp')} type="tel" autoComplete="tel" inputMode="tel" className={fieldClass} placeholder="(11) 90000-0000" />
          {errorText('whatsapp')}
        </div>
        <div>
          {label('projectType', 'Tipo de projeto')}
          <select {...field('projectType')} required className={cn(fieldClass, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20fill=%27none%27%20stroke=%27%239da9bc%27%20stroke-width=%271.6%27%3E%3Cpath%20d=%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10', !form.projectType && 'text-subtle')}>
            <option value="" disabled>
              Selecione
            </option>
            {projectTypes.map((type) => (
              <option key={type} value={type} className="bg-elevated text-fg">
                {type}
              </option>
            ))}
          </select>
          {errorText('projectType')}
        </div>
        <div>
          {label('budget', 'Orçamento estimado', true)}
          <select {...field('budget')} className={cn(fieldClass, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20fill=%27none%27%20stroke=%27%239da9bc%27%20stroke-width=%271.6%27%3E%3Cpath%20d=%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10', !form.budget && 'text-subtle')}>
            <option value="">Selecione</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range} className="bg-elevated text-fg">
                {range}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          {label('message', 'Mensagem')}
          <textarea {...field('message')} rows={5} required className={cn(fieldClass, 'resize-y')} placeholder="Conte um pouco sobre a sua empresa e o que você precisa." />
          {errorText('message')}
        </div>
      </div>

      {status.kind === 'error' && (
        <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">
          {status.message}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status.kind === 'sending'} className="w-full sm:w-auto">
          {hasEndpoint ? (
            <>
              {status.kind === 'sending' ? 'Enviando…' : 'Solicitar orçamento'}
              <Icon name="send" size={16} />
            </>
          ) : (
            <>
              <BrandIcon name="whatsapp" size={17} />
              Solicitar orçamento
            </>
          )}
        </Button>
        <Button variant="secondary" size="lg" onClick={sendByEmail} className="w-full sm:w-auto">
          <Icon name="mail" size={16} />
          Enviar por e-mail
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-subtle">
        {hasEndpoint
          ? 'Seus dados são usados apenas para responder a este contato.'
          : 'Ao solicitar, abrimos o WhatsApp com a sua mensagem pronta para envio. Seus dados são usados apenas para responder a este contato.'}
      </p>
    </form>
  );
}
