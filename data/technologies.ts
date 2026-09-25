import type { TechIconKey } from '@/components/icons/tech-icons';

export type Technology = { name: string; icon?: TechIconKey };

export type TechGroup = {
  title: string;
  description: string;
  items: Technology[];
};

/**
 * Stack exibida na seção "Tecnologias que utilizamos".
 * Todas aparecem em projetos do portfólio ou fazem parte da atuação da HR Tech.
 * `icon` é opcional: sem ele, o item mostra um monograma neutro.
 */
export const techGroups: TechGroup[] = [
  {
    title: 'Frontend',
    description: 'Interfaces rápidas, acessíveis e responsivas.',
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
    title: 'Backend',
    description: 'APIs e regras de negócio bem organizadas.',
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
    title: 'Cloud',
    description: 'Infraestrutura na nuvem para aplicações web.',
    items: [
      { name: 'Microsoft Azure' },
      { name: 'AWS' },
      { name: 'Docker', icon: 'docker' },
      { name: 'GitHub Pages', icon: 'github' },
    ],
  },
  {
    title: 'Database',
    description: 'Dados consistentes, seguros e performáticos.',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'SQL' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Redis', icon: 'redis' },
    ],
  },
  {
    title: 'DevOps',
    description: 'Versionamento, testes e deploy automatizado.',
    items: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'GitHub Actions', icon: 'githubactions' },
      { name: 'Vitest', icon: 'vitest' },
    ],
  },
  {
    title: 'Artificial Intelligence',
    description: 'Modelos de linguagem aplicados ao negócio.',
    items: [
      { name: 'Claude (Anthropic)', icon: 'anthropic' },
      { name: 'OpenAI' },
      { name: 'Agentes de IA' },
      { name: 'Chatbots' },
    ],
  },
  {
    title: 'Automação',
    description: 'Rotinas que trabalham sozinhas, com monitoramento.',
    items: [
      { name: 'BullMQ' },
      { name: 'Rotinas agendadas' },
      { name: 'Webhooks' },
      { name: 'Filas e novas tentativas' },
    ],
  },
  {
    title: 'Integrações',
    description: 'Conexão com as ferramentas que o negócio já usa.',
    items: [
      { name: 'WhatsApp Cloud API', icon: 'whatsapp' },
      { name: 'Stripe', icon: 'stripe' },
      { name: 'Google Analytics', icon: 'googleanalytics' },
      { name: 'Shopify', icon: 'shopify' },
      { name: 'Resend', icon: 'resend' },
    ],
  },
];
