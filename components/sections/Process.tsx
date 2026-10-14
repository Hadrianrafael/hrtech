import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor } from '@/lib/i18n/routes';

export function Process({ locale }: { locale: Locale }) {
  const { process } = getDictionary(locale);
  return (
    <Section id={homeAnchor(locale, 'process')} aria-labelledby="process-title">
      <SectionHeading id="process-title" eyebrow={process.eyebrow} title={process.title} description={process.description} />
      <ol className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {process.steps.map((step, index) => {
          const number = String(index + 1).padStart(2, '0');
          return (
            <Reveal as="li" key={number} delay={(index % 3) * 80} className="card card-hover group relative overflow-hidden p-6 sm:p-7">
              {/* Numeral decorativo: vem de `data-n` via CSS (não é texto da página). */}
              <span
                data-n={number}
                className="pointer-events-none absolute -right-2 -top-6 select-none font-mono text-[6.5rem] font-semibold leading-none text-white/[0.03] transition-colors duration-500 before:content-[attr(data-n)] group-hover:text-brand/[0.08]"
                aria-hidden="true"
              />
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-brand/40 bg-brand/10 font-mono text-xs text-brand-soft">{number}</span>
                <span className="hairline flex-1" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-fg">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.text}</p>
              <ul className="mt-5 space-y-1.5">
                {step.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-[13px] text-subtle">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-soft/70" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
