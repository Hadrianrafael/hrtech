import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { companyValues } from '@/data/company';

export function About() {
  return (
    <Section id="sobre" aria-labelledby="sobre-title">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-soft/60" aria-hidden="true" />
              Sobre a HR Tech
            </p>
            <h2 id="sobre-title" className="mt-5 text-[2rem] font-semibold leading-[1.08] tracking-tightest text-fg sm:text-[2.6rem] lg:text-5xl">
              Não desenvolvemos apenas sites.
              <span className="mt-1 block text-muted">Criamos soluções digitais para empresas.</span>
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-7 lg:pt-12">
          <Reveal className="space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              A HR Tech Sistemas é uma empresa de tecnologia focada em desenvolver software para empresas que querem digitalizar
              processos, fortalecer a presença digital e construir soluções que acompanhem o crescimento do negócio.
            </p>
            <p>
              Trabalhamos de ponta a ponta — estratégia, design, desenvolvimento, infraestrutura e evolução — com arquitetura
              bem planejada, código testado e atenção aos detalhes que fazem diferença para quem usa o produto todos os dias.
            </p>
          </Reveal>
        </div>
      </div>

      <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {companyValues.map((value, index) => (
          <Reveal as="li" key={value.title} delay={(index % 4) * 60} className="group bg-bg p-6 transition-colors duration-300 hover:bg-surface sm:p-7">
            <Icon name={value.icon} size={22} className="text-brand-soft transition-transform duration-300 group-hover:-translate-y-0.5" />
            <h3 className="mt-5 text-base font-semibold text-fg">{value.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
          </Reveal>
        ))}
        <li className="hidden bg-[radial-gradient(80%_80%_at_20%_20%,rgb(var(--brand)/0.18),transparent)] bg-bg p-7 lg:flex lg:items-end">
          <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.16em] text-brand-soft">
            Tecnologia + confiança
            <br />+ capacidade técnica
          </p>
        </li>
      </ul>
    </Section>
  );
}
