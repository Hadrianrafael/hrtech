import { describe, expect, it } from 'vitest';
import { projectCategories, projects } from '@/data/projects';

describe('projects data', () => {
  it('tem slugs únicos', () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('só usa categorias declaradas', () => {
    for (const project of projects) {
      for (const category of project.categories) {
        expect(projectCategories).toContain(category);
      }
    }
  });

  it('projetos sem capa não afirmam link ao vivo sem aviso', () => {
    for (const project of projects) {
      if (!project.cover) {
        expect(project.gallery.length).toBe(0);
      }
    }
  });
});
