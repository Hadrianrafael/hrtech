import * as React from 'react';
import {
  IconBrandNextjs,
  IconBrandTypescript,
  IconBrandTailwind,
  IconBrandDocker,
  IconBrandNodejs,
  IconDatabase,
  IconBrandAzure,
  IconArrowRight,
  IconInfoCircle,
  IconWorld,
  IconRotate3d,
} from '@tabler/icons-react';
import { Button, Reveal, Container, Section, Breadcrumb, Tabs, ProjectCard } from '@hrtech/ui';
import { TiltCard } from '@/components/TiltCard';
import { LegalProductMockup } from '@/components/legal/LegalProductMockup';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata(
  'Portfólio',
  'Projetos, metodologia, arquitetura e tecnologias por trás das entregas da HR Tech.',
  '/portfolio',
);

const stackGroups = [
  {
    category: 'Frontend',
    items: [
      { icon: IconBrandNextjs, label: 'Next.js' },
      { icon: IconBrandTypescript, label: 'TypeScript' },
      { icon: IconBrandTailwind, label: 'Tailwind CSS' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { icon: IconBrandNodejs, label: 'NestJS' },
      { icon: IconDatabase, label: 'PostgreSQL / Prisma' },
    ],
  },
  {
    category: 'Infraestrutura',
    items: [
      { icon: IconBrandDocker, label: 'Docker' },
      { icon: IconBrandAzure, label: 'Azure Container Apps' },
    ],
  },
];

const methodologyContent = (
  <div className="divide-y divide-border border-t border-border">
    {[
      { title: 'Descoberta e escopo', description: 'Mapeamento do processo real antes de qualquer decisão técnica.' },
      { title: 'Arquitetura primeiro', description: 'Base técnica definida e documentada antes da primeira tela.' },
      { title: 'Desenvolvimento iterativo', description: 'Entregas incrementais, testadas e revisadas continuamente.' },
      { title: 'Evolução contínua', description: 'Acompanhamento pós-entrega e evolução junto ao negócio.' },
    ].map((item) => (
      <div key={item.title} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
        <h3 className="text-sm font-medium text-ink sm:w-56 sm:shrink-0">{item.title}</h3>
        <p className="text-sm leading-relaxed text-ink/50">{item.description}</p>
      </div>
    ))}
  </div>
);

const architectureContent = (
  <div className="space-y-4 text-sm leading-relaxed text-ink/60">
    <p>
      Cada sistema é construído em Clean Architecture — separando domínio, aplicação, infraestrutura e
      apresentação — para que regras de negócio nunca fiquem acopladas a frameworks ou detalhes técnicos.
    </p>
    <p>
      Monorepos organizados com Turborepo permitem compartilhar tipos, configuração e Design System entre
      front-end e back-end, mantendo consistência entre todos os produtos da HR Tech.
    </p>
    <p>
      Segurança é tratada desde o primeiro commit: validação de entrada, cabeçalhos HTTP seguros, controle de
      taxa de requisições e logs estruturados fazem parte da base de todo projeto, não uma etapa posterior.
    </p>
  </div>
);

const designSystemContent = (
  <div className="space-y-4 text-sm leading-relaxed text-ink/60">
    <p>
      Um Design System próprio — tokens de cor, tipografia, espaçamento e componentes reutilizáveis — garante que
      todo produto da HR Tech tenha a mesma identidade visual e qualidade de interação, independente da equipe ou
      do prazo.
    </p>
    <p>
      Este próprio site institucional é construído inteiramente sobre esse Design System: os componentes que você
      está vendo agora são os mesmos que sustentam as futuras plataformas SaaS da empresa.
    </p>
  </div>
);

const stackContent = (
  <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
    {stackGroups.map((group) => (
      <div key={group.category}>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink/35">{group.category}</span>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          {group.items.map((tech) => (
            <div key={tech.label} className="flex items-center gap-2.5">
              <tech.icon size={17} className="shrink-0 text-ink/45" />
              <span className="text-sm text-ink/65">{tech.label}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function PortfolioPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Portfólio' }]} />
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Projetos reais, não uma lista de clientes.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              O portfólio da HR Tech mostra como pensamos, arquitetamos e construímos software — através dos
              próprios produtos que estamos desenvolvendo.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Projetos */}
      <Section className="bg-dark-bg">
        <Container>
          <div className="flex flex-col gap-20">
            {/* HR Tech institucional */}
            <Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2">
                  <IconWorld size={16} className="text-brand-orange" />
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                    Site institucional — no ar
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  HR Tech — plataforma institucional
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  Este mesmo site: Design System próprio, arquitetura em monorepo, composição 3D e animação
                  aplicadas com propósito, não como decoração.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
                  {['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'React Three Fiber'].map((tag, i) => (
                    <React.Fragment key={tag}>
                      {i > 0 && <span className="text-white/20">·</span>}
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/40">{tag}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-7">
                <TiltCard strength={4}>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-white/10 bg-dark-surface">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(90% 90% at 15% 10%, rgba(233,32,52,0.28) 0%, rgba(255,135,31,0.10) 45%, transparent 75%)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-5xl font-semibold tracking-[-0.03em] text-transparent bg-clip-text sm:text-6xl"
                        style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
                      >
                        HR Tech
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-white/10 bg-black/40 px-4 py-2.5">
                      <span className="h-2 w-2 rounded-full bg-brand-orange" />
                      <span className="text-[11px] text-white/40">hrtechsistemas.com.br</span>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </Reveal>

            {/* Legal Tech — projeto principal do portfólio */}
            <Reveal delay={0.08} className="border-t border-dark-border pt-16">
              <ProjectCard
                eyebrow="Projeto principal"
                title="Legal Tech"
                status="Em desenvolvimento"
                description="Solução tecnológica para escritórios de advocacia — gestão de processos, clientes, documentos e financeiro com Inteligência Artificial aplicada ao fluxo jurídico."
                href="/solucoes/juridico"
                ctaLabel="Conhecer o Legal Tech"
                visual={<LegalProductMockup />}
              />
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mt-16 flex items-start gap-3 border-t border-dark-border pt-10">
            <IconRotate3d size={18} className="mt-0.5 shrink-0 text-brand-orange" />
            <p className="max-w-2xl text-sm leading-relaxed text-white/45">
              Novas verticais — construção civil, saúde, logística, imobiliário e outras — entram aqui assim que
              tiverem desenvolvimento real iniciado. Não representamos projetos de clientes como cases sem
              autorização.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Metodologia / Stack */}
      <Section>
        <Container>
          <Reveal>
            <Tabs
              items={[
                { value: 'metodologia', label: 'Metodologia', content: methodologyContent },
                { value: 'arquitetura', label: 'Arquitetura', content: architectureContent },
                { value: 'design-system', label: 'Design System', content: designSystemContent },
                { value: 'stack', label: 'Tecnologias', content: stackContent },
              ]}
            />
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal delay={0.1} className="flex items-start gap-3 border-t border-border pt-8">
            <IconInfoCircle size={20} className="mt-0.5 shrink-0 text-brand-orange" />
            <p className="max-w-2xl text-sm leading-relaxed text-ink/50">
              Este site institucional é, hoje, a nossa principal demonstração pública: Design System próprio,
              arquitetura em monorepo e engenharia aplicada de ponta a ponta.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center border-t border-dark-border pt-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Quer ver esse padrão aplicado ao seu sistema?
            </h2>
            <div className="mt-8">
              <Button href="/contato" iconRight={<IconArrowRight size={16} />}>
                Solicitar Orçamento
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
