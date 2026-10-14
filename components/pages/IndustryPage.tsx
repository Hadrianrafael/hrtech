import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/sections/CtaBand';
import { FaqList } from '@/components/sections/Faq';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { getDictionary } from '@/content';
import { industryMeta, serviceMeta } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { homeSectionPath, industryIds, pathFor, type IndustryId } from '@/lib/i18n/routes';
import { serviceSchema } from '@/lib/seo';

export function IndustryPage({ locale, id }: { locale: Locale; id: IndustryId }) {
  const dict = getDictionary(locale);
  const text = dict.industryPage;
  const industry = dict.industries[id];
  const relatedServices = [...new Set(industry.solutions.map((solution) => solution.service))];

  return (
    <>
      <JsonLd data={serviceSchema(locale, { key: 'industry', id })} />
      <PageHeader
        breadcrumbLabel={dict.common.breadcrumbAria}
        breadcrumbs={[
          { name: dict.common.home, path: pathFor(locale, { key: 'home' }) },
          { name: dict.industriesPage.eyebrow, path: pathFor(locale, { key: 'industries' }) },
          { name: industry.name, path: pathFor(locale, { key: 'industry', id }) },
        ]}
        eyebrow={
          <span className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-brand/10 text-brand-soft">
              <Icon name={industryMeta[id].icon} size={21} />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">{text.eyebrow}</span>
          </span>
        }
        title={industry.heading}
        description={industry.intro}
      >
        <div className="hero-in mt-8 flex flex-wrap gap-3">
          <ButtonLink href={homeSectionPath(locale, 'contact')} size="lg">
            {dict.common.requestQuote}
            <Icon name="arrowRight" size={16} />
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="pb-20 lg:pb-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="text-xl font-semibold tracking-tight text-fg">{text.challengesTitle}</h2>
                <div className="mt-6 divide-y divide-line/[0.07] border-t border-line/[0.07]">
                  {industry.challenges.map((item) => (
                    <div key={item.title} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:gap-10">
                      <h3 className="text-sm font-medium text-fg sm:w-52 sm:shrink-0">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal className="mt-14" delay={40}>
                <h2 className="text-xl font-semibold tracking-tight text-fg">{text.solutionsTitle}</h2>
                <ul className="mt-6 grid gap-4">
                  {industry.solutions.map((solution) => (
                    <li key={solution.title} className="card p-5 sm:p-6">
                      <h3 className="text-base font-semibold text-fg">{solution.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{solution.text}</p>
                      <Link href={pathFor(locale, { key: 'service', id: solution.service })} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-soft">
                        {dict.services[solution.service].title}
                        <Icon name="arrowRight" size={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-14" delay={80}>
                <div className="flex gap-3 rounded-2xl border border-brand/25 bg-brand/[0.06] p-5 sm:p-6">
                  <Icon name="info" size={18} className="mt-0.5 shrink-0 text-brand-soft" />
                  <div>
                    <h2 className="text-sm font-semibold text-fg">{industry.note.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{industry.note.text}</p>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={120} className="card sticky top-24 p-6 sm:p-7">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">{text.featuresTitle}</h2>
                <ul className="mt-5 space-y-2.5">
                  {industry.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-fg/90">
                      <Icon name="check" size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-brand-soft" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t border-line/[0.08] pt-6">
                  <p className="text-sm leading-relaxed text-muted">{text.ctaText}</p>
                  <ButtonLink href={homeSectionPath(locale, 'contact')} className="mt-4 w-full">
                    {dict.common.talkToUs}
                    <Icon name="arrowRight" size={15} />
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 lg:pb-24">
        <div className="container max-w-4xl">
          <h2 className="text-xl font-semibold tracking-tight text-fg">{text.faqTitle}</h2>
          <div className="mt-6">
            <FaqList items={industry.faq} locale={locale} />
          </div>
          <p className="mt-6 flex items-start gap-2.5 text-xs text-subtle">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            {text.disclaimer}
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="container">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">{text.servicesTitle}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {relatedServices.map((service) => (
              <li key={service}>
                <Link href={pathFor(locale, { key: 'service', id: service })} className="inline-flex items-center gap-2 rounded-full border border-line/[0.1] px-4 py-2 text-sm text-muted transition-colors hover:border-line/[0.25] hover:text-fg">
                  <Icon name={serviceMeta[service].icon} size={15} />
                  {dict.services[service].title}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">{text.otherIndustries}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {industryIds
              .filter((other) => other !== id)
              .map((other) => (
                <li key={other}>
                  <Link href={pathFor(locale, { key: 'industry', id: other })} className="inline-flex items-center gap-2 rounded-full border border-line/[0.1] px-4 py-2 text-sm text-muted transition-colors hover:border-line/[0.25] hover:text-fg">
                    <Icon name={industryMeta[other].icon} size={15} />
                    {dict.industries[other].name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <CtaBand locale={locale} title={text.ctaTitle} text={text.ctaText} whatsappMessage={industry.whatsappMessage} />
    </>
  );
}
