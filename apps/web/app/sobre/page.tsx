import type { Metadata } from 'next';
import {
  IconSearch,
  IconRuler2,
  IconCode,
  IconRocket,
  IconShieldCheck,
  IconArrowRight,
  IconTargetArrow,
  IconEye,
} from '@tabler/icons-react';
import { Button, Badge, Card, SectionHeading, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Quem é a HR Tech: uma empresa de engenharia de software focada em sistemas sob medida, SaaS e Inteligência Artificial.',
};

const process = [
  {
    icon: IconSearch,
    step: '01',
    title: 'Descoberta',
    description: 'Entendemos o processo real do negócio antes de escrever a primeira linha de código.',
  },
  {
    icon: IconRuler2,
    step: '02',
    title: 'Arquitetura',
    description: 'Desenhamos a base técnica pensando em performance, segurança e crescimento futuro.',
  },
  {
    icon: IconCode,
    step: '03',
    title: 'Desenvolvimento',
    description: 'Construção iterativa, com testes e revisão contínua da qualidade do código.',
  },
  {
    icon: IconRocket,
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal>
              <Card padding="lg" className="h-full">
                <IconTargetArrow size={26} className="text-brand-orange" />
                <h2 className="mt-4 text-xl font-semibold text-white">Missão</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Criar soluções de software que simplificam processos empresariais reais através de engenharia
                  de qualidade, IA aplicada e automação.
                </p>
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card padding="lg" className="h-full">
                <IconEye size={26} className="text-brand-orange" />
                <h2 className="mt-4 text-xl font-semibold text-white">Visão</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Ser reconhecida como uma referência em desenvolvimento de sistemas e plataformas SaaS,
                  combinando qualidade técnica com identidade de marca consistente em tudo que construímos.
                </p>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Como trabalhamos"
            title="Um processo de desenvolvimento previsível, do início ao fim."
          />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.06}>
                <div className="relative rounded-2xl border border-border bg-surface p-6">
                  <span className="text-xs font-semibold tracking-widest text-white/25">{item.step}</span>
                  <item.icon size={24} className="mt-4 text-brand-orange" />
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Abordagem tecnológica" title="Como pensamos cada sistema que construímos." />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {approach.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <Card padding="lg" hoverable className="h-full">
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-16 text-center">
            <IconShieldCheck size={32} className="text-brand-orange" />
            <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
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
