import {
  IconCode,
  IconCloud,
  IconSparkles,
  IconBolt,
  IconChartBar,
  IconPlugConnected,
  IconArrowRight,
  IconBrandWhatsapp,
  IconScale,
  IconGitBranch,
  IconShieldCheck,
  IconMessageCircle,
} from '@tabler/icons-react';
import { Button, Badge, Reveal, Container, Section, MockupFrame, Skeleton } from '@hrtech/ui';
import { Hero } from '@/components/Hero';
import { siteConfig } from '@/lib/site-config';

const capabilities = [
  {
    icon: IconCode,
    title: 'Sistemas sob medida',
    description: 'Software desenhado para o processo real da sua empresa, não adaptado à força.',
  },
  {
    icon: IconCloud,
    title: 'Plataformas SaaS',
    description: 'Produtos multi-tenant, do primeiro protótipo à operação em produção.',
  },
  {
    icon: IconSparkles,
    title: 'Inteligência Artificial',
    description: 'IA aplicada a processos reais de negócio — não apenas um chatbot genérico.',
  },
  {
    icon: IconBolt,
    title: 'Automações',
    description: 'Eliminação de tarefas manuais e repetitivas com automações confiáveis.',
  },
  {
    icon: IconChartBar,
    title: 'Dashboards',
    description: 'Visualização de dados construída para decisão, não só para exibição.',
  },
  {
    icon: IconPlugConnected,
    title: 'APIs e Integrações',
    description: 'Conectando sistemas internos, parceiros e serviços de terceiros.',
  },
];

const process = [
  { step: '01', title: 'Descoberta', description: 'Mapeamos o processo real antes de qualquer decisão técnica.' },
  { step: '02', title: 'Arquitetura', description: 'A base técnica é definida antes da primeira tela.' },
  { step: '03', title: 'Desenvolvimento', description: 'Construção iterativa, testada e revisada continuamente.' },
  { step: '04', title: 'Evolução', description: 'Acompanhamento e evolução junto ao crescimento do negócio.' },
];

const differentials = [
  { icon: IconGitBranch, text: 'Arquitetura pensada para crescer' },
  { icon: IconShieldCheck, text: 'Segurança desde o primeiro commit' },
  { icon: IconMessageCircle, text: 'Comunicação direta, sem intermediários' },
];

const stack = ['Next.js', 'TypeScript', 'Tailwind CSS', 'NestJS', 'PostgreSQL', 'Docker', 'Azure'];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Quem é a HR Tech */}
      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Quem somos</span>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <p className="text-2xl font-medium leading-snug tracking-[-0.01em] text-white/90 sm:text-3xl md:text-4xl">
                A HR Tech é uma empresa de tecnologia — não uma agência. Trabalhamos na interseção entre{' '}
                <span className="text-white">engenharia de software</span>,{' '}
                <span className="text-white">tecnologia</span> e{' '}
                <span className="text-white">negócio</span>, construindo sistemas, SaaS, automação e IA para
                empresas que precisam de software especializado.
              </p>
              <div className="mt-8">
                <Button href="/sobre" variant="ghost" iconRight={<IconArrowRight size={16} />}>
                  Conhecer a HR Tech
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* O que desenvolvemos */}
      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">O que desenvolvemos</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Capacidades, não funcionalidades.
            </h2>
          </Reveal>

          <div className="mt-14 border-t border-border">
            {capabilities.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <div className="group flex flex-col gap-3 border-b border-border py-7 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
                    <item.icon size={20} className="text-brand-orange transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-white/50 sm:max-w-xl">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Tecnologia */}
      <Section size="sm" className="border-t border-border">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Tecnologia</span>
            </Reveal>
            <Reveal delay={0.06} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {stack.map((tech, i) => (
                <span key={tech} className="flex items-center gap-3">
                  <span className="text-sm text-white/45">{tech}</span>
                  {i < stack.length - 1 && <span className="h-1 w-1 rounded-full bg-white/15" />}
                </span>
              ))}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Soluções teaser */}
      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Soluções</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                Um ecossistema de plataformas, setor por setor.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Estamos construindo SaaS verticais especializados. A primeira solução em desenvolvimento é para
                escritórios de advocacia — outras nove verticais seguem no roadmap.
              </p>
              <div className="mt-6">
                <Button href="/solucoes" variant="ghost" iconRight={<IconArrowRight size={16} />}>
                  Ver todas as soluções
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <IconScale size={24} className="text-brand-orange" />
                  <div>
                    <span className="text-xs text-white/40">Em destaque</span>
                    <h3 className="text-lg font-semibold text-white">Soluções para Advocacia</h3>
                  </div>
                </div>
                <Button href="/solucoes/juridico" size="sm" variant="secondary" iconRight={<IconArrowRight size={14} />}>
                  Ver
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Solução Jurídica — mockup grande */}
      <Section className="border-t border-border">
        <Container>
          <Reveal>
            <MockupFrame label="app.hrtech.com.br/juridico — conceito">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                <div className="hidden flex-col gap-1 lg:flex">
                  {['Dashboard', 'Processos', 'Clientes', 'Agenda', 'Financeiro', 'Documentos'].map((label, i) => (
                    <div
                      key={label}
                      className={
                        'rounded-lg px-3 py-2.5 text-xs ' +
                        (i === 0 ? 'bg-brand-gradient-soft text-white' : 'text-white/45')
                      }
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Processos ativos', 'Prazos esta semana', 'Audiências hoje'].map((label) => (
                      <div key={label} className="rounded-xl border border-border bg-surface p-4">
                        <span className="text-[11px] text-white/40">{label}</span>
                        <Skeleton className="mt-3 h-6 w-12" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                    <span className="text-[11px] text-white/40">Processos recentes</span>
                    <div className="mt-3 space-y-2.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </MockupFrame>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <Badge variant="outline">Apresentação conceitual — em desenvolvimento</Badge>
              <Button href="/solucoes/juridico" variant="ghost" iconRight={<IconArrowRight size={16} />}>
                Conhecer a solução completa
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Como trabalhamos */}
      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Como trabalhamos</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Um processo previsível, do início ao fim.
            </h2>
          </Reveal>

          <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-[13px] hidden h-px bg-border lg:block" aria-hidden />
            {process.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.08} className="relative">
                <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-0">
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-bg text-xs font-semibold text-brand-orange ring-1 ring-border lg:mb-4">
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/50 lg:pl-0">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Diferenciais */}
      <Section size="sm" className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col flex-wrap items-start gap-x-10 gap-y-5 sm:flex-row sm:items-center">
            {differentials.map((item) => (
              <div key={item.text} className="flex items-center gap-2.5">
                <item.icon size={16} className="text-brand-orange" />
                <span className="text-sm text-white/60">{item.text}</span>
              </div>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* CTA cinematográfico */}
      <Section size="lg" className="relative overflow-hidden border-t border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(233,32,52,0.10) 0%, rgba(255,135,31,0.10) 100%)' }}
          aria-hidden
        />
        <Container className="relative">
          <Reveal className="flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl md:text-5xl">
              Vamos construir o próximo sistema da sua empresa.
            </h2>
            <p className="mt-4 max-w-lg text-white/55">
              Conte o que você precisa — respondemos com um plano claro de como a HR Tech pode ajudar.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Solicitar Orçamento
              </Button>
              <Button href={siteConfig.whatsappHref} variant="ghost" size="lg" iconLeft={<IconBrandWhatsapp size={18} />}>
                Falar no WhatsApp
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
