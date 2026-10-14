import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { getDictionary } from '@/content';
import { valueIcons } from '@/data/catalog';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor } from '@/lib/i18n/routes';

export function About({ locale }: { locale: Locale }) {
  const { about } = getDictionary(locale);
  return (
    <Section id={homeAnchor(locale, 'about')} aria-labelledby="about-title">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-soft/60" aria-hidden="true" />
              {about.eyebrow}
            </p>
            <h2 id="about-title" className="mt-5 text-[2rem] font-semibold leading-[1.08] tracking-tightest text-fg sm:text-[2.6rem] lg:text-5xl">
              {about.titleStart}
              <span className="mt-1 block text-muted">{about.titleEnd}</span>
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-7 lg:pt-12">
          <Reveal className="space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
        </div>
      </div>

      <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {about.values.map((value, index) => (
          <Reveal as="li" key={value.title} delay={(index % 4) * 60} className="group bg-bg p-6 transition-colors duration-300 hover:bg-surface sm:p-7">
            <Icon name={valueIcons[index] ?? 'check'} size={22} className="text-brand-soft transition-transform duration-300 group-hover:-translate-y-0.5" />
            <h3 className="mt-5 text-base font-semibold text-fg">{value.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
          </Reveal>
        ))}
        <li className="hidden bg-[radial-gradient(80%_80%_at_20%_20%,rgb(var(--brand)/0.18),transparent)] bg-bg p-7 lg:flex lg:items-end">
          <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.16em] text-brand-soft">
            {about.tagline[0]}
            <br />
            {about.tagline[1]}
          </p>
        </li>
      </ul>

      <h3 className="sr-only">{about.facts.title}</h3>
      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {about.facts.items.map((item) => (
          <div key={item.title} className="bg-bg p-5 sm:p-6">
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">{item.title}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-fg/90">{item.text}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
