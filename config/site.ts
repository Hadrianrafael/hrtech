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
  legalName: 'HR Tech Sistemas',
  cnpj: '68.438.436/0001-09', // CCMEI — HADRIAN RAFAEL SILVA DE OLIVEIRA
  url: 'https://hrtechsistemas.com.br',
  locale: 'en_US',
  title: 'HR Tech Sistemas | Websites, Business Systems, SaaS and AI',
  description:
    'HR Tech Sistemas develops websites, business systems, SaaS platforms, automation and Artificial Intelligence solutions for companies ready to grow through technology.',
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
  city: 'Suzano', // Endereço comercial do CCMEI
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

  /** ID de mensuração do Google Analytics (GA4), formato "G-XXXXXXXXXX". Vazio desativa o script. */
  googleAnalyticsId: 'G-B9NPFJ0FP5',
} as const;
