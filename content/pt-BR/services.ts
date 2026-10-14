import type { ServiceContent } from '../types';
import type { ServiceId } from '@/lib/i18n/routes';

export const services: Record<ServiceId, ServiceContent> = {
  web: {
    title: 'Sites',
    metaTitle: 'Desenvolvimento de sites profissionais para empresas',
    metaDescription:
      'Criação de sites institucionais, landing pages e sites multilíngues rápidos, responsivos e otimizados para o Google. Desenvolvimento e manutenção de sites para empresas.',
    heading: 'Desenvolvimento de sites profissionais',
    summary:
      'Sites institucionais, landing pages e sites premium rápidos, bem posicionados no Google e preparados para gerar contato.',
    intro:
      'Um site é, muitas vezes, o primeiro contato do cliente com a sua empresa. Desenvolvemos sites sob medida — sem templates prontos — pensados para carregar rápido, funcionar bem no celular e transformar visitas em conversas.',
    problems: [
      { title: 'Site lento ou desatualizado', text: 'Páginas que demoram a abrir e não funcionam bem no celular fazem o visitante desistir antes de entrar em contato.' },
      { title: 'Pouca visibilidade no Google', text: 'Sem estrutura técnica de SEO, o site não aparece quando o cliente pesquisa pelos serviços da empresa.' },
      { title: 'Visitas que não viram contato', text: 'Sem chamadas claras, formulário e WhatsApp à mão, o interesse do visitante se perde.' },
    ],
    capabilities: [
      'Sites institucionais',
      'Landing pages de campanha',
      'Sites para pequenas e médias empresas',
      'Sites premium com animações',
      'Layout 100% responsivo',
      'Sites multilíngues',
      'SEO técnico e estrutura para o Google',
      'Google Analytics e Search Console',
      'Formulários e integração com WhatsApp',
      'Reservas e agendamentos online',
      'Manutenção e evolução do site',
    ],
    approach: [
      { title: 'Design próprio', text: 'Layout criado para a sua marca e o seu público, não adaptado de um tema genérico.' },
      { title: 'Performance', text: 'Código enxuto, imagens otimizadas e carregamento sob demanda para pontuar alto no Lighthouse.' },
      { title: 'Pronto para crescer', text: 'Conteúdo organizado para facilitar novas páginas, idiomas e integrações.' },
    ],
    faq: [
      {
        question: 'Vocês criam sites para pequenas empresas?',
        answer:
          'Sim. Desenvolvemos desde landing pages e sites institucionais enxutos até sites maiores, com várias páginas e integrações, sempre dimensionados para o objetivo e o momento da empresa.',
      },
      {
        question: 'O site pode ter mais de um idioma?',
        answer:
          'Sim. Estruturamos sites multilíngues com endereço próprio para cada idioma, marcação hreflang para os buscadores e conteúdo adaptado a cada mercado — o mesmo modelo usado neste site.',
      },
      {
        question: 'Vocês fazem a manutenção do site?',
        answer:
          'Sim. Além do desenvolvimento, cuidamos da manutenção: atualização de conteúdo, novas páginas, ajustes de desempenho e acompanhamento no Google Search Console.',
      },
    ],
  },
  software: {
    title: 'Sistemas',
    metaTitle: 'Desenvolvimento de sistemas personalizados e CRM',
    metaDescription:
      'Sistemas web sob medida, CRM, dashboards e sistemas de gestão para empresas, com integrações entre aplicações, controle de acesso e dados seguros.',
    heading: 'Sistemas personalizados para a sua operação',
    summary: 'Sistemas web sob medida, CRM, dashboards e portais que organizam a operação e eliminam planilhas.',
    intro:
      'Quando a planilha já não dá conta, é hora de ter um sistema. Construímos aplicações web sob medida para o processo real da sua empresa — do cadastro ao relatório — com controle de acesso, dados seguros e interface simples para a equipe.',
    problems: [
      { title: 'Operação presa em planilhas', text: 'Informações espalhadas em planilhas e mensagens geram retrabalho, erros e dificuldade para saber o que está acontecendo.' },
      { title: 'Sistemas que não conversam', text: 'Dados digitados duas vezes em ferramentas diferentes, sem integração entre vendas, financeiro e atendimento.' },
      { title: 'Software pronto que não se encaixa', text: 'Ferramentas genéricas obrigam a empresa a mudar o processo para caber no sistema, e não o contrário.' },
    ],
    capabilities: [
      'Sistemas web personalizados',
      'CRM sob medida',
      'Dashboards e relatórios',
      'Painéis administrativos',
      'Sistemas de gestão e ERPs sob medida',
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
    faq: [
      {
        question: 'Qual a diferença entre um sistema personalizado e um software pronto?',
        answer:
          'O software pronto atende o processo médio do mercado; o sistema personalizado é construído para o processo real da sua empresa. Quando uma ferramenta pronta resolve bem, nós indicamos — e, se for preciso, integramos o sistema novo a ela.',
      },
      {
        question: 'Vocês desenvolvem CRM sob medida?',
        answer:
          'Sim. Desenvolvemos CRMs com funil de vendas, histórico de clientes, tarefas e integrações com WhatsApp, e-mail e site, adaptados à forma como a equipe comercial trabalha.',
      },
      {
        question: 'Dá para integrar com os sistemas que já usamos?',
        answer:
          'Na maioria dos casos, sim, desde que o sistema atual ofereça API ou exportação de dados. Avaliamos as integrações possíveis ainda na fase de descoberta.',
      },
    ],
  },
  saas: {
    title: 'SaaS',
    metaTitle: 'Desenvolvimento de plataformas SaaS',
    metaDescription:
      'Desenvolvimento de plataformas SaaS multiempresa com assinaturas, pagamentos recorrentes, permissões e arquitetura preparada para escalar — do MVP à operação.',
    heading: 'Desenvolvimento de plataformas SaaS',
    summary: 'Plataformas SaaS multiempresa com assinaturas, pagamentos recorrentes e arquitetura pronta para escalar.',
    intro:
      'Transformar uma ideia em produto digital exige mais do que telas: é preciso cadastro de empresas, planos, cobrança recorrente, permissões e uma base que aguente o crescimento. Desenvolvemos plataformas SaaS completas, do MVP à operação.',
    problems: [
      { title: 'Ideia sem produto validado', text: 'Investir meses em funcionalidades antes de testar com clientes reais aumenta o risco do projeto.' },
      { title: 'Base técnica que não escala', text: 'Um MVP feito às pressas vira obstáculo quando chegam novos clientes, planos e integrações.' },
      { title: 'Cobrança e acessos manuais', text: 'Controlar assinaturas, inadimplência e permissões na mão consome tempo e abre margem para erros.' },
    ],
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
    faq: [
      {
        question: 'Vocês desenvolvem o MVP de um SaaS?',
        answer:
          'Sim. Começamos pelo conjunto mínimo de funcionalidades que valida o produto, sobre uma base preparada para receber planos, cobrança recorrente e novas empresas sem reescrever o sistema.',
      },
      {
        question: 'Como os dados de cada cliente ficam separados?',
        answer:
          'Usamos arquitetura multi-tenant: cada empresa enxerga apenas os próprios dados, com isolamento aplicado no código e, quando o projeto pede, também no banco de dados.',
      },
    ],
  },
  ai: {
    title: 'Inteligência Artificial',
    metaTitle: 'Chatbots com IA e automação de atendimento para empresas',
    metaDescription:
      'Desenvolvimento de chatbots e assistentes virtuais com Inteligência Artificial para site e WhatsApp, integrados aos sistemas da empresa e com atendimento humano quando necessário.',
    heading: 'Chatbots e assistentes com Inteligência Artificial',
    summary: 'Chatbots, agentes de IA e atendimento automatizado no WhatsApp, integrados aos dados e sistemas da empresa.',
    intro:
      'IA útil é IA conectada ao seu negócio. Desenvolvemos assistentes e agentes que respondem clientes, consultam informações, agendam horários e executam tarefas — com limites claros do que podem fazer e passagem para um humano quando necessário.',
    problems: [
      { title: 'Atendimento que não dá conta', text: 'Perguntas repetidas sobre horários, preços e disponibilidade ocupam a equipe e deixam clientes esperando.' },
      { title: 'Contatos perdidos fora do horário', text: 'Mensagens que chegam à noite ou no fim de semana ficam sem resposta, e o cliente procura outra empresa.' },
      { title: 'Chatbots engessados', text: 'Fluxos de botões que não entendem o que o cliente escreve frustram mais do que ajudam.' },
    ],
    capabilities: [
      'Chatbots para site e WhatsApp',
      'Assistentes virtuais com IA',
      'Automação do atendimento',
      'Agentes de IA com ferramentas',
      'Integração de IA em sistemas existentes',
      'Classificação e extração de documentos',
      'Automação de processos com IA',
    ],
    approach: [
      { title: 'Escopo controlado', text: 'O agente só acessa o que precisa e cada ação fica registrada.' },
      { title: 'Humano no circuito', text: 'Quando a IA não deve responder, a conversa vai para a equipe.' },
      { title: 'Modelos de ponta', text: 'Trabalhamos com as APIs dos principais provedores de modelos de linguagem.' },
    ],
    faq: [
      {
        question: 'O chatbot funciona no WhatsApp?',
        answer:
          'Sim. A integração é feita pela API oficial do WhatsApp (WhatsApp Business Platform), seguindo as regras da Meta: o cliente precisa ter autorizado o contato, e mensagens fora da janela de atendimento usam modelos aprovados.',
      },
      {
        question: 'A IA pode responder algo errado?',
        answer:
          'Modelos de linguagem podem errar. Por isso limitamos o assistente às informações e ações que a empresa define, registramos as conversas e configuramos a passagem para um atendente humano em casos sensíveis ou quando a IA não tem segurança.',
      },
      {
        question: 'Quais modelos de IA vocês usam?',
        answer:
          'Trabalhamos com as APIs de provedores como Anthropic (Claude) e OpenAI. A escolha depende do caso de uso, do custo e dos requisitos de privacidade do projeto.',
      },
    ],
  },
  automation: {
    title: 'Automações',
    metaTitle: 'Automação de processos empresariais e integrações',
    metaDescription:
      'Automação de processos e integrações entre sistemas: lembretes, mensagens por WhatsApp e e-mail, relatórios automáticos e rotinas que eliminam tarefas manuais.',
    heading: 'Automação de processos empresariais',
    summary: 'Rotinas automáticas que integram ferramentas, disparam mensagens e acabam com tarefas manuais repetitivas.',
    intro:
      'Boa parte do tempo da equipe vai para copiar dados, enviar lembretes e conferir planilhas. Automatizamos essas rotinas integrando os sistemas que você já usa — com monitoramento e tratamento de falhas.',
    problems: [
      { title: 'Tarefas manuais repetitivas', text: 'Copiar dados entre sistemas, enviar lembretes e montar relatórios toma horas da equipe toda semana.' },
      { title: 'Erros e esquecimentos', text: 'Processos que dependem de alguém lembrar de fazer falham justamente nos dias mais corridos.' },
      { title: 'Ferramentas isoladas', text: 'Formulário, planilha, CRM e financeiro sem integração obrigam a equipe a fazer a ponte manualmente.' },
    ],
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
    faq: [
      {
        question: 'Que tipo de processo pode ser automatizado?',
        answer:
          'Tarefas com regras claras e repetitivas: envio de lembretes e cobranças, cadastro de contatos vindos do site, geração de relatórios, sincronização de dados entre sistemas e processamento de planilhas e arquivos.',
      },
      {
        question: 'E se uma automação falhar?',
        answer:
          'As automações têm novas tentativas automáticas, registro de cada execução e alertas quando algo dá errado, para que nenhuma falha passe despercebida.',
      },
    ],
  },
  ecommerce: {
    title: 'E-commerce',
    metaTitle: 'Desenvolvimento de e-commerce e lojas virtuais',
    metaDescription:
      'Criação de lojas virtuais em Shopify ou sob medida, com pagamentos, estoque, integrações com ERPs e marketplaces e checkout otimizado para celular.',
    heading: 'Desenvolvimento de e-commerce',
    summary: 'Lojas virtuais com pagamentos, integrações e experiência de compra pensada para o celular.',
    intro:
      'Vender online exige uma loja rápida, confiável e fácil de administrar. Configuramos lojas em plataformas consolidadas como a Shopify ou desenvolvemos soluções personalizadas quando o negócio pede regras próprias.',
    problems: [
      { title: 'Vendas dependentes de marketplaces', text: 'Vender só em marketplaces significa pagar comissões altas e ter pouco controle sobre a relação com o cliente.' },
      { title: 'Checkout que afasta o cliente', text: 'Etapas demais, lentidão e páginas que não funcionam bem no celular aumentam o abandono de carrinho.' },
      { title: 'Estoque desencontrado', text: 'Pedidos, estoque e pagamentos sem integração geram vendas de produtos que já acabaram.' },
    ],
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
    faq: [
      {
        question: 'Shopify ou loja sob medida?',
        answer:
          'Quando a operação segue o padrão do varejo, uma plataforma como a Shopify costuma ser mais rápida e econômica. Desenvolvemos sob medida quando o negócio tem regras próprias de preço, catálogo ou integração.',
      },
      {
        question: 'A loja pode vender para outros países?',
        answer:
          'Sim, a loja pode ser multilíngue e trabalhar com mais de uma moeda. Meios de pagamento, impostos e frete internacional são avaliados caso a caso, de acordo com a plataforma escolhida.',
      },
    ],
  },
  cloud: {
    title: 'Cloud & Infraestrutura',
    metaTitle: 'Cloud e infraestrutura em Microsoft Azure e AWS',
    metaDescription:
      'Deploy, servidores, bancos de dados gerenciados, containers e pipelines de CI/CD em Microsoft Azure e AWS para aplicações web, com foco em custo e segurança.',
    heading: 'Cloud e infraestrutura para aplicações web',
    summary: 'Deploy, servidores, bancos de dados e infraestrutura em Microsoft Azure e AWS para aplicações web.',
    intro:
      'Um bom software precisa de uma boa casa. Estruturamos a infraestrutura das aplicações na nuvem — containers, bancos gerenciados, filas, armazenamento e pipelines de deploy — com atenção a custo, segurança e disponibilidade.',
    problems: [
      { title: 'Deploy manual e arriscado', text: 'Publicar uma nova versão "na mão" aumenta o risco de erro e de o sistema ficar fora do ar.' },
      { title: 'Custos de nuvem sem controle', text: 'Recursos superdimensionados ou esquecidos geram faturas maiores do que o projeto precisa.' },
      { title: 'Credenciais expostas', text: 'Senhas e chaves de API guardadas no código ou em mensagens são um risco sério de segurança.' },
    ],
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
    faq: [
      {
        question: 'Vocês trabalham com Azure e AWS?',
        answer:
          'Sim. Estruturamos aplicações em Microsoft Azure e AWS, com containers, bancos de dados gerenciados, armazenamento e pipelines de deploy automatizado.',
      },
      {
        question: 'Vocês podem assumir uma infraestrutura que já existe?',
        answer:
          'Sim. Começamos por um levantamento do ambiente atual — custos, segurança e pontos de falha — e propomos melhorias em etapas, sem interromper a operação.',
      },
    ],
  },
};
