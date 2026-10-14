import { PageHeader } from '@/components/layout/PageHeader';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';
import type { LegalDocument } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';
import { pathFor } from '@/lib/i18n/routes';

function fill(text: string): string {
  return text
    .replaceAll('{company}', siteConfig.legalName)
    .replaceAll('{site}', siteConfig.url.replace('https://', ''))
    .replaceAll('{email}', siteConfig.contact.email);
}

export function LegalPage({ locale, doc }: { locale: Locale; doc: 'privacy' | 'terms' }) {
  const dict = getDictionary(locale);
  const content: LegalDocument = dict.legal[doc];
  return (
    <>
      <PageHeader
        breadcrumbLabel={dict.common.breadcrumbAria}
        breadcrumbs={[
          { name: dict.common.home, path: pathFor(locale, { key: 'home' }) },
          { name: content.title, path: pathFor(locale, { key: doc }) },
        ]}
        title={content.title}
        description={content.updated}
      />
      <section className="pb-24 lg:pb-32">
        <div className="container max-w-prose space-y-6 text-[15px] leading-relaxed text-muted">
          {content.intro.map((paragraph) => (
            <p key={paragraph}>{fill(paragraph)}</p>
          ))}
          {content.sections.map((section) => (
            <section key={section.title} className="space-y-6">
              <h2 className="pt-2 text-lg font-semibold text-fg">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{fill(paragraph)}</p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
