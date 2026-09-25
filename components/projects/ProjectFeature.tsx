import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import type { Project } from '@/data/projects';
import { cn } from '@/lib/cn';
import { ProjectTags } from './ProjectMeta';
import { ProjectVisual } from './ProjectVisual';

/** Card grande e horizontal usado na Home. */
export function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const reversed = index % 2 === 1;
  return (
    <Reveal as="article" className="card group relative overflow-hidden p-5 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_0%,rgb(var(--brand)/0.10),transparent)] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <div className={cn('relative grid items-center gap-10 lg:grid-cols-12 lg:gap-12')}>
        <div className={cn('lg:col-span-7', reversed && 'lg:order-2')}>
          <div className="transition-transform duration-500 group-hover:-translate-y-1">
            <ProjectVisual project={project} sizes="(min-width: 1024px) 640px, 100vw" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <ProjectTags project={project} max={3} />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            <Link href={`/projetos/${project.slug}/`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {project.name}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-brand-soft">{project.tagline}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{project.summary}</p>
          <p className="mt-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-subtle">
            {project.technologies.slice(0, 5).join(' · ')}
          </p>
          <div className="relative z-10 mt-7 flex flex-wrap gap-3">
            <ButtonLink href={`/projetos/${project.slug}/`} size="md">
              Conhecer o projeto
              <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </ButtonLink>
            {project.links.live && (
              <ButtonLink href={project.links.live} external size="md" variant="secondary" aria-label={`Ver ${project.name} online (abre em nova aba)`}>
                Ver online
                <Icon name="arrowUpRight" size={15} />
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
