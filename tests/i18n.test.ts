import { describe, expect, it } from 'vitest';
import { services } from '@/data/services';
import { serviceTranslations, translatedService } from '@/data/service-translations';
import { budgetRanges, formatContactMessage, projectTypes, validateContact, type ContactPayload } from '@/lib/contact';
import { defaultLocale, localeFromPathname, locales, localizedPath } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

describe('localized static routes', () => {
  it('uses US English at the root and preserves the same page across locales', () => {
    expect(defaultLocale).toBe('en-US');
    for (const locale of locales) {
      const path = localizedPath('/pt-br/solucoes/sites/', locale);
      expect(localeFromPathname(path)).toBe(locale);
      expect(path).toBe({ 'en-US': '/solucoes/sites/', 'pt-BR': '/pt-br/solucoes/sites/', es: '/es/solucoes/sites/' }[locale]);
    }
  });

  it('has a complete translated record for every service slug', () => {
    const slugs = services.map((service) => service.slug).sort();
    for (const locale of ['en-US', 'es'] as const) {
      expect(Object.keys(serviceTranslations[locale]).sort()).toEqual(slugs);
      for (const service of services) {
        const translation = translatedService(service, locale);
        expect(translation.title.trim()).not.toBe('');
        expect(translation.capabilities).toHaveLength(service.capabilities.length);
        expect(translation.approach).toHaveLength(service.approach.length);
      }
    }
  });

  it('sets a canonical URL, three language alternatives and the default', () => {
    const metadata = buildMetadata({ path: '/es/solucoes/sites/', locale: 'es', title: 'Sitios web' });
    expect(metadata.alternates?.canonical).toBe('https://hrtechsistemas.com.br/es/solucoes/sites/');
    expect(metadata.alternates?.languages).toEqual({
      'en-US': 'https://hrtechsistemas.com.br/solucoes/sites/',
      'pt-BR': 'https://hrtechsistemas.com.br/pt-br/solucoes/sites/',
      es: 'https://hrtechsistemas.com.br/es/solucoes/sites/',
      'x-default': 'https://hrtechsistemas.com.br/solucoes/sites/',
    });
  });
});

describe('localized contact form', () => {
  const payload: ContactPayload = {
    name: 'Maria Silva', company: '', email: 'maria@example.com', whatsapp: '',
    projectType: projectTypes[0], budget: budgetRanges[1], message: 'Preciso de um site institucional.',
  };

  it.each([
    ['en-US', 'Enter your name.', 'Website', 'Up to R$5,000'],
    ['pt-BR', 'Informe seu nome.', 'Site', 'Até R$ 5 mil'],
    ['es', 'Ingrese su nombre.', 'Sitio web', 'Hasta R$5.000'],
  ] as const)('uses %s for validation and outgoing text', (locale, error, project, budget) => {
    expect(validateContact({ ...payload, name: '' }, locale).name).toBe(error);
    const message = formatContactMessage(payload, locale);
    expect(message).toContain(`: ${project}`);
    expect(message).toContain(`: ${budget}`);
  });
});
