import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { processSteps } from '@/data/process';

export function Process() {
  return (
    <Section id="processo" aria-labelledby="processo-title">
      <SectionHeading
        id="processo-title"
        eyebrow="Processo"
        title="Como transformamos uma ideia em produto"
        description="Um processo claro, com etapas definidas e você acompanhando cada entrega."
      />
      <ol className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {processSteps.map((step, index) => (
          <Reveal as="li" key={step.number} delay={(index % 3) * 80} className="card card-hover group relative overflow-hidden p-6 sm:p-7">
            <span className="pointer-events-none absolute -right-2 -top-6 select-none font-mono text-[6.5rem] font-semibold leading-none text-white/[0.03] transition-colors duration-500 group-hover:text-brand/[0.08]" aria-hidden="true">
              {step.number}
            </span>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-brand/40 bg-brand/10 font-mono text-xs text-brand-soft">{step.number}</span>
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
        ))}
      </ol>
    </Section>
  );
}
