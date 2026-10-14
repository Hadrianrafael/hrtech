/**
 * Configuração central do site (dados que não dependem do idioma).
 *
 * Tudo que muda com frequência (contatos, redes sociais, WhatsApp, domínio)
 * fica aqui — nenhum componente deve ter esses valores escritos direto no JSX.
 * Os textos de cada idioma ficam em `content/<idioma>/`.
 * Campos vazios ('') são simplesmente ocultados na interface.
 */
export const siteConfig = {
  name: 'HR Tech Sistemas',
  shortName: 'HR Tech',
  legalName: 'HR Tech Sistemas',
  cnpj: '68.438.436/0001-09', // CCMEI — HADRIAN RAFAEL SILVA DE OLIVEIRA
  url: 'https://hrtechsistemas.com.br',
  city: 'Suzano', // Endereço comercial do CCMEI
  region: 'SP',
  country: 'BR',
  /** Países atendidos (remotamente). Não implica escritório local. */
  areaServed: ['BR', 'US', 'ES'],

  contact: {
    email: 'contato@hrtechsistemas.com.br',
    /** Número no formato internacional, só dígitos (55 + DDD + número). */
    whatsappNumber: '5511932441699',
    whatsappDisplay: '+55 (11) 93244-1699',
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

  founder: { name: 'Hadrian Rafael Silva de Oliveira', shortName: 'Hadrian Rafael', photo: '/images/founder.webp' },

  /** ID de mensuração do Google Analytics (GA4), formato "G-XXXXXXXXXX". Vazio desativa o script. */
  googleAnalyticsId: 'G-B9NPFJ0FP5',
  googleSiteVerification: 'A4QBLq7zDow9yYiYTCHeKTYR8SlVe0F8zmZBV8mtpB0',
} as const;
