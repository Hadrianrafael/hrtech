import type { Metadata } from 'next';
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
} from '@tabler/icons-react';
import { Badge, Button, Reveal, Container, Section, Breadcrumb, Tabs } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Portfólio',
  description: 'Metodologia, arquitetura, Design System e tecnologias por trás das entregas da HR Tech.',
};

const stack = [
  { icon: IconBrandNextjs, label: 'Next.js' },
  { icon: IconBrandTypescript, label: 'TypeScript' },
  { icon: IconBrandTailwind, label: 'Tailwind CSS' },
  { icon: IconBrandNodejs, label: 'NestJS' },
  { icon: IconDatabase, label: 'PostgreSQL / Prisma' },
  { icon: IconBrandDocker, label: 'Docker' },
  { icon: IconBrandAzure, label: 'Azure Container Apps' },
];

const methodologyContent = (
  <div className="divide-y divide-border border-t border-border">
    {[
      {
        title: 'Descoberta e escopo',
        description: 'Mapeamento do processo real antes de qualquer decisão técnica.',
      },
      {
        title: 'Arquitetura primeiro',
        description: 'Base técnica definida e documentada antes da primeira tela.',
      },
      {
        title: 'Desenvolvimento iterativo',
        description: 'Entregas incrementais, testadas e revisadas continuamente.',
      },
      {
        title: 'Evolução contínua',
        description: 'Acompanhamento pós-entrega e evolução junto ao negócio.',
      },
    ].map((item) => (
      <div key={item.title} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
        <h3 className="text-sm font-medium text-white sm:w-56 sm:shrink-0">{item.title}</h3>
        <p className="text-sm leading-relaxed text-white/50">{item.description}</p>
      </div>
    ))}
  </div>
);

const architectureContent = (
  <div className="space-y-4 text-sm leading-relaxed text-white/60">
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
  <div className="space-y-4 text-sm leading-relaxed text-white/60">
    <p>
      Um Design System próprio — tokens de cor, tipografia, espaçamento e componentes reutilizáveis — garante que
      todo produto da HR Tech tenha a mesma identidade visual e qualidade de interação, independente da equipe ou
      do prazo.
    </p>
    <p>
      Este próprio site institucional é construído inteiramente sobre esse Design System: os componentes que você
      está vendo agora (botões, cards, menus, formulários) são os mesmos que sustentam as futuras plataformas SaaS
      da empresa.
    </p>
  </div>
);

const stackContent = (
  <div className="flex flex-wrap gap-x-8 gap-y-4">
    {stack.map((tech) => (
      <div key={tech.label} className="flex items-center gap-2.5">
        <tech.icon size={18} className="text-white/50" />
        <span className="text-sm text-white/70">{tech.label}</span>
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
            <Badge variant="gradient" dot className="mt-6">
              Como construímos
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
              Metodologia, arquitetura e padrão de qualidade.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
              O portfólio da HR Tech não é uma lista de clientes — é a demonstração de como pensamos, arquitetamos
              e construímos software.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
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

      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Demonstrações</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Projetos de demonstração da HR Tech.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex items-start gap-3 border-t border-border pt-8">
            <IconInfoCircle size={20} className="mt-0.5 shrink-0 text-brand-orange" />
            <p className="max-w-2xl text-sm leading-relaxed text-white/50">
              Este site institucional é, hoje, a nossa principal demonstração pública: Design System próprio,
              arquitetura em monorepo e engenharia aplicada de ponta a ponta. Não representamos projetos de
              clientes como cases sem autorização — quando existirem, aparecerão aqui identificados como tal.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section size="lg" className="relative overflow-hidden border-t border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(233,32,52,0.10) 0%, rgba(255,135,31,0.10) 100%)' }}
          aria-hidden
        />
        <Container className="relative">
          <Reveal className="flex flex-col items-center text-center">
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
