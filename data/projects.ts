/**
 * Portfólio da HR Tech.
 *
 * Para cadastrar um novo projeto, copie um dos objetos abaixo, altere o `slug`
 * (vira a URL /projetos/<slug>) e preencha os campos. As imagens ficam em
 * public/projects/<slug>/. Veja o passo a passo completo no README.
 *
 * Regra do portfólio: nada de clientes, números ou resultados inventados.
 * Tudo que ainda não foi confirmado fica como `null` e aparece no site como
 * "a confirmar" — basta preencher quando a informação existir.
 */

export const projectCategories = [
  'SITE',
  'SISTEMA',
  'SAAS',
  'E-COMMERCE',
  'AUTOMAÇÃO',
  'INTELIGÊNCIA ARTIFICIAL',
] as const;

export type ProjectCategory = (typeof projectCategories)[number];

export type ProjectStatus = 'Publicado' | 'Protótipo' | 'Em desenvolvimento';

export type ProjectImage = {
  src: string;
  alt: string;
  /** 'desktop' é exibido em moldura de navegador; 'mobile', em moldura de celular. */
  frame: 'desktop' | 'mobile';
};

export type Project = {
  slug: string;
  name: string;
  /** Linha curta exibida abaixo do nome. */
  tagline: string;
  categories: ProjectCategory[];
  status: ProjectStatus;
  /** Nome do cliente. `null` = ainda não confirmado/autorizado para divulgação. */
  client: string | null;
  segment: string;
  year: string | null;
  summary: string;
  challenge: string;
  solution: string;
  features: string[];
  technologies: string[];
  /** Resultado mensurável. `null` até existir um dado real para mostrar. */
  result: string | null;
  cover: ProjectImage | null;
  gallery: ProjectImage[];
  links: {
    live?: string;
    repository?: string;
  };
  /** Nota exibida no case (ex.: "protótipo não oficial"). */
  notice?: string;
  featured: boolean;
};

const shots = (slug: string, name: string): { cover: ProjectImage; gallery: ProjectImage[] } => ({
  cover: { src: `/projects/${slug}/desktop-1.webp`, alt: `Página inicial do site ${name}`, frame: 'desktop' },
  gallery: [
    { src: `/projects/${slug}/desktop-2.webp`, alt: `Seção interna do site ${name}`, frame: 'desktop' },
    { src: `/projects/${slug}/desktop-3.webp`, alt: `Outra seção do site ${name}`, frame: 'desktop' },
    { src: `/projects/${slug}/mobile-1.webp`, alt: `Site ${name} no celular`, frame: 'mobile' },
  ],
});

export const projects: Project[] = [
  {
    slug: 'barber-saas',
    name: 'Barber SaaS',
    tagline: 'Plataforma SaaS completa para gestão de barbearias',
    categories: ['SAAS', 'SISTEMA', 'INTELIGÊNCIA ARTIFICIAL', 'AUTOMAÇÃO'],
    status: 'Em desenvolvimento',
    client: 'Produto próprio da HR Tech',
    segment: 'Beleza e serviços',
    year: '2026',
    summary:
      'Plataforma multiempresa para barbearias com agenda, CRM, pagamentos, assinaturas, mensagens automáticas e um chatbot com IA que agenda horários sozinho.',
    challenge:
      'Barbearias costumam dividir a operação entre agenda de papel, WhatsApp pessoal e planilhas. Faltava uma plataforma única que cuidasse de agendamento, clientes, cobrança e comunicação — e que pudesse ser vendida para muitas barbearias ao mesmo tempo, com os dados de cada uma totalmente isolados.',
    solution:
      'Uma plataforma SaaS multi-tenant em Next.js e PostgreSQL. O domínio de agendamento é único e reutilizado pelo painel, pela página pública de reservas e pelo chatbot, o que evita regras duplicadas. Conflitos de horário são bloqueados em três camadas, incluindo uma restrição no próprio banco de dados. Pagamentos usam Stripe e Stripe Connect, e as mensagens saem por e-mail e pela API oficial do WhatsApp, sempre respeitando o consentimento do cliente.',
    features: [
      'Agenda por barbeiro com dia, semana e mês',
      'Página pública de agendamento em português, inglês e espanhol',
      'CRM com histórico, segmentação e importação por CSV',
      'Assinaturas da plataforma e pagamentos dos clientes via Stripe',
      'Lembretes automáticos por WhatsApp e e-mail',
      'Chatbot com IA que consulta horários e agenda atendimentos',
      'Programa de fidelidade, cupons e avaliações',
      'Relatórios financeiros com exportação CSV',
      'Painel de super administrador da plataforma',
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Stripe', 'Tailwind CSS', 'Claude (Anthropic)', 'WhatsApp Cloud API', 'Azure'],
    result:
      'Versão 1 concluída em código, com 186 testes automatizados, e preparada para a configuração do ambiente de produção no Microsoft Azure.',
    cover: null,
    gallery: [],
    links: {},
    notice: 'Capturas de tela reais do sistema serão adicionadas após a publicação.',
    featured: true,
  },
  {
    slug: 'willa-hala',
    name: 'Willa Hala',
    tagline: 'Site boutique para hospedagem em Vinhedo (SP)',
    categories: ['SITE'],
    status: 'Protótipo',
    client: null,
    segment: 'Hotelaria',
    year: '2026',
    summary:
      'Protótipo de site boutique para uma hospedagem, com animações cinematográficas, galeria com lightbox e caminhos diretos para reserva.',
    challenge:
      'Apresentar uma hospedagem familiar com personalidade própria, fugindo da cara de página de reservas, e ao mesmo tempo levar o visitante rapidamente até os canais de reserva.',
    solution:
      'Site estático em Next.js com animações em GSAP (revelações, parallax e trilho horizontal), cards de acomodação, galeria com lightbox acessível e mapa carregado sob demanda. Todo o conteúdo fica em um único arquivo de dados, e as fotos definitivas podem ser trocadas sem alterar código.',
    features: [
      'Hero cinematográfico com animações em GSAP',
      'Cards de acomodações e comodidades',
      'Galeria com lightbox navegável pelo teclado',
      'Mapa do Google carregado só sob demanda',
      'Links diretos para os canais de reserva e WhatsApp',
      'Respeita prefers-reduced-motion',
    ],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'GSAP', 'GitHub Pages'],
    result: null,
    ...shots('willa-hala', 'Willa Hala'),
    links: { live: 'https://hadrianrafael.github.io/willa-hala-demo/' },
    notice: 'Protótipo comercial de demonstração. Não é o site oficial da hospedagem.',
    featured: true,
  },
  {
    slug: 'dra-bia-cecily',
    name: 'Dra. Bia Cecily',
    tagline: 'Site para cirurgiã-dentista especializada em estética',
    categories: ['SITE'],
    status: 'Publicado',
    client: null,
    segment: 'Saúde',
    year: '2026',
    summary:
      'Site profissional para consultório odontológico, com apresentação dos tratamentos, galeria e agendamento direto pelo WhatsApp.',
    challenge:
      'Transmitir cuidado e confiança para quem procura tratamentos estéticos e transformar a visita ao site em uma conversa para agendar consulta.',
    solution:
      'Site de página única com identidade visual clara e acolhedora, cards para cada tratamento, chamadas para agendamento em pontos estratégicos e botão flutuante de WhatsApp.',
    features: [
      'Apresentação da profissional e dos tratamentos',
      'Cards de serviços com categorias',
      'Galeria de fotos',
      'Agendamento pelo WhatsApp',
      'Layout responsivo para celular',
      'Título e descrição otimizados para busca',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'Three.js'],
    result: null,
    ...shots('dra-bia-cecily', 'Dra. Bia Cecily'),
    links: { live: 'https://hadrianrafael.github.io/site-dra-biacecily/' },
    featured: true,
  },
  {
    slug: 'advocacia-premium',
    name: 'Advocacia Premium',
    tagline: 'Site institucional para escritório de advocacia',
    categories: ['SITE'],
    status: 'Publicado',
    client: null,
    segment: 'Jurídico',
    year: '2026',
    summary:
      'Site institucional com visual sóbrio e premium para advocacia, com áreas de atuação, diferenciais, processo de atendimento e contato imediato.',
    challenge:
      'Criar uma presença digital que passe seriedade e autoridade, explique as áreas de atuação sem juridiquês e facilite o primeiro contato.',
    solution:
      'Layout escuro com detalhes dourados, tipografia serifada e animações sutis em GSAP e Three.js. A estrutura conduz o visitante das áreas de atuação ao processo de atendimento e termina em uma chamada clara para o WhatsApp.',
    features: [
      'Hero com fundo animado em Three.js',
      'Áreas de atuação e diferenciais',
      'Linha do tempo do processo de atendimento',
      'Chamadas para consulta pelo WhatsApp',
      'Layout responsivo',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Three.js'],
    result: null,
    ...shots('advocacia-premium', 'Advocacia Premium'),
    links: { live: 'https://hadrianrafael.github.io/site-advogado/' },
    featured: false,
  },
  {
    slug: 'autoescola-onyx',
    name: 'Autoescola Onyx',
    tagline: 'Site para autoescola com várias unidades',
    categories: ['SITE'],
    status: 'Publicado',
    client: null,
    segment: 'Educação',
    year: '2026',
    summary:
      'Site para autoescola com categorias de habilitação, processo de matrícula, unidades e matrícula direta pelo WhatsApp.',
    challenge:
      'Organizar muitas informações — categorias, etapas, unidades — de um jeito fácil de entender no celular, que é por onde a maioria dos alunos chega.',
    solution:
      'Página com hierarquia forte, animações de entrada, blocos de serviços e unidades, e botões de WhatsApp sempre visíveis para acelerar a matrícula.',
    features: [
      'Categorias de habilitação e serviços',
      'Seção "Como funciona" com etapas',
      'Cards das unidades',
      'Matrícula pelo WhatsApp',
      'Animações com GSAP e Three.js',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Three.js'],
    result: null,
    ...shots('autoescola-onyx', 'Autoescola Onyx'),
    links: { live: 'https://hadrianrafael.github.io/autoescola-onyx/' },
    featured: false,
  },
  {
    slug: 'petshop-bruna-andrade',
    name: 'Bruna Andrade Petshop',
    tagline: 'Site para petshop com banho, tosa e vacinação',
    categories: ['SITE'],
    status: 'Publicado',
    client: null,
    segment: 'Serviços',
    year: '2026',
    summary:
      'Site leve e acolhedor para petshop, com serviços, campanhas e agendamento pelo WhatsApp.',
    challenge:
      'Mostrar o carinho com os animais e deixar claro quais serviços são oferecidos, com um caminho curto até o agendamento.',
    solution:
      'Aplicação React com Vite, animações em Framer Motion e Tailwind CSS, cards de serviços e chamadas para agendamento pelo WhatsApp em toda a página.',
    features: [
      'Cards de serviços',
      'Seção de campanhas',
      'Agendamento pelo WhatsApp',
      'Animações com Framer Motion',
      'Layout responsivo',
    ],
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'],
    result: null,
    ...shots('petshop-bruna-andrade', 'Bruna Andrade Petshop'),
    links: { live: 'https://hadrianrafael.github.io/Bruna-Andrade-/' },
    featured: false,
  },
  {
    slug: 'gestor-de-estoque',
    name: 'Gestor de Estoque',
    tagline: 'Sistema de controle de estoque para lojas',
    categories: ['SISTEMA'],
    status: 'Em desenvolvimento',
    client: null,
    segment: 'Comércio',
    year: '2026',
    summary:
      'Sistema web para controlar o estoque de perfumes e roupas em mais de uma loja, com alertas de reposição e painel com gráficos.',
    challenge:
      'Controlar o estoque de várias lojas em planilhas separadas dificulta saber o que está acabando e onde.',
    solution:
      'Painel em React com gráficos em Recharts consumindo uma API em FastAPI (Python) com MongoDB. Cada produto tem loja, categoria e limite mínimo; o sistema gera alertas automáticos de reposição.',
    features: [
      'Cadastro, edição e exclusão de produtos',
      'Estoque separado por loja',
      'Categorias de produtos',
      'Alertas automáticos de estoque baixo',
      'Painel com resumo e distribuição por categoria',
    ],
    technologies: ['React', 'Vite', 'Recharts', 'Python', 'FastAPI', 'MongoDB'],
    result: null,
    cover: null,
    gallery: [],
    links: {},
    notice: 'Capturas de tela do sistema serão adicionadas em breve.',
    featured: false,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);
