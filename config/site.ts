/**
 * Configuração central do site.
 *
 * Tudo que muda com frequência (contatos, redes sociais, WhatsApp, domínio)
 * fica aqui — nenhum componente deve ter esses valores escritos direto no JSX.
 * Campos vazios ('') são simplesmente ocultados na interface.
 */
export const siteConfig = {
  name: 'HR Tech Sistemas',
  shortName: 'HR Tech',
  legalName: 'HR Tech Sistemas', // TODO: razão social completa, se quiser exibi-la no rodapé
  cnpj: '', // TODO: informar CNPJ (opcional — aparece no rodapé quando preenchido)
  url: 'https://hrtechsistemas.com.br',
  locale: 'pt_BR',
  title: 'HR Tech Sistemas | Sites, Sistemas, SaaS e Inteligência Artificial',
  description:
    'A HR Tech Sistemas desenvolve sites, sistemas web, plataformas SaaS, automações e soluções com Inteligência Artificial para empresas que querem crescer com tecnologia.',
  keywords: [
    'desenvolvimento de sites',
    'desenvolvimento de sistemas',
    'software house',
    'SaaS',
    'sistemas web personalizados',
    'inteligência artificial para empresas',
    'chatbot WhatsApp',
    'automação de processos',
    'e-commerce',
    'Azure',
    'AWS',
  ],
  city: '', // TODO: cidade de atuação (usada no schema.org quando preenchida)
  region: 'SP',
  country: 'BR',

  contact: {
    email: 'contato@hrtechsistemas.com.br',
    /** Número no formato internacional, só dígitos (55 + DDD + número). */
    whatsappNumber: '5511932441699',
    whatsappDisplay: '(11) 93244-1699',
    whatsappMessage: 'Olá! Conheci a HR Tech pelo site e gostaria de conversar sobre um projeto.',
  },

  /**
   * Endpoint opcional para o formulário de contato (ex.: Formspree, Getform,
   * uma Azure Function). Deve aceitar POST JSON. Enquanto estiver vazio,
   * o formulário monta a mensagem e abre o WhatsApp (ou o e-mail).
   */
  contactFormEndpoint: '',

  social: {
    // GitHub pessoal do fundador removido — o site representa a empresa, não é um perfil individual.
    github: '',
    linkedin: '', // TODO: URL do LinkedIn da HR Tech ou do fundador
    instagram: 'https://www.instagram.com/hr_desenvolvimento/',
  },
} as const;

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Soluções', href: '/#solucoes' },
  { label: 'Sobre', href: '/#sobre' },
  { label: 'Tecnologias', href: '/#tecnologias' },
  { label: 'Contato', href: '/#contato' },
];

export const primaryCta: NavItem = { label: 'Iniciar projeto', href: '/#contato' };
