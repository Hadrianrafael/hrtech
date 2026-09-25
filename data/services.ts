import type { IconName } from '@/components/icons/Icon';

export type Service = {
  slug: string;
  number: string;
  title: string;
  /** Frase curta usada no card da Home. */
  summary: string;
  /** Parágrafo de abertura da página de detalhes. */
  intro: string;
  icon: IconName;
  capabilities: string[];
  /** Como o trabalho é entregue — aparece na página de detalhes. */
  approach: { title: string; text: string }[];
  technologies: string[];
};

export const services: Service[] = [
  {
    slug: 'sites',
    number: '01',
    title: 'Sites',
    summary:
      'Sites institucionais, landing pages e sites premium rápidos, bem posicionados no Google e preparados para gerar contato.',
    intro:
      'Um site é, muitas vezes, o primeiro contato do cliente com a sua empresa. Desenvolvemos sites sob medida — sem templates prontos — pensados para carregar rápido, funcionar bem no celular e transformar visitas em conversas.',
    icon: 'globe',
    capabilities: [
      'Sites institucionais',
      'Landing pages de campanha',
      'Sites premium com animações',
      'Layout 100% responsivo',
      'Sites multilíngues',
      'SEO técnico e estrutura para o Google',
      'Google Analytics e Search Console',
      'Formulários e integração com WhatsApp',
      'Reservas e agendamentos online',
      'Integrações com outros sistemas',
    ],
    approach: [
      { title: 'Design próprio', text: 'Layout criado para a sua marca e o seu público, não adaptado de um tema genérico.' },
      { title: 'Performance', text: 'Código enxuto, imagens otimizadas e carregamento sob demanda para pontuar alto no Lighthouse.' },
      { title: 'Pronto para crescer', text: 'Conteúdo organizado para facilitar novas páginas, idiomas e integrações.' },
    ],
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Google Analytics'],
  },
  {
    slug: 'sistemas',
    number: '02',
    title: 'Sistemas',
    summary:
      'Sistemas web sob medida, painéis administrativos e portais que organizam a operação e eliminam planilhas.',
    intro:
      'Quando a planilha já não dá conta, é hora de ter um sistema. Construímos aplicações web sob medida para o processo real da sua empresa — do cadastro ao relatório — com controle de acesso, dados seguros e interface simples para a equipe.',
    icon: 'layers',
    capabilities: [
      'Sistemas web personalizados',
      'Dashboards e relatórios',
      'Painéis administrativos',
      'Sistemas internos e ERPs sob medida',
      'Portais para clientes e parceiros',
      'APIs REST',
      'Integrações entre sistemas',
      'Modelagem e bancos de dados',
      'Controle de acesso por perfil',
    ],
    approach: [
      { title: 'Processo antes do código', text: 'Mapeamos como a operação funciona hoje antes de definir telas e regras.' },
      { title: 'Arquitetura sólida', text: 'Regras de negócio separadas da interface, testes automatizados e código documentado.' },
      { title: 'Entregas incrementais', text: 'Você acompanha e valida o sistema em etapas, não só no final.' },
    ],
    technologies: ['TypeScript', 'Node.js', 'NestJS', 'Python', 'PostgreSQL', 'Prisma', 'Docker'],
  },
  {
    slug: 'saas',
    number: '03',
    title: 'SaaS',
    summary:
      'Plataformas SaaS multiempresa com assinaturas, pagamentos recorrentes e arquitetura pronta para escalar.',
    intro:
      'Transformar uma ideia em produto digital exige mais do que telas: é preciso cadastro de empresas, planos, cobrança recorrente, permissões e uma base que aguente o crescimento. Desenvolvemos plataformas SaaS completas, do MVP à operação.',
    icon: 'cloud',
    capabilities: [
      'Arquitetura multi-tenant',
      'Planos, assinaturas e cobrança recorrente',
      'Pagamentos com Stripe',
      'Painel do cliente e painel administrativo',
      'Permissões por perfil (RBAC)',
      'Notificações por e-mail e WhatsApp',
      'Internacionalização',
      'Onboarding e página pública',
    ],
    approach: [
      { title: 'MVP com foco', text: 'Começamos pelo que valida o produto, sem abrir mão de uma base técnica que aguente a evolução.' },
      { title: 'Isolamento de dados', text: 'Cada empresa enxerga apenas os próprios dados — por desenho, não por remendo.' },
      { title: 'Operação real', text: 'Filas, rotinas agendadas, webhooks e logs pensados para produção.' },
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Stripe', 'Azure'],
  },
  {
    slug: 'inteligencia-artificial',
    number: '04',
    title: 'Inteligência Artificial',
    summary:
      'Chatbots, agentes de IA e atendimento automatizado no WhatsApp, integrados aos dados e sistemas da empresa.',
    intro:
      'IA útil é IA conectada ao seu negócio. Desenvolvemos assistentes e agentes que respondem clientes, consultam informações, agendam horários e executam tarefas — com limites claros do que podem fazer e passagem para um humano quando necessário.',
    icon: 'sparkles',
    capabilities: [
      'Chatbots para site e WhatsApp',
      'Atendimento com IA',
      'Agentes de IA com ferramentas',
      'Integração de IA em sistemas existentes',
      'WhatsApp + IA',
      'Classificação e extração de documentos',
      'Automação de processos com IA',
    ],
    approach: [
      { title: 'Escopo controlado', text: 'O agente só acessa o que precisa e cada ação fica registrada.' },
      { title: 'Humano no circuito', text: 'Quando a IA não deve responder, a conversa vai para a equipe.' },
      { title: 'Modelos de ponta', text: 'Trabalhamos com as APIs dos principais provedores de modelos de linguagem.' },
    ],
    technologies: ['Claude (Anthropic)', 'OpenAI', 'Python', 'Node.js', 'WhatsApp Cloud API'],
  },
  {
    slug: 'automacoes',
    number: '05',
    title: 'Automações',
    summary:
      'Rotinas automáticas que integram ferramentas, disparam mensagens e acabam com tarefas manuais repetitivas.',
    intro:
      'Boa parte do tempo da equipe vai para copiar dados, enviar lembretes e conferir planilhas. Automatizamos essas rotinas integrando os sistemas que você já usa — com monitoramento e tratamento de falhas.',
    icon: 'workflow',
    capabilities: [
      'Integração entre sistemas e APIs',
      'Lembretes e notificações automáticas',
      'Mensagens por WhatsApp e e-mail',
      'Rotinas agendadas',
      'Processamento de planilhas e arquivos',
      'Webhooks',
      'Relatórios automáticos',
    ],
    approach: [
      { title: 'Mapear o gargalo', text: 'Identificamos as tarefas que mais consomem tempo e têm maior risco de erro.' },
      { title: 'Automação confiável', text: 'Filas, novas tentativas automáticas e alertas quando algo falha.' },
      { title: 'Medir o ganho', text: 'Cada automação tem um objetivo claro e verificável.' },
    ],
    technologies: ['Node.js', 'Python', 'BullMQ', 'Redis', 'Webhooks', 'APIs REST'],
  },
  {
    slug: 'e-commerce',
    number: '06',
    title: 'E-commerce',
    summary:
      'Lojas virtuais com pagamentos, integrações e experiência de compra pensada para o celular.',
    intro:
      'Vender online exige uma loja rápida, confiável e fácil de administrar. Configuramos lojas em plataformas consolidadas como a Shopify ou desenvolvemos soluções personalizadas quando o negócio pede regras próprias.',
    icon: 'cart',
    capabilities: [
      'Lojas virtuais',
      'Shopify',
      'Soluções de e-commerce personalizadas',
      'Integração com meios de pagamento',
      'Controle de estoque',
      'Integrações com ERPs e marketplaces',
      'Checkout otimizado para mobile',
    ],
    approach: [
      { title: 'Plataforma certa', text: 'Indicamos Shopify quando resolve, e desenvolvimento próprio quando é necessário.' },
      { title: 'Conversão', text: 'Páginas de produto e checkout pensados para reduzir abandono.' },
      { title: 'Operação integrada', text: 'Estoque, pedidos e pagamentos conversando entre si.' },
    ],
    technologies: ['Shopify', 'Next.js', 'Stripe', 'APIs REST'],
  },
  {
    slug: 'cloud-infraestrutura',
    number: '07',
    title: 'Cloud & Infraestrutura',
    summary:
      'Deploy, servidores, bancos de dados e infraestrutura em Microsoft Azure e AWS para aplicações web.',
    intro:
      'Um bom software precisa de uma boa casa. Estruturamos a infraestrutura das aplicações na nuvem — containers, bancos gerenciados, filas, armazenamento e pipelines de deploy — com atenção a custo, segurança e disponibilidade.',
    icon: 'server',
    capabilities: [
      'Microsoft Azure',
      'AWS',
      'Deploy contínuo (CI/CD)',
      'Containers com Docker',
      'Bancos de dados gerenciados',
      'Configuração de servidores e domínios',
      'Gestão de segredos e credenciais',
      'Monitoramento e logs',
    ],
    approach: [
      { title: 'Infra como código', text: 'Ambientes reproduzíveis, documentados e versionados.' },
      { title: 'Custo sob controle', text: 'Dimensionamento adequado ao momento do projeto.' },
      { title: 'Segurança', text: 'Credenciais em cofres, acessos mínimos e HTTPS em tudo.' },
    ],
    technologies: ['Azure', 'AWS', 'Docker', 'GitHub Actions', 'PostgreSQL', 'Redis'],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
