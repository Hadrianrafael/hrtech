import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from './CtaBand';
import { Reveal } from '@/components/ui/Reveal';
import { services } from '@/data/services';
import { translatedService } from '@/data/service-translations';
import { getUi, localeConfig, type Locale } from '@/lib/i18n';

export function SolutionsContent({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const prefix = localeConfig[locale].prefix;
  const copy = {
    'en-US': ['Solutions to transform your business', 'From your digital presence to internal operations, we develop the technology your company needs.'],
    'pt-BR': ['Soluções para transformar seu negócio', 'Da presença digital à operação interna: desenvolvemos a tecnologia que a sua empresa precisa.'],
    es: ['Soluciones para transformar su negocio', 'Desde su presencia digital hasta las operaciones internas, desarrollamos la tecnología que su empresa necesita.'],
  }[locale];
  return <>
    <PageHeader breadcrumbs={[{ name: ui.home, path: `${prefix}/` }, { name: ui.solutions, path: `${prefix}/solucoes/` }]}
      eyebrow={<p className="eyebrow">{ui.solutions}</p>} title={copy[0]!} description={copy[1]!} />
    <section className="pb-24 lg:pb-32"><div className="container">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((baseService, index) => {
          const service = translatedService(baseService, locale);
          return <Reveal as="li" key={service.slug} delay={(index % 4) * 60}>
            <Link href={`${prefix}/solucoes/${service.slug}/`} className="card card-hover group flex h-full flex-col p-6 sm:p-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10"><Icon name={service.icon} size={21} /></span>
              <h2 className="mt-6 text-xl font-semibold tracking-tight text-fg">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{service.summary}</p>
              <span className="mt-auto flex items-center gap-1.5 pt-7 text-sm font-medium text-brand-soft">{ui.details}<Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" /></span>
            </Link>
          </Reveal>;
        })}
      </ul>
    </div></section>
    <CtaBand locale={locale} />
  </>;
}
