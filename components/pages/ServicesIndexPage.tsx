import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/sections/CtaBand';
import { Reveal } from '@/components/ui/Reveal';
import { getDictionary } from '@/content';
import { serviceMeta } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { pathFor, serviceIds } from '@/lib/i18n/routes';

export function ServicesIndexPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const text = dict.servicesPage;
  return (
    <>
      <PageHeader
        breadcrumbLabel={dict.common.breadcrumbAria}
        breadcrumbs={[
          { name: dict.common.home, path: pathFor(locale, { key: 'home' }) },
          { name: text.eyebrow, path: pathFor(locale, { key: 'services' }) },
        ]}
        eyebrow={<p className="eyebrow">{text.eyebrow}</p>}
        title={text.title}
        description={text.description}
      />
      <section className="pb-24 lg:pb-32">
        <div className="container">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {serviceIds.map((id, index) => {
              const service = dict.services[id];
              return (
                <Reveal as="li" key={id} delay={(index % 4) * 60}>
                  <Link href={pathFor(locale, { key: 'service', id })} className="card card-hover group flex h-full flex-col p-6 sm:p-7">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                      <Icon name={serviceMeta[id].icon} size={21} />
                    </span>
                    <h2 className="mt-6 text-xl font-semibold tracking-tight text-fg">{service.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{service.summary}</p>
                    <span className="mt-auto flex items-center gap-1.5 pt-7 text-sm font-medium text-brand-soft">
                      {dict.common.seeDetails}
                      <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
