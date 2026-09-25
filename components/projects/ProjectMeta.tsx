import { Tag } from '@/components/ui/Tag';
import type { Project, ProjectStatus } from '@/data/projects';

const statusTone: Record<ProjectStatus, 'success' | 'brand' | 'warning'> = {
  Publicado: 'success',
  Protótipo: 'warning',
  'Em desenvolvimento': 'brand',
};

export function ProjectTags({ project, max }: { project: Project; max?: number }) {
  const categories = max ? project.categories.slice(0, max) : project.categories;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Tag tone={statusTone[project.status]}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {project.status}
      </Tag>
      {categories.map((category) => (
        <Tag key={category}>{category}</Tag>
      ))}
    </div>
  );
}
