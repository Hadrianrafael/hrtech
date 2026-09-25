import { ProjectFeature } from '@/components/projects/ProjectFeature';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { featuredProjects, projects } from '@/data/projects';

export function Projects() {
  return (
    <Section id="projetos" aria-labelledby="projetos-title" className="border-y border-line/[0.06] bg-surface/30">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="projetos-title"
          eyebrow="Portfólio"
          title="Projetos que transformam ideias em produtos digitais."
          description="Sites, sistemas e plataformas desenvolvidos pela HR Tech — cada um com o problema que resolve, a solução adotada e as tecnologias por trás."
        />
        <Reveal className="shrink-0">
          <ButtonLink href="/projetos/" variant="secondary">
            Ver todos os projetos ({projects.length})
            <Icon name="arrowRight" size={15} />
          </ButtonLink>
        </Reveal>
      </div>

      <div className="mt-14 flex flex-col gap-6 lg:gap-8">
        {featuredProjects.map((project, index) => (
          <ProjectFeature key={project.slug} project={project} index={index} />
        ))}
      </div>
    </Section>
  );
}
