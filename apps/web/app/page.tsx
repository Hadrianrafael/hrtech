import {
  IconArrowRight,
  IconScale,
  IconRuler2,
  IconStack2,
  IconLayoutGrid,
  IconBolt,
  IconSparkles,
  IconPlugConnected,
  IconTrendingUp,
  IconRefresh,
} from '@tabler/icons-react';
import { Button, Reveal, Container, Section } from '@hrtech/ui';
import { Hero } from '@/components/Hero';

const capabilities = [
  { n: '01', title: 'Sistemas personalizados', description: 'Software sob medida para o processo real da sua empresa.' },
  { n: '02', title: 'SaaS', description: 'Produtos multi-tenant, do protótipo à operação em produção.' },
  { n: '03', title: 'Automação', description: 'Eliminação de tarefas manuais com automações confiáveis.' },
  { n: '04', title: 'Inteligência Artificial', description: 'IA aplicada a processos reais de negócio.' },
  { n: '05', title: 'Aplicações Web', description: 'Aplicações web robustas, rápidas e construídas para durar.' },
  { n: '06', title: 'APIs e integrações', description: 'Conectando sistemas internos e serviços de terceiros.' },
  { n: '07', title: 'Websites e Landing Pages', description: 'Presença digital profissional, rápida e bem construída.' },
  { n: '08', title: 'Sistemas internos', description: 'Módulos sob medida para gestão, controle e operação.' },
];

const process = [
  { n: '01', title: 'Descoberta' },
  { n: '02', title: 'Estratégia' },
  { n: '03', title: 'UX/UI' },
  { n: '04', title: 'Desenvolvimento' },
  { n: '05', title: 'Integrações' },
  { n: '06', title: 'Testes' },
  { n: '07', title: 'Lançamento' },
  { n: '08', title: 'Evolução' },
];

const problems = [
  'Planilhas espalhadas',
  'Processos manuais',
  'Sistemas que não conversam',
  'Informações difíceis de encontrar',
  'Tarefas repetitivas',
  'Falta de indicadores',
  'Processos dependentes de pessoas específicas',
  'Ferramentas que não acompanham o crescimento',
];

const before = ['Planilhas', 'Processos manuais', 'Sistemas desconectados', 'Informações espalhadas'];
const hrTechPillars = ['Engenharia', 'Automação', 'Integração', 'IA'];
const after = ['Processos organizados', 'Dados centralizados', 'Automação', 'Indicadores', 'Escalabilidade'];

const differentiators = [
  { n: '01', icon: IconRuler2, title: 'Tecnologia sob medida' },
  { n: '02', icon: IconStack2, title: 'Arquitetura moderna' },
  { n: '03', icon: IconLayoutGrid, title: 'UX/UI' },
  { n: '04', icon: IconBolt, title: 'Automação inteligente' },
  { n: '05', icon: IconSparkles, title: 'IA aplicada' },
  { n: '06', icon: IconPlugConnected, title: 'Integrações' },
  { n: '07', icon: IconTrendingUp, title: 'Escalabilidade' },
  { n: '08', icon: IconRefresh, title: 'Evolução contínua' },
];

const techGroups = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript'] },
  { category: 'Backend', items: ['Node.js', 'NestJS', 'Python', 'FastAPI'] },
  { category: 'Banco de dados', items: ['PostgreSQL', 'MongoDB'] },
  { category: 'Cloud', items: ['Azure', 'Docker', 'GitHub'] },
  { category: 'IA e automação', items: ['APIs de IA', 'Automação', 'Integrações'] },
];

const benefits = ['Produtividade', 'Automação', 'Centralização', 'Organização', 'Inteligência Artificial', 'Indicadores', 'Escalabilidade'];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Quem somos */}
      <Section className="border-b border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Quem somos</span>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Construímos tecnologia para negócios que querem evoluir.
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <p className="max-w-2xl text-lg leading-relaxed text-ink/60">
                A HR Tech desenvolve sistemas, SaaS, automações e soluções digitais sob medida para transformar
                necessidades empresariais em tecnologia. Não somos uma agência de marketing — somos uma empresa de
                engenharia de software.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/45">
                Engenharia, inovação, UX/UI, automação, IA e escalabilidade — sempre construídos sob medida, nunca
                adaptados à força.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Problemas */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Diagnóstico</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Seu negócio ainda depende de processos manuais?
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-2 border-t border-dark-border sm:grid-cols-2">
            {problems.map((problem, index) => (
              <Reveal key={problem} delay={index * 0.03}>
                <div className="flex items-baseline gap-4 border-b border-dark-border py-5">
                  <span className="font-mono text-xs text-white/25">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-sm text-white/60">{problem}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="mt-10">
            <p
              className="text-xl font-semibold tracking-[-0.01em] bg-clip-text text-transparent sm:text-2xl"
              style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
            >
              É aqui que a HR Tech entra.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Transformação */}
      <Section className="border-b border-border">
        <Container>
          <Reveal className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Transformação</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Da operação manual à tecnologia sob medida.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink/35">Antes</span>
              <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                {before.map((item) => (
                  <li key={item} className="text-sm text-ink/55">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="hidden items-center justify-center text-ink/20 lg:flex">
              <IconArrowRight size={20} />
            </div>
            <Reveal delay={0.08} className="rounded-md bg-dark-bg p-6">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-brand-orange">HR Tech</span>
              <ul className="mt-4 flex flex-col gap-3 border-t border-dark-border pt-4">
                {hrTechPillars.map((item) => (
                  <li key={item} className="text-sm font-medium text-white">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="hidden items-center justify-center text-ink/20 lg:flex">
              <IconArrowRight size={20} />
            </div>
            <Reveal delay={0.16}>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink/35">Depois</span>
              <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                {after.map((item) => (
                  <li key={item} className="text-sm text-ink/75">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* O que a HR Tech desenvolve */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
              O que a HR Tech desenvolve
            </span>
          </Reveal>
          <div className="mt-10 border-t border-dark-border">
            {capabilities.map((item, index) => (
              <Reveal key={item.n} delay={index * 0.03}>
                <div className="flex flex-col gap-2 border-b border-dark-border py-7 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="font-mono text-sm text-white/30 sm:w-10 sm:shrink-0">{item.n}</span>
                  <h3 className="text-lg font-medium text-white sm:w-72 sm:shrink-0">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Solução em destaque — apenas chamada, sem dashboard */}
      <Section className="border-b border-border">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <IconScale size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                  Legal Tech — em desenvolvimento
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Uma plataforma inteligente para gestão de escritórios de advocacia.
              </h2>
            </div>
            <Button href="/solucoes/juridico" variant="outline" size="lg" iconRight={<IconArrowRight size={16} />}>
              Conhecer o Legal Tech
            </Button>
          </Reveal>
        </Container>
      </Section>

      {/* Diferenciais */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Diferenciais</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Por que desenvolver com a HR Tech?
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-dark-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((item, index) => (
              <Reveal key={item.n} delay={(index % 4) * 0.05}>
                <span className="font-mono text-xs text-white/25">{item.n}</span>
                <item.icon size={20} className="mt-2 text-brand-orange" />
                <h3 className="mt-3 text-sm font-medium text-white">{item.title}</h3>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-12 border-t border-dark-border pt-8">
            <Button href="/contato" variant="secondary" iconRight={<IconArrowRight size={16} />}>
              Falar com especialista
            </Button>
          </Reveal>
        </Container>
      </Section>

      {/* Tecnologias */}
      <Section className="border-b border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Tecnologias</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Engenharia por trás das soluções.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-5">
            {techGroups.map((group, index) => (
              <Reveal key={group.category} delay={index * 0.05}>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink/35">{group.category}</span>
                <ul className="mt-4 flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-ink/65">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Como trabalhamos */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Como trabalhamos</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Um processo de engenharia, do início ao fim.
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
            {process.map((item, index) => (
              <Reveal key={item.n} delay={index * 0.03} className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-brand-orange">{item.n}</span>
                <span className="text-sm text-white/65">{item.title}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Benefícios */}
      <Section className="border-b border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Benefícios</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Mais tecnologia. Menos complexidade.
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-3">
            {benefits.map((benefit, index) => (
              <Reveal key={benefit} delay={index * 0.03}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink/70">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
                  />
                  {benefit}
                </span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA final — seção de contraste em preto */}
      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Tem um problema que pode ser resolvido com tecnologia?
            </h2>
            <p className="mt-4 max-w-lg text-white/50">
              Conte o que você precisa — respondemos com um plano claro de como a HR Tech pode ajudar.
            </p>
            <div className="mt-10">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Solicitar contato
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
