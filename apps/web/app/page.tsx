import { IconArrowRight, IconScale } from '@tabler/icons-react';
import { Button, Reveal, Container, Section } from '@hrtech/ui';
import { Hero } from '@/components/Hero';

const capabilities = [
  { n: '01', title: 'Sistemas personalizados', description: 'Software sob medida para o processo real da sua empresa.' },
  { n: '02', title: 'Plataformas SaaS', description: 'Produtos multi-tenant, do protótipo à operação em produção.' },
  { n: '03', title: 'Automação', description: 'Eliminação de tarefas manuais com automações confiáveis.' },
  { n: '04', title: 'Inteligência Artificial', description: 'IA aplicada a processos reais de negócio.' },
  { n: '05', title: 'Websites e Landing Pages', description: 'Presença digital profissional, rápida e bem construída.' },
  { n: '06', title: 'Integrações e APIs', description: 'Conectando sistemas internos e serviços de terceiros.' },
];

const process = [
  { n: '01', title: 'Descoberta' },
  { n: '02', title: 'Estratégia' },
  { n: '03', title: 'Design' },
  { n: '04', title: 'Desenvolvimento' },
  { n: '05', title: 'Testes' },
  { n: '06', title: 'Lançamento' },
  { n: '07', title: 'Evolução' },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Tecnologia que transforma ideias em sistemas */}
      <Section className="border-b border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Quem somos</span>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Tecnologia que transforma ideias em sistemas.
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <p className="max-w-2xl text-lg leading-relaxed text-ink/60">
                A HR Tech desenvolve soluções digitais para empresas que precisam automatizar processos, melhorar
                operações e criar novas experiências digitais. Não somos uma agência de marketing — somos uma
                empresa de engenharia de software.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/45">
                Sistemas personalizados, SaaS, automação, Inteligência Artificial, websites profissionais,
                integrações, APIs e aplicações web — sempre construídos sob medida, nunca adaptados à força.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* O que a HR Tech desenvolve — seção de contraste em preto */}
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
                Estamos desenvolvendo uma nova geração de tecnologia para escritórios de advocacia.
              </h2>
            </div>
            <Button href="/solucoes/juridico" variant="outline" size="lg" iconRight={<IconArrowRight size={16} />}>
              Conhecer solução jurídica
            </Button>
          </Reveal>
        </Container>
      </Section>

      {/* Como trabalhamos */}
      <Section className="border-b border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Como trabalhamos</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Um processo de engenharia, do início ao fim.
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
            {process.map((item, index) => (
              <Reveal key={item.n} delay={index * 0.03} className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-brand-orange">{item.n}</span>
                <span className="text-sm text-ink/65">{item.title}</span>
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
                Falar com a HR Tech
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
