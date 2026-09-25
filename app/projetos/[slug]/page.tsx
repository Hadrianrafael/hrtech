import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectTags } from '@/components/projects/ProjectMeta';
import { ProjectVisual } from '@/components/projects/ProjectVisual';
import { CtaBand } from '@/components/sections/CtaBand';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { BrowserFrame } from '@/components/ui/DeviceFrames';
import { Reveal } from '@/components/ui/Reveal';
import { siteConfig } from '@/config/site';
import { getProject, projects } from '@/data/projects';
import { absoluteUrl, asset } from '@/lib/paths';
import { buildMetadata, organizationId } from '@/lib/seo';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return buildMetadata({
    title: `${project.name} — ${project.tagline}`,
    description: project.summary,
    path: `/projetos/${project.slug}/`,
    image: project.cover?.src.replace('.webp', '.webp'),
  });
}

function Pending({ children = 'A confirmar' }: { children?: ReactNode }) {
  return <span className="placeholder-note">{children}</span>;
}

function Block({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <Reveal className="grid gap-4 border-t border-line/[0.08] py-10 lg:grid-cols-12 lg:gap-10 lg:py-14">
      <div className="lg:col-span-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-soft">{label}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      </div>
      <div className="text-[15px] leading-relaxed text-muted sm:text-base lg:col-span-8">{children}</div>
    </Reveal>
  );
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const path = `/projetos/${project.slug}/`;
  const others = projects.filter((item) => item.slug !== project.slug).slice(0, 2);
  const desktopShots = project.gallery.filter((image) => image.frame === 'desktop');
  const mobileShots = project.gallery.filter((image) => image.frame === 'mobile');

  const facts: { label: string; value: ReactNode }[] = [
    { label: 'Cliente', value: project.client ?? <Pending /> },
    { label: 'Segmento', value: project.segment },
    { label: 'Ano', value: project.year ?? <Pending /> },
    { label: 'Status', value: project.status },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.name,
          description: project.summary,
          url: absoluteUrl(siteConfig.url, path),
          creator: { '@id': organizationId },
          keywords: project.technologies.join(', '),
          ...(project.cover ? { image: absoluteUrl(siteConfig.url, project.cover.src) } : {}),
        }}
      />
      <PageHeader
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Projetos', path: '/projetos/' },
          { name: project.name, path },
        ]}
        eyebrow={<ProjectTags project={project} />}
        title={project.name}
        description={project.summary}
      >
        <div className="hero-in mt-8 flex flex-wrap gap-3">
          {project.links.live && (
            <ButtonLink href={project.links.live} external size="lg" aria-label={`Visitar ${project.name} (abre em nova aba)`}>
              Visitar projeto
              <Icon name="arrowUpRight" size={16} />
            </ButtonLink>
          )}
          <ButtonLink href="/#contato" size="lg" variant={project.links.live ? 'secondary' : 'primary'}>
            Quero um projeto assim
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="pb-8">
        <div className="container">
          <Reveal>
            <ProjectVisual project={project} priority sizes="(min-width: 1240px) 1180px, 100vw" />
          </Reveal>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-bg p-5 sm:p-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">{fact.label}</dt>
                <dd className="mt-2 text-[15px] font-medium text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {project.notice && (
            <p className="mt-6 flex items-start gap-2.5 text-sm text-subtle">
              <Icon name="info" size={16} className="mt-0.5 shrink-0" />
              {project.notice}
            </p>
          )}
        </div>
      </section>

      <section className="pb-12 pt-10">
        <div className="container">
          <Block label="01" title="Desafio">
            <p>{project.challenge}</p>
          </Block>
          <Block label="02" title="Solução">
            <p>{project.solution}</p>
          </Block>
          <Block label="03" title="Funcionalidades">
            <ul className="grid gap-3 sm:grid-cols-2">
              {project.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 rounded-xl border border-line/[0.07] bg-surface/50 px-4 py-3 text-sm text-fg/90">
                  <Icon name="check" size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-brand-soft" />
                  {feature}
                </li>
              ))}
            </ul>
          </Block>
          <Block label="04" title="Tecnologias">
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <li key={tech} className="rounded-lg border border-line/[0.1] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-muted">
                  {tech}
                </li>
              ))}
            </ul>
          </Block>
          <Block label="05" title="Galeria">
            {project.gallery.length > 0 ? (
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {desktopShots.map((image) => (
                    <BrowserFrame key={image.src} src={image.src} alt={image.alt} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
                  ))}
                </div>
                {mobileShots.length > 0 && (
                  <div className="flex flex-wrap gap-5">
                    {mobileShots.map((image) => (
                      <div key={image.src} className="relative w-40 overflow-hidden rounded-[1.6rem] border border-line/[0.14] bg-elevated p-1.5 sm:w-48">
                        <div className="relative aspect-[390/844] overflow-hidden rounded-[1.25rem]">
                          <Image src={asset(image.src)} alt={image.alt} fill sizes="192px" className="object-cover object-top" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p>
                <Pending>Galeria em preparação</Pending>
                <span className="mt-3 block">As capturas de tela deste projeto serão publicadas em breve.</span>
              </p>
            )}
          </Block>
          <Block label="06" title="Resultado">
            {project.result ? <p>{project.result}</p> : (
              <p>
                <Pending>Resultado a confirmar</Pending>
                <span className="mt-3 block">Os resultados deste projeto serão publicados assim que houver dados confirmados.</span>
              </p>
            )}
          </Block>
          {project.links.live && (
            <Block label="07" title="Visitar projeto">
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 break-all text-brand-soft underline-offset-4 hover:underline"
              >
                {project.links.live.replace(/^https?:\/\//, '')}
                <Icon name="arrowUpRight" size={16} className="shrink-0" />
              </a>
            </Block>
          )}
        </div>
      </section>

      <section className="border-t border-line/[0.06] bg-surface/30 py-20 lg:py-24">
        <div className="container">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Outros projetos</h2>
            <Link href="/projetos/" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-soft">
              Ver todos
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {others.map((item) => (
              <li key={item.slug}>
                <ProjectCard project={item} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="pt-20 lg:pt-24">
        <CtaBand />
      </div>
    </>
  );
}
