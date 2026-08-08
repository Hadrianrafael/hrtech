import type { Metadata } from 'next';
import { IconShieldCheck, IconArrowRight, IconTargetArrow, IconEye } from '@tabler/icons-react';
import { Button, Badge, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Quem é a HR Tech: uma empresa de engenharia de software focada em sistemas sob medida, SaaS e Inteligência Artificial.',
};

const process = [
  {
    step: '01',
    title: 'Descoberta',
    description: 'Entendemos o processo real do negócio antes de escrever a primeira linha de código.',
  },
  {
    step: '02',
    title: 'Arquitetura',
    description: 'Desenhamos a base técnica pensando em performance, segurança e crescimento futuro.',
  },
  {
    step: '03',
    title: 'Desenvolvimento',
    description: 'Construção iterativa, com testes e revisão contínua da qualidade do código.',
  },
  {
    step: '04',
    title: 'Entrega e Evolução',
    description: 'Publicação, acompanhamento e evolução do sistema junto com o crescimento do cliente.',
  },
];

const approach = [
  {
    title: 'Desenvolvimento sob medida',
    description: 'Cada sistema é desenhado para o processo real do cliente — nunca um template genérico adaptado à força.',
  },
  {
    title: 'Engenharia de software',
    description: 'Arquitetura limpa, código testado e padrões de qualidade que sustentam o sistema no longo prazo.',
  },
  {
    title: 'IA e automação',
    description: 'Inteligência Artificial aplicada onde realmente resolve um problema de negócio, não como modismo.',
  },
  {
    title: 'Segurança e escalabilidade',
    description: 'Sistemas construídos para crescer com segurança, desde a primeira versão em produção.',
  },
];

export default function SobrePage() {
  return (
    <>
      <Section size="lg" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
        <Container className="relative">
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sobre' }]} />
            <Badge variant="gradient" dot className="mt-6">
              Quem somos
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
              Uma empresa de engenharia de software, não uma agência.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
              A HR Tech constrói sistemas, plataformas SaaS e automações sob medida — com o mesmo rigor técnico de
              uma empresa de tecnologia de padrão internacional. Trabalhamos para empresas de diferentes portes
              que precisam de software especializado, não de soluções genéricas adaptadas à força.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-2.5">
                <IconTargetArrow size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Missão</span>
              </div>
              <p className="mt-4 text-xl font-medium leading-snug tracking-[-0.01em] text-white/85">
                Criar soluções de software que simplificam processos empresariais reais através de engenharia de
                qualidade, IA aplicada e automação.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="flex items-center gap-2.5">
                <IconEye size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Visão</span>
              </div>
              <p className="mt-4 text-xl font-medium leading-snug tracking-[-0.01em] text-white/85">
                Ser reconhecida como referência em desenvolvimento de sistemas e plataformas SaaS, combinando
                qualidade técnica com identidade de marca consistente em tudo que construímos.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

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
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Abordagem tecnológica</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Como pensamos cada sistema que construímos.
            </h2>
          </Reveal>
          <div className="mt-14 border-t border-border">
            {approach.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <div className="flex flex-col gap-2 border-b border-border py-7 sm:flex-row sm:items-baseline sm:gap-8">
                  <h3 className="text-base font-medium text-white sm:w-64 sm:shrink-0">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
            <IconShieldCheck size={28} className="text-brand-orange" />
            <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Confiabilidade é praticada, não apenas anunciada.
            </h2>
            <p className="mt-4 max-w-lg text-sm text-white/50">
              Nunca prometemos o que ainda não existe. Todo produto em desenvolvimento é apresentado como tal.
            </p>
            <div className="mt-8">
              <Button href="/contato" iconRight={<IconArrowRight size={16} />}>
                Fale com a gente
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
