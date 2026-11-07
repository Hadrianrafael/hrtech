import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { services } from '@/data/services';
import { translatedService } from '@/data/service-translations';
import { defaultLocale, getUi, localeConfig, type Locale } from '@/lib/i18n';

export function Services({ locale = defaultLocale }: { locale?: Locale }) {
  const ui = getUi(locale);
  const prefix = localeConfig[locale].prefix;
  const copy = {
    'en-US': { title: 'Solutions to transform your business', description: 'From your digital presence to internal operations, we develop the technology your company needs with the same technical standards in every delivery.', custom: 'A solution built for you', customText: 'Does your need fall outside these categories? Tell us about the challenge and we will design a solution together.', talk: 'Discuss your project' },
    'pt-BR': { title: 'Soluções para transformar seu negócio', description: 'Da presença digital à operação interna: desenvolvemos a tecnologia que a sua empresa precisa, com o mesmo padrão técnico em cada entrega.', custom: 'Projeto sob medida', customText: 'Sua necessidade não se encaixa em uma categoria? Conte o desafio e desenhamos a solução com você.', talk: 'Conversar sobre o projeto' },
    es: { title: 'Soluciones para transformar su negocio', description: 'Desde la presencia digital hasta las operaciones internas, desarrollamos la tecnología que su empresa necesita con el mismo rigor técnico en cada entrega.', custom: 'Una solución a medida', customText: '¿Su necesidad no encaja en estas categorías? Cuéntenos el desafío y diseñaremos juntos la solución.', talk: 'Hablemos de su proyecto' },
  }[locale];
  return (
    <Section id="solucoes" aria-labelledby="solucoes-title">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="solucoes-title"
          eyebrow={ui.solutions}
          title={copy.title}
          description={copy.description}
        />
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((baseService, index) => {
          const service = translatedService(baseService, locale);
          return (
          <Reveal as="li" key={service.slug} delay={(index % 4) * 70}>
            <Link
              href={`${prefix}/solucoes/${service.slug}/`}
              className="card card-hover group relative flex h-full flex-col overflow-hidden p-6 sm:p-7"
              aria-label={`${service.title}: ${ui.details}`}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                  <Icon name={service.icon} size={21} />
                </span>
                <span className="font-mono text-xs text-subtle">{service.number}</span>
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
                {ui.details}
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
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-fg">{copy.custom}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {copy.customText}
              </p>
            </div>
            <Link href={`${prefix}/#contato`} className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-fg">
              {copy.talk}
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>
        </Reveal>
      </ul>
    </Section>
  );
}
