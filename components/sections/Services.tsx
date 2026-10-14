import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/content';
import { serviceMeta } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor, homeSectionPath, pathFor, serviceIds } from '@/lib/i18n/routes';

export function Services({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const text = dict.servicesSection;
  return (
    <Section id={homeAnchor(locale, 'services')} aria-labelledby="services-title">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading id="services-title" eyebrow={text.eyebrow} title={text.title} description={text.description} />
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {serviceIds.map((id, index) => {
          const service = dict.services[id];
          const meta = serviceMeta[id];
          return (
            <Reveal as="li" key={id} delay={(index % 4) * 70}>
              <Link
                href={pathFor(locale, { key: 'service', id })}
                className="card card-hover group relative flex h-full flex-col overflow-hidden p-6 sm:p-7"
                aria-label={`${service.title}: ${dict.common.seeDetails}`}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                    <Icon name={meta.icon} size={21} />
                  </span>
                  <span className="font-mono text-xs text-subtle">{meta.number}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-fg">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{service.summary}</p>
                <ul className="mt-5 space-y-1.5">
                  {service.capabilities.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-subtle">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-soft/70" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto flex items-center gap-1.5 pt-7 text-sm font-medium text-brand-soft">
                  {dict.common.seeDetails}
                  <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          );
        })}

        <Reveal as="li" delay={210}>
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/20 via-brand/[0.06] to-transparent p-6 sm:p-7">
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white">
                <Icon name="code" size={21} />
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-fg">{text.customTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{text.customText}</p>
            </div>
            <Link href={homeSectionPath(locale, 'contact')} className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-fg">
              {text.customCta}
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>
        </Reveal>
      </ul>
    </Section>
  );
}
