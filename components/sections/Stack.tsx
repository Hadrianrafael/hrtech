import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TechBadge } from '@/components/ui/TechBadge';
import { getTechGroups } from '@/data/section-translations';
import { defaultLocale, type Locale } from '@/lib/i18n';

export function Stack({ locale = defaultLocale }: { locale?: Locale }) {
  const techGroups = getTechGroups(locale);
  const copy = {
    'en-US': ['Technology', 'Technologies we use', 'Established tools selected for each project’s performance, security and ease of evolution.'],
    'pt-BR': ['Stack', 'Tecnologias que utilizamos', 'Ferramentas consolidadas no mercado, escolhidas pelo que cada projeto precisa — desempenho, segurança e facilidade de evolução.'],
    es: ['Tecnología', 'Tecnologías que utilizamos', 'Herramientas consolidadas, elegidas según las necesidades de rendimiento, seguridad y evolución de cada proyecto.'],
  }[locale];
  return (
    <Section id="tecnologias" aria-labelledby="tecnologias-title" className="border-y border-line/[0.06] bg-surface/30">
      <SectionHeading
        id="tecnologias-title"
        eyebrow={copy[0]!}
        title={copy[1]!}
        description={copy[2]!}
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {techGroups.map((group, index) => (
          <Reveal key={group.title} delay={(index % 4) * 60} className="card flex flex-col p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold text-fg">{group.title}</h3>
              <span className="font-mono text-[11px] text-subtle">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-subtle">{group.description}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {group.items.map((tech) => (
                <li key={tech.name}>
                  <TechBadge tech={tech} />
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
