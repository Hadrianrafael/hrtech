import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor } from '@/lib/i18n/routes';
import { FaqList } from './Faq';

export function FaqSection({ locale }: { locale: Locale }) {
  const { faqSection } = getDictionary(locale);
  return (
    <Section id={homeAnchor(locale, 'faq')} aria-labelledby="faq-title">
      <SectionHeading id="faq-title" eyebrow={faqSection.eyebrow} title={faqSection.title} description={faqSection.description} />
      <Reveal className="mt-12 max-w-3xl">
        <FaqList items={faqSection.items} locale={locale} />
      </Reveal>
    </Section>
  );
}
