import type { Metadata } from 'next';
import {
  IconScale,
  IconBuildingSkyscraper,
  IconStethoscope,
  IconTruck,
  IconBuildingFactory2,
  IconHome2,
  IconShoppingBag,
  IconBed,
  IconPackage,
  IconBriefcase2,
  IconArrowRight,
  IconLock,
} from '@tabler/icons-react';
import { Badge, Button, Card, SectionHeading, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Soluções',
  description: 'Soluções SaaS verticais da HR Tech — hoje em destaque: Escritórios de Advocacia.',
};

const upcoming = [
  { icon: IconBuildingSkyscraper, label: 'Construção Civil' },
  { icon: IconStethoscope, label: 'Saúde' },
  { icon: IconTruck, label: 'Logística' },
  { icon: IconBuildingFactory2, label: 'Indústria' },
  { icon: IconHome2, label: 'Imobiliário' },
  { icon: IconShoppingBag, label: 'Varejo' },
  { icon: IconBed, label: 'Hotelaria' },
  { icon: IconPackage, label: 'Distribuição' },
  { icon: IconBriefcase2, label: 'Serviços Profissionais' },
];

export default function SolucoesPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Soluções' }]} />
            <Badge variant="gradient" dot className="mt-6">
              Soluções SaaS verticais
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
              Um ecossistema de plataformas, um setor de cada vez.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
              A HR Tech está construindo SaaS verticais especializados por setor. A primeira solução em
              desenvolvimento é para Escritórios de Advocacia — as demais estão no roadmap.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal>
            <Card
              padding="lg"
              hoverable
              glow
              className="group grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_auto]"
            >
              <div>
                <Badge variant="gradient" dot>
                  Em destaque
                </Badge>
                <div className="mt-4 flex items-center gap-3">
                  <IconScale size={26} className="text-brand-orange" />
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">Soluções para Advocacia</h2>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
                  Plataforma conceitual para gestão de processos, clientes, agenda, documentos e financeiro de
                  escritórios de advocacia — com Inteligência Artificial aplicada ao fluxo jurídico.
                </p>
              </div>
              <Button href="/solucoes/juridico" size="lg" iconRight={<IconArrowRight size={18} />}>
                Conhecer a solução
              </Button>
            </Card>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Roadmap" title="Próximas soluções" description="Ainda em desenvolvimento — sem data de lançamento definida." />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {upcoming.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.04}>
                <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 opacity-70">
                  <div className="flex w-full items-center justify-between">
                    <item.icon size={24} className="text-white/50" />
                    <IconLock size={14} className="text-white/25" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/80">{item.label}</h3>
                    <Badge variant="outline" className="mt-2">
                      Em desenvolvimento
                    </Badge>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
