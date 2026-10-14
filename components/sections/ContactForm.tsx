'use client';

import { useId, useState, type FormEvent } from 'react';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';
import { contactCountries, serviceTypeIds, type ContactFormText } from '@/content/types';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { emptyContact, formatContactMessage, validateContact, type ContactErrors, type ContactPayload } from '@/lib/contact';
import { locales, type Locale } from '@/lib/i18n/config';
import { pathFor } from '@/lib/i18n/routes';
import { mailtoLink, whatsappLink } from '@/lib/whatsapp';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; channel: 'endpoint' | 'whatsapp' | 'email' }
  | { kind: 'error' };

const fieldClass =
  'mt-2 block w-full rounded-xl border border-line/[0.12] bg-bg/60 px-4 py-3 text-[15px] text-fg placeholder:text-subtle/80 transition-[border-color,box-shadow] duration-200 focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-rose-400/60';

const selectClass = cn(
  fieldClass,
  'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20fill=%27none%27%20stroke=%27%239da9bc%27%20stroke-width=%271.6%27%3E%3Cpath%20d=%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10',
);

/**
 * Formulário comercial. Sem endpoint configurado (`siteConfig.contactFormEndpoint`), monta
 * a mensagem no idioma do visitante e abre o WhatsApp — ou o e-mail. Nenhum dado é enviado
 * a terceiros sem ação do visitante.
 */
export function ContactForm({ locale, text }: { locale: Locale; text: ContactFormText }) {
  const formId = useId();
  const [form, setForm] = useState<ContactPayload>(() => emptyContact(locale));
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const hasEndpoint = Boolean(siteConfig.contactFormEndpoint);
  const showBudget = text.budgetRanges.length > 0;

  const update = (field: keyof ContactPayload) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field as keyof ContactErrors]) setErrors((current) => ({ ...current, [field]: undefined }));
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

  const leadParams = (method: string) => ({
    method,
    service_type: form.serviceType,
    country: form.country,
    service_language: form.language,
    page_language: locale,
  });

  const sendByEmail = () => {
    if (!validate()) return;
    window.location.href = mailtoLink(`${text.message.emailSubject} — ${text.serviceTypes[form.serviceType || 'other']} — ${form.name}`, formatContactMessage(form, text));
    track('generate_lead', leadParams('email'));
    setStatus({ kind: 'sent', channel: 'email' });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const honeypot = new FormData(event.currentTarget).get('website');
    if (honeypot) return;
    if (!validate()) return;

    if (!hasEndpoint) {
      window.open(whatsappLink(formatContactMessage(form, text)), '_blank', 'noopener,noreferrer');
      track('generate_lead', leadParams('whatsapp'));
      setStatus({ kind: 'sent', channel: 'whatsapp' });
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      const response = await fetch(siteConfig.contactFormEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, pageLanguage: locale, _subject: `${text.message.endpointSubject} — ${text.serviceTypes[form.serviceType || 'other']}` }),
      });
      if (!response.ok) throw new Error(String(response.status));
      track('generate_lead', leadParams('endpoint'));
      setStatus({ kind: 'sent', channel: 'endpoint' });
      setForm(emptyContact(locale));
    } catch {
      setStatus({ kind: 'error' });
    }
  };

  const field = (name: keyof ContactPayload) => {
    const failed = Boolean(errors[name as keyof ContactErrors]);
    return {
      id: `${formId}-${name}`,
      name,
      value: form[name],
      onChange: update(name),
      'aria-invalid': failed ? true : undefined,
      'aria-describedby': failed ? `${formId}-${name}-error` : undefined,
    };
  };

  const errorText = (name: keyof ContactErrors) =>
    errors[name] ? (
      <p id={`${formId}-${name}-error`} className="mt-1.5 text-xs text-rose-300">
        {text.errors[name]}
      </p>
    ) : null;

  const label = (name: keyof ContactPayload, content: string, optional = false) => (
    <label htmlFor={`${formId}-${name}`} className="text-sm font-medium text-fg/90">
      {content}
      {optional ? (
        <span className="ml-1 font-normal text-subtle">{text.optional}</span>
      ) : (
        <span className="ml-0.5 text-brand-soft" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );

  if (status.kind === 'sent') {
    const sent = text.sent;
    const title = status.channel === 'endpoint' ? sent.endpointTitle : status.channel === 'whatsapp' ? sent.whatsappTitle : sent.emailTitle;
    const body = status.channel === 'endpoint' ? sent.endpointText : status.channel === 'whatsapp' ? sent.whatsappText : sent.emailText;
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
          <Icon name="check" size={26} strokeWidth={2} />
        </span>
        <h3 className="mt-6 text-xl font-semibold text-fg">{title}</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {status.channel === 'whatsapp' && (
            <a href={whatsappLink(formatContactMessage(form, text))} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-soft underline-offset-4 hover:underline">
              {sent.whatsappRetry}
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={() => setStatus({ kind: 'idle' })}>
            {sent.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label={text.ariaLabel}>
      {/* Campo invisível contra spam */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          {text.honeypot}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {label('name', text.labels.name)}
          <input {...field('name')} type="text" autoComplete="name" required className={fieldClass} placeholder={text.placeholders.name} />
          {errorText('name')}
        </div>
        <div>
          {label('company', text.labels.company, true)}
          <input {...field('company')} type="text" autoComplete="organization" className={fieldClass} placeholder={text.placeholders.company} />
        </div>
        <div>
          {label('email', text.labels.email)}
          <input {...field('email')} type="email" autoComplete="email" inputMode="email" required className={fieldClass} placeholder={text.placeholders.email} />
          {errorText('email')}
        </div>
        <div>
          {label('phone', text.labels.phone, true)}
          <input {...field('phone')} type="tel" autoComplete="tel" inputMode="tel" className={fieldClass} placeholder={text.placeholders.phone} />
          {errorText('phone')}
        </div>
        <div>
          {label('country', text.labels.country)}
          <select {...field('country')} autoComplete="country" required className={cn(selectClass, !form.country && 'text-subtle')}>
            <option value="" disabled>
              {text.select}
            </option>
            {contactCountries.map((code) => (
              <option key={code} value={code} className="bg-elevated text-fg">
                {text.countries[code]}
              </option>
            ))}
          </select>
          {errorText('country')}
        </div>
        <div>
          {label('serviceType', text.labels.serviceType)}
          <select {...field('serviceType')} required className={cn(selectClass, !form.serviceType && 'text-subtle')}>
            <option value="" disabled>
              {text.select}
            </option>
            {serviceTypeIds.map((id) => (
              <option key={id} value={id} className="bg-elevated text-fg">
                {text.serviceTypes[id]}
              </option>
            ))}
          </select>
          {errorText('serviceType')}
        </div>
        <div className={showBudget ? undefined : 'sm:col-span-2'}>
          {label('language', text.labels.language)}
          <select {...field('language')} required className={selectClass}>
            {locales.map((code) => (
              <option key={code} value={code} className="bg-elevated text-fg">
                {text.languages[code]}
              </option>
            ))}
          </select>
          {errorText('language')}
        </div>
        {showBudget && (
          <div>
            {label('budget', text.labels.budget, true)}
            <select {...field('budget')} className={cn(selectClass, !form.budget && 'text-subtle')}>
              <option value="">{text.select}</option>
              {text.budgetRanges.map((range) => (
                <option key={range} value={range} className="bg-elevated text-fg">
                  {range}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          {label('message', text.labels.message)}
          <textarea {...field('message')} rows={5} required className={cn(fieldClass, 'resize-y')} placeholder={text.placeholders.message} />
          {errorText('message')}
        </div>
      </div>

      {status.kind === 'error' && (
        <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">
          {text.sendError}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status.kind === 'sending'} className="w-full sm:w-auto">
          {hasEndpoint ? (
            <>
              {status.kind === 'sending' ? text.sending : text.submit}
              <Icon name="send" size={16} />
            </>
          ) : (
            <>
              <BrandIcon name="whatsapp" size={17} />
              {text.submit}
            </>
          )}
        </Button>
        <Button variant="secondary" size="lg" onClick={sendByEmail} className="w-full sm:w-auto">
          <Icon name="mail" size={16} />
          {text.sendByEmail}
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-subtle">{hasEndpoint ? text.noteEndpoint : text.noteWhatsApp}{' '}
        <Link href={pathFor(locale, { key: 'privacy' })} className="underline underline-offset-2 hover:text-fg">
          {text.privacyLink}
        </Link>
      </p>
    </form>
  );
}
