import { siteConfig } from '@/config/site';

/** Monta um link wa.me com mensagem pré-preenchida. */
export function whatsappLink(message: string = siteConfig.contact.whatsappMessage, number: string = siteConfig.contact.whatsappNumber): string {
  const digits = number.replace(/\D/g, '');
  const text = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function mailtoLink(subject: string, body = '', email: string = siteConfig.contact.email): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${email}${query ? `?${query}` : ''}`;
}
