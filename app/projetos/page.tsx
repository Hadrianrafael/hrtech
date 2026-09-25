import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { CtaBand } from '@/components/sections/CtaBand';
import { projects } from '@/data/projects';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Projetos',
  description: 'Portfólio da HR Tech Sistemas: sites, sistemas web e plataformas SaaS desenvolvidos com Next.js, React, Node.js, Python e cloud.',
  path: '/projetos/',
});

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Projetos', path: '/projetos/' },
        ]}
        eyebrow={<p className="eyebrow">Portfólio</p>}
        title="Projetos que transformam ideias em produtos digitais."
        description="Cada projeto tem um case com o desafio, a solução, as funcionalidades e as tecnologias utilizadas."
      />
      <section className="pb-24 lg:pb-32">
        <div className="container">
          <ProjectGrid projects={projects} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
