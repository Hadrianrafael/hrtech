import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CtaBand } from '@/components/sections/CtaBand';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { siteConfig } from '@/config/site';
import { projects } from '@/data/projects';
import { getService, services } from '@/data/services';
import { absoluteUrl } from '@/lib/paths';
import { buildMetadata, organizationId } from '@/lib/seo';

type Params = { slug: string };

/** Mapeia cada solução para as categorias de projeto que a ilustram. */
const relatedCategories: Record<string, string[]> = {
  sites: ['SITE'],
  sistemas: ['SISTEMA'],
  saas: ['SAAS'],
  'inteligencia-artificial': ['INTELIGÊNCIA ARTIFICIAL'],
  automacoes: ['AUTOMAÇÃO'],
  'e-commerce': ['E-COMMERCE'],
  'cloud-infraestrutura': ['SAAS', 'SISTEMA'],
};

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return buildMetadata({ title: service.title, description: service.summary, path: `/solucoes/${service.slug}/` });
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const path = `/solucoes/${service.slug}/`;
  const wantedCategories = relatedCategories[service.slug] ?? [];
  const relatedProjects = projects.filter((project) => project.categories.some((category) => wantedCategories.includes(category)));
  const otherServices = services.filter((item) => item.slug !== service.slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.summary,
          url: absoluteUrl(siteConfig.url, path),
          provider: { '@id': organizationId },
          areaServed: 'BR',
        }}
      />
      <PageHeader
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Soluções', path: '/#solucoes' },
          { name: service.title, path },
        ]}
        eyebrow={
          <span className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/[0.1] bg-brand/10 text-brand-soft">
              <Icon name={service.icon} size={21} />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Solução {service.number}</span>
          </span>
        }
        title={service.title}
        description={service.intro}
      >
        <div className="hero-in mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/#contato" size="lg">
            Solicitar orçamento
            <Icon name="arrowRight" size={16} />
          </ButtonLink>
          <ButtonLink href="/projetos/" size="lg" variant="secondary">
            Ver projetos
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="pb-20 lg:pb-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="text-xl font-semibold tracking-tight text-fg">O que está incluído</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.capabilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-xl border border-line/[0.07] bg-surface/50 px-4 py-3 text-sm text-fg/90">
                      <Icon name="check" size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-brand-soft" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-14" delay={80}>
                <h2 className="text-xl font-semibold tracking-tight text-fg">Como entregamos</h2>
                <div className="mt-6 divide-y divide-line/[0.07] border-t border-line/[0.07]">
                  {service.approach.map((item) => (
                    <div key={item.title} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:gap-10">
                      <h3 className="text-sm font-medium text-fg sm:w-52 sm:shrink-0">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={120} className="card sticky top-24 p-6 sm:p-7">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Tecnologias</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {service.technologies.map((tech) => (
                    <li key={tech} className="rounded-lg border border-line/[0.1] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-muted">
                      {tech}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t border-line/[0.08] pt-6">
                  <p className="text-sm leading-relaxed text-muted">Quer conversar sobre um projeto de {service.title.toLowerCase()}?</p>
                  <ButtonLink href="/#contato" className="mt-4 w-full">
                    Falar com a HR Tech
                    <Icon name="arrowRight" size={15} />
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 && (
        <section className="border-t border-line/[0.06] bg-surface/30 py-20 lg:py-24">
          <div className="container">
            <div className="flex items-end justify-between gap-6">
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Projetos relacionados</h2>
              <Link href="/projetos/" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-soft">
                Ver todos
                <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {relatedProjects.slice(0, 2).map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Outras soluções</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {otherServices.map((item) => (
              <li key={item.slug}>
                <Link href={`/solucoes/${item.slug}/`} className="inline-flex items-center gap-2 rounded-full border border-line/[0.1] px-4 py-2 text-sm text-muted transition-colors hover:border-line/[0.25] hover:text-fg">
                  <Icon name={item.icon} size={15} />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
