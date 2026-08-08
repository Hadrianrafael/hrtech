import type { Metadata } from 'next';
import { IconArrowRight, IconTargetArrow, IconEye, IconCode } from '@tabler/icons-react';
import { Button, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Quem é a HR Tech: uma empresa de engenharia de software focada em sistemas sob medida, SaaS e Inteligência Artificial.',
};

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
      <Section size="lg">
        <Container>
          <Reveal>
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
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-2.5">
                <IconTargetArrow size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/40">Missão</span>
              </div>
              <p className="mt-4 text-xl font-medium leading-snug tracking-[-0.01em] text-ink/85">
                Criar soluções de software que simplificam processos empresariais reais através de engenharia de
                qualidade, IA aplicada e automação.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="flex items-center gap-2.5">
                <IconEye size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/40">Visão</span>
              </div>
              <p className="mt-4 text-xl font-medium leading-snug tracking-[-0.01em] text-ink/85">
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
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Abordagem tecnológica</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Como pensamos cada sistema que construímos.
            </h2>
          </Reveal>
          <div className="mt-14 border-t border-border">
            {approach.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <div className="flex flex-col gap-2 border-b border-border py-7 sm:flex-row sm:items-baseline sm:gap-8">
                  <h3 className="text-base font-medium text-ink sm:w-64 sm:shrink-0">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Fundador */}
      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Fundador</span>
              <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-md bg-surface-alt border border-border">
                <IconCode size={26} className="text-ink/40" />
              </div>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Hadrian Rafael
              </h2>
              <p className="mt-1 text-sm text-ink/45">Fundador da HR Tech</p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/60">
                À frente da HR Tech, atuo diretamente no desenvolvimento de sistemas, arquitetura de software e na
                definição técnica de cada produto que construímos. A visão da empresa nasceu da experiência prática
                de desenvolver software para negócios reais — e da convicção de que engenharia de qualidade é o que
                diferencia um sistema que dura de um que precisa ser refeito em dois anos.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/45">
                Este espaço será atualizado com mais detalhes sobre a trajetória e a visão por trás da HR Tech.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section size="lg" className="border-t border-border bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center text-center">
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
