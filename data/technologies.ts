import type { TechIconKey } from '@/components/icons/tech-icons';

export type Technology = { name: string; icon?: TechIconKey };

export type TechGroup = {
  /** Identificador estável; o título e a descrição vêm de `dictionary.stack.groups` (mesma ordem). */
  id: string;
  items: Technology[];
};

/**
 * Stack exibida na seção de tecnologias (nomes de produtos; os textos do grupo são localizados).
 * Todas aparecem em projetos do portfólio ou fazem parte da atuação da HR Tech.
 * `icon` é opcional: sem ele, o item mostra um monograma neutro.
 */
export const techGroups: TechGroup[] = [
  {
    id: 'frontend',
    items: [
      { name: 'Next.js', icon: 'nextjs' },
      { name: 'React', icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'Tailwind CSS', icon: 'tailwind' },
      { name: 'Vite', icon: 'vite' },
    ],
  },
  {
    id: 'backend',
    items: [
      { name: 'Node.js', icon: 'node' },
      { name: 'NestJS', icon: 'nestjs' },
      { name: 'Python', icon: 'python' },
      { name: 'FastAPI', icon: 'fastapi' },
      { name: 'Prisma', icon: 'prisma' },
      { name: 'APIs REST' },
    ],
  },
  {
    id: 'cloud',
    items: [
      { name: 'Microsoft Azure' },
      { name: 'AWS' },
      { name: 'Docker', icon: 'docker' },
      { name: 'GitHub Pages', icon: 'github' },
    ],
  },
  {
    id: 'database',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'SQL' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Redis', icon: 'redis' },
    ],
  },
  {
    id: 'devops',
    items: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'GitHub Actions', icon: 'githubactions' },
      { name: 'Vitest', icon: 'vitest' },
    ],
  },
  {
    id: 'ai',
    items: [
      { name: 'Claude (Anthropic)', icon: 'anthropic' },
      { name: 'OpenAI' },
      { name: 'Agentes de IA' },
      { name: 'Chatbots' },
    ],
  },
  {
    id: 'automation',
    items: [
      { name: 'BullMQ' },
      { name: 'Rotinas agendadas' },
      { name: 'Webhooks' },
      { name: 'Filas e novas tentativas' },
    ],
  },
  {
    id: 'integrations',
    items: [
      { name: 'WhatsApp Cloud API', icon: 'whatsapp' },
      { name: 'Stripe', icon: 'stripe' },
      { name: 'Google Analytics', icon: 'googleanalytics' },
      { name: 'Shopify', icon: 'shopify' },
      { name: 'Resend', icon: 'resend' },
    ],
  },
];
