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

export function validateContact(data: ContactPayload): ContactErrors {
  const errors: ContactErrors = {};
  if (data.name.trim().length < 2) errors.name = 'Informe seu nome.';
  if (!EMAIL_RE.test(data.email.trim())) errors.email = 'Informe um e-mail válido.';
  const phoneDigits = data.whatsapp.replace(/\D/g, '');
  if (data.whatsapp.trim() && (phoneDigits.length < 10 || phoneDigits.length > 13)) {
    errors.whatsapp = 'Informe um WhatsApp com DDD.';
  }
  if (!data.projectType) errors.projectType = 'Selecione o tipo de projeto.';
  if (data.message.trim().length < 10) errors.message = 'Conte um pouco mais sobre o projeto.';
  return errors;
}

/** Texto usado quando o contato é enviado por WhatsApp ou e-mail. */
export function formatContactMessage(data: ContactPayload): string {
  const optional = (label: string, value: string) => (value.trim() ? [`${label}: ${value.trim()}`] : []);
  return [
    'Olá, HR Tech! Gostaria de solicitar um orçamento.',
    '',
    `Nome: ${data.name.trim()}`,
    ...optional('Empresa', data.company),
    `E-mail: ${data.email.trim()}`,
    ...optional('WhatsApp', data.whatsapp),
    `Tipo de projeto: ${data.projectType}`,
    ...optional('Orçamento estimado', data.budget),
    '',
    'Mensagem:',
    data.message.trim(),
  ].join('\n');
}
