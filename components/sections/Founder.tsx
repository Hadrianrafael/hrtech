import Image from 'next/image';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import { founder } from '@/data/company';
import { asset } from '@/lib/paths';

export function Founder() {
  return (
    <Section id="fundador" aria-labelledby="fundador-title" className="pt-0 sm:pt-0 lg:pt-0">
      <Reveal className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_0%_100%,rgb(var(--brand)/0.14),transparent)]" />
        <div className="relative grid lg:grid-cols-12">
          <div className="relative min-h-[320px] overflow-hidden border-b border-line/[0.08] sm:min-h-[400px] lg:col-span-5 lg:border-b-0 lg:border-r">
            <Image
              src={asset(founder.photo)}
              alt={`${founder.name}, fundador da HR Tech Sistemas`}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover object-[60%_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-soft">Fundador</p>
              <p className="mt-1 text-lg font-semibold text-fg">{founder.shortName}</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:col-span-7 lg:p-12">
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-soft/60" aria-hidden="true" />
              Quem está por trás da HR Tech
            </p>
            <h2 id="fundador-title" className="mt-5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {founder.name}
            </h2>
            <p className="mt-2 text-sm text-brand-soft">{founder.role}</p>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
              {founder.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Atuação</h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {founder.areas.map((area) => (
                <li key={area} className="flex items-center gap-2.5 text-sm text-fg/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                  {area}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Tecnologias</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {founder.skills.map((skill) => (
                <li key={skill} className="rounded-md border border-line/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[11.5px] text-muted">
                  {skill}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              {siteConfig.social.github && (
                <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line/[0.12] px-4 py-2 text-sm text-muted transition-colors hover:border-line/[0.25] hover:text-fg">
                  <BrandIcon name="github" size={16} />
                  GitHub
                </a>
              )}
              {siteConfig.social.linkedin ? (
                <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line/[0.12] px-4 py-2 text-sm text-muted transition-colors hover:border-line/[0.25] hover:text-fg">
                  <BrandIcon name="linkedin" size={16} />
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
