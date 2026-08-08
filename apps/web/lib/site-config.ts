export const siteConfig = {
  name: 'HR Tech',
  description:
    'Desenvolvimento de Sistemas, Plataformas SaaS e Inteligência Artificial. Engenharia de software de padrão internacional.',
  url: 'https://hrtechsistemas.com.br',
  email: 'contato@hrtechsistemas.com.br',
  whatsappNumber: '5511916528370',
  get whatsappHref() {
    return `https://wa.me/${this.whatsappNumber}`;
  },
};

export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Portfólio', href: '/portfolio' },
  { label: 'Soluções', href: '/solucoes' },
  { label: 'Contato', href: '/contato' },
];

export const footerGroups = [
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre a HR Tech', href: '/sobre' },
      { label: 'Serviços', href: '/servicos' },
      { label: 'Portfólio', href: '/portfolio' },
      { label: 'Contato', href: '/contato' },
    ],
  },
  {
    title: 'Soluções',
    links: [
      { label: 'Soluções para Advocacia', href: '/solucoes/juridico' },
      { label: 'Próximas soluções', href: '/solucoes' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Política de Privacidade', href: '/privacidade' },
      { label: 'Termos de Uso', href: '/termos' },
    ],
  },
];
