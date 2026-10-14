import type { IconName } from '@/components/icons/Icon';
import { serviceIds, type IndustryId, type ServiceId } from '@/lib/i18n/routes';

/**
 * Dados que não dependem do idioma (ícones, numeração, tecnologias).
 * Os textos de cada solução e segmento ficam em `content/<idioma>/`.
 */
export const serviceMeta: Record<ServiceId, { icon: IconName; number: string; technologies: string[] }> = {
  web: { icon: 'globe', number: '01', technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Google Analytics'] },
  software: { icon: 'layers', number: '02', technologies: ['TypeScript', 'Node.js', 'NestJS', 'Python', 'PostgreSQL', 'Prisma', 'Docker'] },
  saas: { icon: 'cloud', number: '03', technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Stripe', 'Azure'] },
  ai: { icon: 'sparkles', number: '04', technologies: ['Claude (Anthropic)', 'OpenAI', 'Python', 'Node.js', 'WhatsApp Cloud API'] },
  automation: { icon: 'workflow', number: '05', technologies: ['Node.js', 'Python', 'BullMQ', 'Redis', 'Webhooks', 'APIs REST'] },
  ecommerce: { icon: 'cart', number: '06', technologies: ['Shopify', 'Next.js', 'Stripe', 'APIs REST'] },
  cloud: { icon: 'server', number: '07', technologies: ['Azure', 'AWS', 'Docker', 'GitHub Actions', 'PostgreSQL', 'Redis'] },
};

export const industryMeta: Record<IndustryId, { icon: IconName }> = {
  hospitality: { icon: 'bed' },
  solar: { icon: 'sun' },
  veterinary: { icon: 'paw' },
  legal: { icon: 'scale' },
  construction: { icon: 'building' },
};

/** Ícones dos valores da empresa, na mesma ordem de `about.values`. */
export const valueIcons: IconName[] = ['cpu', 'sparkles', 'gauge', 'shield', 'trending', 'cursor', 'target'];

export const serviceCount = serviceIds.length;
