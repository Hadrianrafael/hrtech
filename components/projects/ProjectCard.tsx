import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import type { Project } from '@/data/projects';
import { ProjectTags } from './ProjectMeta';
import { ProjectVisual } from './ProjectVisual';

/** Card vertical usado na listagem /projetos e em "outros projetos". */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card card-hover group relative flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <ProjectVisual project={project} showPhone={false} sizes="(min-width: 1024px) 560px, 100vw" />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-6">
        <ProjectTags project={project} max={2} />
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg">
          <Link href={`/projetos/${project.slug}/`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {project.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-brand-soft">{project.tagline}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>
        <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium text-fg">
          Ver case
          <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
