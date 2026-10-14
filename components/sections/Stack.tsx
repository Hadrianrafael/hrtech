import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TechBadge } from '@/components/ui/TechBadge';
import { getDictionary } from '@/content';
import { techGroups } from '@/data/technologies';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor } from '@/lib/i18n/routes';

export function Stack({ locale }: { locale: Locale }) {
  const { stack } = getDictionary(locale);
  return (
    <Section id={homeAnchor(locale, 'technologies')} aria-labelledby="technologies-title" className="border-y border-line/[0.06] bg-surface/30">
      <SectionHeading id="technologies-title" eyebrow={stack.eyebrow} title={stack.title} description={stack.description} />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {techGroups.map((group, index) => {
          const text = stack.groups[index];
          return (
            <Reveal key={group.id} delay={(index % 4) * 60} className="card flex flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-fg">{text?.title ?? group.id}</h3>
                <span className="font-mono text-[11px] text-subtle">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-subtle">{text?.text}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {group.items.map((tech) => (
                  <li key={tech.name}>
                    <TechBadge tech={{ ...tech, name: stack.itemLabels[tech.name] ?? tech.name }} />
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
