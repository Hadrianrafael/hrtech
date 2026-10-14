import type { ContactCountry, ContactFormText, ServiceTypeId } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

export type ContactPayload = {
  name: string;
  company: string;
  country: ContactCountry | '';
  email: string;
  phone: string;
  serviceType: ServiceTypeId | '';
  budget: string;
  language: Locale | '';
  message: string;
};

export type ContactErrors = Partial<Record<keyof ContactFormText['errors'], true>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emptyContact(language: Locale): ContactPayload {
  return { name: '', company: '', country: '', email: '', phone: '', serviceType: '', budget: '', language, message: '' };
}

/** Telefone é opcional; quando informado, aceita de 8 a 15 dígitos (limite do padrão E.164). */
export function validateContact(data: ContactPayload): ContactErrors {
  const errors: ContactErrors = {};
  if (data.name.trim().length < 2) errors.name = true;
  if (!EMAIL_RE.test(data.email.trim())) errors.email = true;
  const phoneDigits = data.phone.replace(/\D/g, '');
  if (data.phone.trim() && (phoneDigits.length < 8 || phoneDigits.length > 15)) errors.phone = true;
  if (!data.country) errors.country = true;
  if (!data.serviceType) errors.serviceType = true;
  if (!data.language) errors.language = true;
  if (data.message.trim().length < 10) errors.message = true;
  return errors;
}

/**
 * Texto enviado por WhatsApp ou e-mail. Os rótulos seguem o idioma do visitante;
 * a linha "Idioma de atendimento" deixa claro em que idioma responder.
 */
export function formatContactMessage(data: ContactPayload, text: ContactFormText): string {
  const optional = (label: string, value: string) => (value.trim() ? [`${label}: ${value.trim()}`] : []);
  const country = data.country ? text.countries[data.country] : '';
  const service = data.serviceType ? text.serviceTypes[data.serviceType] : '';
  const language = data.language ? text.languages[data.language] : '';
  return [
    text.message.greeting,
    '',
    `${text.labels.name}: ${data.name.trim()}`,
    ...optional(text.labels.company, data.company),
    `${text.labels.country}: ${country}`,
    `${text.labels.email}: ${data.email.trim()}`,
    ...optional(text.labels.phone, data.phone),
    `${text.labels.serviceType}: ${service}`,
    ...optional(text.labels.budget, data.budget),
    `${text.labels.language}: ${language}`,
    '',
    `${text.message.heading}:`,
    data.message.trim(),
  ].join('\n');
}
