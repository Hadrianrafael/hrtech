import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
import { getDictionary } from '@/content';
import { techGroups } from '@/data/technologies';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor, homeSectionPath, serviceIds } from '@/lib/i18n/routes';
import { HeroVisual } from './HeroVisual';

const uniqueTechCount = new Set(techGroups.flatMap((group) => group.items.map((item) => item.name))).size;

export function Hero({ locale }: { locale: Locale }) {
  const { hero } = getDictionary(locale);
  /** Números calculados a partir do próprio conteúdo do site — nada inventado. */
  const facts = [
    { value: serviceIds.length, label: hero.facts.services },
    { value: uniqueTechCount, label: hero.facts.technologies },
    { value: getDictionary(locale).process.steps.length, label: hero.facts.steps },
  ];
  return (
    <section id={homeAnchor(locale, 'top')} className="relative overflow-hidden pb-16 pt-[calc(var(--header-h)+3rem)] sm:pb-20 lg:pb-24 lg:pt-[calc(var(--header-h)+5rem)]">
      {/* fundo */}
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] -z-10 h-[38rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.22),transparent)]" />

      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="max-w-2xl">
            <p className="eyebrow hero-in">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-soft" aria-hidden="true" />
              {hero.eyebrow}
            </p>
            <h1 className="hero-rise mt-6 text-[2.75rem] font-semibold leading-[1.02] tracking-tightest text-fg sm:text-6xl lg:text-[4.4rem]">
              {hero.titleStart}
              <span className="text-gradient">{hero.titleHighlight}</span>
            </h1>
            <p className="hero-in mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{hero.text}</p>
            <div className="hero-in mt-9 flex flex-col gap-3 [animation-delay:120ms] sm:flex-row">
              <ButtonLink href={homeSectionPath(locale, 'services')} size="lg">
                {hero.primaryCta}
                <Icon name="arrowRight" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </ButtonLink>
              <ButtonLink href={homeSectionPath(locale, 'contact')} size="lg" variant="secondary">
                {hero.secondaryCta}
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2.5" aria-label={hero.capabilitiesAria}>
              {hero.capabilities.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-subtle">
                  <Icon name="check" size={14} className="text-brand-soft" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-in relative [animation-delay:200ms] lg:pl-6">
            <HeroVisual text={hero.visual} />
          </div>
        </div>

        <dl className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] lg:mt-28">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col bg-bg px-5 py-6 sm:px-7 sm:py-7">
              <dt className="order-2 mt-1 text-sm text-subtle">{fact.label}</dt>
              <dd className="font-mono text-3xl font-medium tracking-tight text-fg sm:text-4xl">
                <CountUp value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
