import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/sections/CtaBand';
import { Reveal } from '@/components/ui/Reveal';
import { getDictionary } from '@/content';
import { industryMeta } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { industryIds, pathFor } from '@/lib/i18n/routes';

export function IndustriesIndexPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const text = dict.industriesPage;
  return (
    <>
      <PageHeader
        breadcrumbLabel={dict.common.breadcrumbAria}
        breadcrumbs={[
          { name: dict.common.home, path: pathFor(locale, { key: 'home' }) },
          { name: text.eyebrow, path: pathFor(locale, { key: 'industries' }) },
        ]}
        eyebrow={<p className="eyebrow">{text.eyebrow}</p>}
        title={text.title}
        description={text.description}
      />
      <section className="pb-24 lg:pb-32">
        <div className="container">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industryIds.map((id, index) => {
              const industry = dict.industries[id];
              return (
                <Reveal as="li" key={id} delay={(index % 3) * 60}>
                  <Link href={pathFor(locale, { key: 'industry', id })} className="card card-hover group flex h-full flex-col p-6 sm:p-7">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                      <Icon name={industryMeta[id].icon} size={21} />
                    </span>
                    <h2 className="mt-6 text-xl font-semibold tracking-tight text-fg">{industry.name}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{industry.summary}</p>
                    <span className="mt-auto flex items-center gap-1.5 pt-7 text-sm font-medium text-brand-soft">
                      {dict.common.seeDetails}
                      <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
          <p className="mt-8 flex items-start gap-2.5 text-sm text-subtle">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            {text.disclaimer}
          </p>
        </div>
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
