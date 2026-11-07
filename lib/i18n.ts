export const locales = ['en-US', 'pt-BR', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-US';

export const localeConfig = {
  'en-US': { label: 'English', prefix: '', htmlLang: 'en-US', openGraph: 'en_US' },
  'pt-BR': { label: 'Português', prefix: '/pt-br', htmlLang: 'pt-BR', openGraph: 'pt_BR' },
  es: { label: 'Español', prefix: '/es', htmlLang: 'es', openGraph: 'es_ES' },
} as const;

export function localeFromPathname(pathname: string): Locale {
  if (pathname === '/pt-br' || pathname.startsWith('/pt-br/')) return 'pt-BR';
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es';
  return defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(pt-br|es)(?=\/|$)/, '');
  return stripped || '/';
}

export function localizedPath(pathname: string, locale: Locale): string {
  const path = stripLocalePrefix(pathname);
  return `${localeConfig[locale].prefix}${path === '/' ? '/' : path}`;
}

export const uiMessages = {
  'en-US': {
    skip: 'Skip to content', home: 'Home', solutions: 'Solutions', about: 'About', technologies: 'Technologies', contact: 'Contact',
    startProject: 'Start a project', mainNav: 'Main navigation', mobileNav: 'Main navigation (mobile)', openMenu: 'Open menu', closeMenu: 'Close menu',
    language: 'Language', selectLanguage: 'Select language', company: 'Company', process: 'How we work', segments: 'Industries',
    privacy: 'Privacy Policy', terms: 'Terms of Use', rights: 'All rights reserved.', social: 'Social media', newTab: 'opens in a new tab',
    footerDescription: 'Websites, business systems, SaaS platforms, automation and Artificial Intelligence for companies ready to grow through technology.',
    whatsapp: 'Talk to us on WhatsApp', requestQuote: 'Request a quote', details: 'View details', otherSolutions: 'Other solutions',
  },
  'pt-BR': {
    skip: 'Pular para o conteúdo', home: 'Início', solutions: 'Soluções', about: 'Sobre', technologies: 'Tecnologias', contact: 'Contato',
    startProject: 'Iniciar projeto', mainNav: 'Navegação principal', mobileNav: 'Navegação principal (celular)', openMenu: 'Abrir menu', closeMenu: 'Fechar menu',
    language: 'Idioma', selectLanguage: 'Selecionar idioma', company: 'Empresa', process: 'Como trabalhamos', segments: 'Segmentos',
    privacy: 'Política de Privacidade', terms: 'Termos de Uso', rights: 'Todos os direitos reservados.', social: 'Redes sociais', newTab: 'abre em nova aba',
    footerDescription: 'Sites, sistemas, plataformas SaaS, automações e Inteligência Artificial para empresas que querem crescer com tecnologia.',
    whatsapp: 'Fale conosco no WhatsApp', requestQuote: 'Solicitar orçamento', details: 'Ver detalhes', otherSolutions: 'Outras soluções',
  },
  es: {
    skip: 'Saltar al contenido', home: 'Inicio', solutions: 'Soluciones', about: 'Nosotros', technologies: 'Tecnologías', contact: 'Contacto',
    startProject: 'Iniciar un proyecto', mainNav: 'Navegación principal', mobileNav: 'Navegación principal (móvil)', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú',
    language: 'Idioma', selectLanguage: 'Seleccionar idioma', company: 'Empresa', process: 'Cómo trabajamos', segments: 'Sectores',
    privacy: 'Política de Privacidad', terms: 'Términos de Uso', rights: 'Todos los derechos reservados.', social: 'Redes sociales', newTab: 'se abre en una pestaña nueva',
    footerDescription: 'Sitios web, sistemas empresariales, plataformas SaaS, automatización e Inteligencia Artificial para empresas que quieren crecer con tecnología.',
    whatsapp: 'Hable con nosotros por WhatsApp', requestQuote: 'Solicitar presupuesto', details: 'Ver detalles', otherSolutions: 'Otras soluciones',
  },
} as const;

export function getUi(locale: Locale) {
  return uiMessages[locale];
}

export function whatsappGreeting(locale: Locale): string {
  return {
    'en-US': 'Hello! I found HR Tech through your website and would like to discuss a project.',
    'pt-BR': 'Olá! Conheci a HR Tech pelo site e gostaria de conversar sobre um projeto.',
    es: '¡Hola! Conocí HR Tech por su sitio web y me gustaría hablar sobre un proyecto.',
  }[locale];
}
