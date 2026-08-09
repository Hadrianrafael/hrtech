export const siteConfig = {
  name: 'HR Tech',
  description:
    'A HR Tech desenvolve sistemas personalizados, SaaS, automações, inteligência artificial e soluções digitais para empresas.',
  url: 'https://hrtechsistemas.com.br',
  email: 'contato@hrtechsistemas.com.br',
  whatsappNumber: '5511932441699',
  whatsappDefaultMessage: 'Olá! Conheci a HR Tech pelo site e gostaria de saber mais sobre as soluções.',
  get whatsappHref() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappDefaultMessage)}`;
  },
  instagramUrl: 'https://www.instagram.com/hr_desenvolvimento/',
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
