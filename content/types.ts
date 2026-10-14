import type { CountryCode, Locale } from '@/lib/i18n/config';
import type { IndustryId, ServiceId } from '@/lib/i18n/routes';

/**
 * Formato dos textos do site. Cada idioma (`content/<locale>/`) precisa
 * preencher todos os campos — o TypeScript acusa qualquer tradução faltando.
 *
 * Regras de conteúdo (valem para todos os idiomas):
 * - nada de clientes, números, depoimentos, certificações ou escritórios
 *   que não existam;
 * - adaptar ao mercado em vez de traduzir ao pé da letra;
 * - todo texto aqui fica visível na página (nada de conteúdo oculto).
 */

export type Faq = { question: string; answer: string };
export type TitledText = { title: string; text: string };

export type ServiceContent = {
  /** Nome curto (cards, menus, breadcrumbs). */
  title: string;
  /** `<title>` da página — descritivo, com o termo que o cliente pesquisa. */
  metaTitle: string;
  metaDescription: string;
  /** H1 da página. */
  heading: string;
  /** Frase dos cards. */
  summary: string;
  intro: string;
  problems: TitledText[];
  capabilities: string[];
  approach: TitledText[];
  faq: Faq[];
};

export type IndustryContent = {
  name: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  /** Frase dos cards. */
  summary: string;
  intro: string;
  challenges: TitledText[];
  solutions: (TitledText & { service: ServiceId })[];
  features: string[];
  /** Cuidado específico do setor (regras, ética, privacidade). */
  note: TitledText;
  faq: Faq[];
  whatsappMessage: string;
};

export type LegalDocument = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  updated: string;
  /** Parágrafos; `{company}`, `{site}` e `{email}` são substituídos na página. */
  intro: string[];
  sections: { title: string; paragraphs: string[] }[];
};

export const serviceTypeIds = ['web', 'software', 'crm', 'saas', 'ai', 'automation', 'ecommerce', 'other'] as const;
export type ServiceTypeId = (typeof serviceTypeIds)[number];

export const contactCountries = ['BR', 'US', 'ES', 'PT', 'OTHER'] as const satisfies readonly (CountryCode | 'OTHER')[];
export type ContactCountry = (typeof contactCountries)[number];

export type ContactFormText = {
  ariaLabel: string;
  honeypot: string;
  labels: {
    name: string;
    company: string;
    country: string;
    email: string;
    phone: string;
    serviceType: string;
    budget: string;
    language: string;
    message: string;
  };
  placeholders: { name: string; company: string; email: string; phone: string; message: string };
  optional: string;
  select: string;
  errors: { name: string; email: string; phone: string; country: string; serviceType: string; language: string; message: string };
  countries: Record<ContactCountry, string>;
  serviceTypes: Record<ServiceTypeId, string>;
  languages: Record<Locale, string>;
  /** Faixas de orçamento na moeda local. Lista vazia = campo oculto. */
  budgetRanges: string[];
  submit: string;
  sending: string;
  sendByEmail: string;
  noteWhatsApp: string;
  noteEndpoint: string;
  sendError: string;
  sent: {
    endpointTitle: string;
    endpointText: string;
    whatsappTitle: string;
    whatsappText: string;
    whatsappRetry: string;
    emailTitle: string;
    emailText: string;
    back: string;
  };
  /** Textos da mensagem enviada por WhatsApp/e-mail (no idioma do visitante). */
  message: {
    greeting: string;
    emailSubject: string;
    endpointSubject: string;
    heading: string;
  };
};

export type Dictionary = {
  locale: Locale;
  meta: {
    siteTitle: string;
    siteDescription: string;
    keywords: string[];
    ogImageAlt: string;
  };
  common: {
    skipToContent: string;
    homeAria: string;
    breadcrumbAria: string;
    home: string;
    seeDetails: string;
    requestQuote: string;
    talkToUs: string;
    newTab: string;
    socialAria: string;
    languageLabel: string;
    menuOpen: string;
    menuClose: string;
    mainNav: string;
    mobileNav: string;
  };
  nav: { services: string; industries: string; about: string; technologies: string; contact: string; cta: string };
  whatsapp: { defaultMessage: string; floatingLabel: string; floatingAria: string };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    text: string;
    primaryCta: string;
    secondaryCta: string;
    capabilitiesAria: string;
    capabilities: string[];
    facts: { services: string; technologies: string; steps: string };
    visual: {
      online: string;
      deployTitle: string;
      deployText: string;
      assistant: string;
      assistantMessage: string;
      /** Trecho de código ilustrativo: `async function fn(arg) { await call(arg); return 'result' }`. */
      code: { fn: string; arg: string; call: string; result: string };
    };
  };
  servicesSection: { eyebrow: string; title: string; description: string; customTitle: string; customText: string; customCta: string };
  industriesSection: {
    eyebrow: string;
    title: string;
    description: string;
    othersTitle: string;
    others: string[];
    disclaimer: string;
    allIndustries: string;
  };
  about: {
    eyebrow: string;
    titleStart: string;
    titleEnd: string;
    paragraphs: string[];
    values: TitledText[];
    tagline: [string, string];
    facts: { title: string; items: TitledText[] };
  };
  founder: {
    eyebrow: string;
    badge: string;
    role: string;
    photoAlt: string;
    bio: string[];
    areasTitle: string;
    areas: string[];
    skillsTitle: string;
    skills: string[];
  };
  stack: {
    eyebrow: string;
    title: string;
    description: string;
    groups: TitledText[];
    /** Traduções de itens que não são nomes próprios (ex.: "APIs REST"). */
    itemLabels: Record<string, string>;
  };
  process: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; text: string; details: string[] }[];
  };
  faqSection: { eyebrow: string; title: string; description: string; items: Faq[] };
  contactSection: {
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    text: string;
    formTitle: string;
    formSubtitle: string;
    whatsappLabel: string;
    emailLabel: string;
  };
  form: ContactFormText;
  cta: { title: string; text: string; primary: string; whatsapp: string };
  servicesPage: { metaTitle: string; metaDescription: string; eyebrow: string; title: string; description: string };
  servicePage: {
    eyebrow: string;
    problemsTitle: string;
    includedTitle: string;
    approachTitle: string;
    technologiesTitle: string;
    sidebarText: string;
    sidebarCta: string;
    faqTitle: string;
    industriesTitle: string;
    otherServices: string;
  };
  services: Record<ServiceId, ServiceContent>;
  industriesPage: { metaTitle: string; metaDescription: string; eyebrow: string; title: string; description: string; disclaimer: string };
  industryPage: {
    eyebrow: string;
    challengesTitle: string;
    solutionsTitle: string;
    featuresTitle: string;
    faqTitle: string;
    servicesTitle: string;
    otherIndustries: string;
    ctaTitle: string;
    ctaText: string;
    disclaimer: string;
  };
  industries: Record<IndustryId, IndustryContent>;
  legal: { privacy: LegalDocument; terms: LegalDocument };
  footer: {
    tagline: string;
    servicesTitle: string;
    industriesTitle: string;
    companyTitle: string;
    contactTitle: string;
    companyLinks: { about: string; process: string; technologies: string; faq: string; contact: string };
    rights: string;
    /** Rótulo do CNPJ (identificação fiscal brasileira), explicado para leitores de outros países. */
    companyId: string;
    location: string;
    privacy: string;
    terms: string;
    languagesTitle: string;
  };
  consent: { text: string; accept: string; reject: string; policy: string; manage: string };
  notFound: { title: string; text: string; cta: string };
};
