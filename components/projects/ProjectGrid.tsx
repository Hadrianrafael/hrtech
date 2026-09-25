'use client';

import { useMemo, useState } from 'react';
import { projectCategories, type Project, type ProjectCategory } from '@/data/projects';
import { cn } from '@/lib/cn';
import { ProjectCard } from './ProjectCard';

type Filter = 'TODOS' | ProjectCategory;

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>('TODOS');

  // Só mostra filtros de categorias que têm pelo menos um projeto.
  const filters = useMemo<Filter[]>(
    () => ['TODOS', ...projectCategories.filter((category) => projects.some((project) => project.categories.includes(category)))],
    [projects],
  );
  const visible = filter === 'TODOS' ? projects : projects.filter((project) => project.categories.includes(filter));

  return (
    <>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar projetos por categoria">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {filters.map((item) => {
            const count = item === 'TODOS' ? projects.length : projects.filter((project) => project.categories.includes(item)).length;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                  filter === item ? 'border-brand/50 bg-brand/15 text-fg' : 'border-line/[0.1] text-muted hover:border-line/[0.22] hover:text-fg',
                )}
              >
                {item}
                <span className="text-subtle">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} projeto(s) exibido(s)
      </p>
      <ul className="mt-10 grid gap-5 md:grid-cols-2">
        {visible.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </>
  );
}
