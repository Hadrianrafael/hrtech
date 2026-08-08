import type { Metadata } from 'next';
import { IconScale, IconArrowRight, IconBuildingWarehouse, IconStethoscope, IconHomeCog, IconTruck, IconPaw } from '@tabler/icons-react';
import { Badge, Button, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Soluções',
  description: 'Tecnologia para diferentes negócios — hoje em desenvolvimento: Legal Tech para escritórios de advocacia.',
};

const roadmap = [
  { icon: IconBuildingWarehouse, title: 'Construção Civil' },
  { icon: IconPaw, title: 'Veterinário' },
  { icon: IconTruck, title: 'Logística' },
  { icon: IconHomeCog, title: 'Imobiliário' },
  { icon: IconStethoscope, title: 'Saúde' },
];

export default function SolucoesPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Soluções' }]} />
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Um ecossistema de plataformas, um setor de cada vez.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              A HR Tech está construindo verticais de SaaS especializadas por setor. Preferimos entregar uma
              solução completa antes de anunciar a próxima.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Solução em destaque */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <IconScale size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                  Solução em destaque
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                Legal Tech — para escritórios de advocacia.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">
                Gestão de processos, clientes, agenda, documentos e financeiro em uma plataforma única, com
                Inteligência Artificial aplicada ao fluxo jurídico. A vertical mais avançada da HR Tech hoje —
                apresentada em profundidade como demonstração conceitual.
              </p>
            </div>
            <Button href="/solucoes/juridico" size="lg" iconRight={<IconArrowRight size={18} />} className="shrink-0">
              Conhecer a solução
            </Button>
          </Reveal>
        </Container>
      </Section>

      {/* Roadmap — honesto, sem fingir prontidão */}
      <Section>
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Roadmap</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Próximos setores no radar — ainda sem desenvolvimento iniciado.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/50">
              Estas verticais fazem parte da visão de longo prazo da HR Tech. Elas aparecem aqui para transparência
              sobre a direção da empresa, não como produtos disponíveis.
            </p>
          </Reveal>
          <div className="mt-12 border-t border-border">
            {roadmap.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <div className="flex items-center justify-between gap-4 border-b border-border py-6">
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className="shrink-0 text-ink/35" />
                    <h3 className="text-base font-medium text-ink/70">{item.title}</h3>
                  </div>
                  <Badge variant="outline">Roadmap</Badge>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center border-t border-dark-border pt-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Quer ser avisado quando um novo setor entrar em desenvolvimento?
            </h2>
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
