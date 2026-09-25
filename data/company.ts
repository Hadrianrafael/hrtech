import type { IconName } from '@/components/icons/Icon';

export type CompanyValue = { title: string; text: string; icon: IconName };

export const companyValues: CompanyValue[] = [
  { title: 'Tecnologia', text: 'Ferramentas modernas escolhidas pelo que resolvem, não pela moda.', icon: 'cpu' },
  { title: 'Inovação', text: 'IA e automação aplicadas onde geram ganho real para a operação.', icon: 'sparkles' },
  { title: 'Performance', text: 'Sistemas e sites rápidos, pensados para carregar bem até no 4G.', icon: 'gauge' },
  { title: 'Segurança', text: 'Controle de acesso, dados protegidos e boas práticas desde o início.', icon: 'shield' },
  { title: 'Escalabilidade', text: 'Arquitetura preparada para crescer junto com o negócio.', icon: 'trending' },
  { title: 'Experiência do usuário', text: 'Interfaces claras, que a equipe e os clientes entendem de primeira.', icon: 'cursor' },
  { title: 'Resultados', text: 'Cada projeto começa com um objetivo de negócio claro.', icon: 'target' },
];

export const founder = {
  name: 'Hadrian Rafael Silva de Oliveira',
  shortName: 'Hadrian Rafael',
  role: 'Fundador & Desenvolvedor — HR Tech Sistemas',
  photo: '/images/founder.webp',
  bio: [
    'Hadrian é desenvolvedor de software e fundou a HR Tech para levar às empresas o mesmo cuidado técnico que se espera de produtos digitais de grande porte: arquitetura bem pensada, código testado e infraestrutura confiável.',
    'Atua de ponta a ponta — do levantamento de requisitos ao deploy na nuvem — em sites, sistemas web, plataformas SaaS, automações e soluções com Inteligência Artificial.',
  ],
  areas: [
    'Engenharia de Software',
    'Desenvolvimento Web',
    'Sistemas e SaaS',
    'Infraestrutura & Cloud',
    'Automações',
    'Inteligência Artificial',
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'APIs', 'PostgreSQL', 'SQL', 'Git', 'GitHub', 'Azure', 'AWS', 'Automações', 'IA'],
};
