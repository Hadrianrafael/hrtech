import * as React from 'react';
import {
  IconArrowRight,
  IconTargetArrow,
  IconEye,
  IconCode,
  IconSparkles,
  IconShieldLock,
} from '@tabler/icons-react';
import { Button, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';
import { TiltCard } from '@/components/TiltCard';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata(
  'Sobre',
  'Quem é a HR Tech: uma empresa de engenharia de software focada em sistemas sob medida, SaaS e Inteligência Artificial.',
  '/sobre',
);

const principles = [
  {
    icon: IconTargetArrow,
    title: 'Desenvolvimento sob medida',
    description: 'Cada sistema é desenhado para o processo real do cliente — nunca um template genérico adaptado à força.',
  },
  {
    icon: IconCode,
    title: 'Engenharia de software',
    description: 'Arquitetura limpa, código testado e padrões de qualidade que sustentam o sistema no longo prazo.',
  },
  {
    icon: IconSparkles,
    title: 'IA e automação',
    description: 'Inteligência Artificial aplicada onde realmente resolve um problema de negócio, não como modismo.',
  },
  {
    icon: IconShieldLock,
    title: 'Segurança e escalabilidade',
    description: 'Sistemas construídos para crescer com segurança, desde a primeira versão em produção.',
  },
];

const focusAreas = ['Arquitetura de software', 'Product engineering', 'Inteligência Artificial aplicada'];

export default function SobrePage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-9">
              <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sobre' }]} />
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
                Uma empresa de engenharia de software, não uma agência.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
                A HR Tech constrói sistemas, plataformas SaaS e automações sob medida — com o mesmo rigor técnico de
                uma empresa de tecnologia de padrão internacional. Trabalhamos para empresas de diferentes portes
                que precisam de software especializado, não de soluções genéricas adaptadas à força.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="hidden lg:col-span-3 lg:flex lg:items-start lg:justify-end">
              <div className="mt-2 h-full border-l border-border pl-6">
                <span className="block h-1.5 w-1.5 rounded-full bg-brand-orange" />
                <span className="mt-3 block font-mono text-xs uppercase tracking-[0.2em] text-ink/35">
                  Software house
                </span>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Quem somos — declaração institucional */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Quem somos</span>
            <p className="mt-5 text-2xl font-semibold leading-snug tracking-[-0.02em] text-white sm:text-3xl md:text-4xl">
              Nascemos para ser diferentes das agências que vendem promessas genéricas. Somos uma empresa de{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
              >
                engenharia
              </span>{' '}
              — cada sistema que entregamos carrega o mesmo rigor técnico, a mesma identidade e o mesmo padrão de
              qualidade.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-10 border-t border-dark-border pt-12 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-2.5">
                <IconTargetArrow size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Missão</span>
              </div>
              <p className="mt-4 text-lg font-medium leading-snug tracking-[-0.01em] text-white/85">
                Criar soluções de software que simplificam processos empresariais reais através de engenharia de
                qualidade, IA aplicada e automação.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="flex items-center gap-2.5">
                <IconEye size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Visão</span>
              </div>
              <p className="mt-4 text-lg font-medium leading-snug tracking-[-0.01em] text-white/85">
                Ser reconhecida como referência em desenvolvimento de sistemas e plataformas SaaS, combinando
                qualidade técnica com identidade de marca consistente em tudo que construímos.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Como pensamos cada sistema */}
      <Section>
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Abordagem tecnológica</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Como pensamos cada sistema que construímos.
            </h2>
          </Reveal>
          <div className="mt-14 border-t border-border">
            {principles.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <div className="flex flex-col gap-3 border-b border-border py-8 sm:flex-row sm:items-baseline sm:gap-8">
                  <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                    <item.icon size={18} className="shrink-0 text-brand-orange" />
                    <h3 className="text-base font-medium text-ink">{item.title}</h3>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-ink/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Fundador — momento premium */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Fundador</span>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-10">
            <Reveal delay={0.05} className="lg:col-span-5">
              <TiltCard className="mx-auto w-full max-w-sm lg:mx-0" strength={6}>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-white/10 bg-dark-surface">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(120% 120% at 18% 12%, rgba(233,32,52,0.32) 0%, rgba(255,135,31,0.10) 45%, transparent 72%)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[5.5rem] font-semibold tracking-tight text-white/10">HR</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Foto em breve</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                  </div>
                </div>
              </TiltCard>
            </Reveal>
            <Reveal delay={0.12} className="lg:col-span-7">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">Hadrian Rafael</h2>
              <p className="mt-1 text-sm text-white/45">Fundador da HR Tech</p>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65">
                À frente da HR Tech, atuo diretamente no desenvolvimento de sistemas, arquitetura de software e na
                definição técnica de cada produto que construímos. A visão da empresa nasceu da experiência prática
                de desenvolver software para negócios reais — e da convicção de que engenharia de qualidade é o
                que diferencia um sistema que dura de um que precisa ser refeito em dois anos.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dark-border pt-6">
                {focusAreas.map((area, index) => (
                  <React.Fragment key={area}>
                    {index > 0 && <span className="text-white/20">·</span>}
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/45">{area}</span>
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center border-t border-dark-border pt-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
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
