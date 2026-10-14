import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/content';
import { industryMeta } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor, industryIds, pathFor } from '@/lib/i18n/routes';

/** Segmentos priorizados — cada um leva a uma página comercial própria. Não é uma lista de clientes. */
export function Segments({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const text = dict.industriesSection;
  return (
    <Section id={homeAnchor(locale, 'industries')} aria-labelledby="industries-title" className="border-y border-line/[0.06] bg-surface/30">
      <SectionHeading id="industries-title" eyebrow={text.eyebrow} title={text.title} description={text.description} />
      <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {industryIds.map((id, index) => {
          const industry = dict.industries[id];
          return (
            <Reveal as="li" key={id} delay={(index % 3) * 60}>
              <Link href={pathFor(locale, { key: 'industry', id })} className="card card-hover group flex h-full flex-col p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                    <Icon name={industryMeta[id].icon} size={19} />
                  </span>
                  <h3 className="text-base font-semibold text-fg">{industry.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{industry.summary}</p>
                <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-brand-soft">
                  {dict.common.seeDetails}
                  <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          );
        })}
        <Reveal as="li" delay={120}>
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-line/[0.14] p-5 sm:p-6">
            <h3 className="text-base font-semibold text-fg">{text.othersTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{text.others.join(' · ')}</p>
            <Link href={pathFor(locale, { key: 'industries' })} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-soft">
              {text.allIndustries}
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>
        </Reveal>
      </ul>
      <Reveal className="mt-8 flex items-start gap-2.5 text-sm text-subtle">
        <Icon name="info" size={16} className="mt-0.5 shrink-0" />
        <p>{text.disclaimer}</p>
      </Reveal>
    </Section>
  );
}
