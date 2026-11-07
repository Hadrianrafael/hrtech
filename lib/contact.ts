import type { Locale } from './i18n';

export const projectTypes = [
  'Site',
  'Sistema',
  'SaaS',
  'Automação',
  'Inteligência Artificial',
  'E-commerce',
  'Outro',
] as const;

export const budgetRanges = [
  'Ainda não sei',
  'Até R$ 5 mil',
  'R$ 5 mil a R$ 15 mil',
  'R$ 15 mil a R$ 50 mil',
  'Acima de R$ 50 mil',
] as const;

export const projectTypeLabels: Record<Locale, readonly string[]> = {
  'en-US': ['Website', 'Business system', 'SaaS', 'Automation', 'Artificial Intelligence', 'E-commerce', 'Other'],
  'pt-BR': projectTypes,
  es: ['Sitio web', 'Sistema empresarial', 'SaaS', 'Automatización', 'Inteligencia Artificial', 'Comercio electrónico', 'Otro'],
};

export const budgetRangeLabels: Record<Locale, readonly string[]> = {
  'en-US': ['Not sure yet', 'Up to R$5,000', 'R$5,000 to R$15,000', 'R$15,000 to R$50,000', 'Over R$50,000'],
  'pt-BR': budgetRanges,
  es: ['Aún no lo sé', 'Hasta R$5.000', 'De R$5.000 a R$15.000', 'De R$15.000 a R$50.000', 'Más de R$50.000'],
};

function localizeChoice(value: string, originals: readonly string[], translations: readonly string[]): string {
  const index = originals.findIndex((item) => item === value);
  return index < 0 ? value : translations[index] ?? value;
}

export type ContactPayload = {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  projectType: string;
  budget: string;
  message: string;
};

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(data: ContactPayload, locale: Locale = 'pt-BR'): ContactErrors {
  const copy = {
    'en-US': ['Enter your name.', 'Enter a valid email address.', 'Enter a WhatsApp number with area code.', 'Select a project type.', 'Tell us a little more about your project.'],
    'pt-BR': ['Informe seu nome.', 'Informe um e-mail válido.', 'Informe um WhatsApp com DDD.', 'Selecione o tipo de projeto.', 'Conte um pouco mais sobre o projeto.'],
    es: ['Ingrese su nombre.', 'Ingrese un correo válido.', 'Ingrese un número de WhatsApp con código de área.', 'Seleccione un tipo de proyecto.', 'Cuéntenos un poco más sobre el proyecto.'],
  }[locale];
  const errors: ContactErrors = {};
  if (data.name.trim().length < 2) errors.name = copy[0];
  if (!EMAIL_RE.test(data.email.trim())) errors.email = copy[1];
  const phoneDigits = data.whatsapp.replace(/\D/g, '');
  if (data.whatsapp.trim() && (phoneDigits.length < 10 || phoneDigits.length > 13)) {
    errors.whatsapp = copy[2];
  }
  if (!data.projectType) errors.projectType = copy[3];
  if (data.message.trim().length < 10) errors.message = copy[4];
  return errors;
}

/** Texto usado quando o contato é enviado por WhatsApp ou e-mail. */
export function formatContactMessage(data: ContactPayload, locale: Locale = 'pt-BR'): string {
  const copy = {
    'en-US': ['Hello, HR Tech! I would like to request a quote.', 'Name', 'Company', 'Email', 'Project type', 'Estimated budget', 'Message'],
    'pt-BR': ['Olá, HR Tech! Gostaria de solicitar um orçamento.', 'Nome', 'Empresa', 'E-mail', 'Tipo de projeto', 'Orçamento estimado', 'Mensagem'],
    es: ['¡Hola, HR Tech! Me gustaría solicitar un presupuesto.', 'Nombre', 'Empresa', 'Correo electrónico', 'Tipo de proyecto', 'Presupuesto estimado', 'Mensaje'],
  }[locale];
  const optional = (label: string, value: string) => (value.trim() ? [`${label}: ${value.trim()}`] : []);
  return [
    copy[0],
    '',
    `${copy[1]}: ${data.name.trim()}`,
    ...optional(copy[2]!, data.company),
    `${copy[3]}: ${data.email.trim()}`,
    ...optional('WhatsApp', data.whatsapp),
    `${copy[4]}: ${localizeChoice(data.projectType, projectTypes, projectTypeLabels[locale])}`,
    ...optional(copy[5]!, localizeChoice(data.budget, budgetRanges, budgetRangeLabels[locale])),
    '',
    `${copy[6]}:`,
    data.message.trim(),
  ].join('\n');
}
