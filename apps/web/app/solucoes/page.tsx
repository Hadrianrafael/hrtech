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
import { Badge, Button, Card, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

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
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Roadmap</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Próximas soluções
            </h2>
            <p className="mt-3 text-sm text-white/50">Ainda em desenvolvimento — sem data de lançamento definida.</p>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-border pt-10">
            {upcoming.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.03} className="flex items-center gap-2.5 opacity-60">
                <item.icon size={18} className="text-white/50" />
                <span className="text-sm text-white/70">{item.label}</span>
                <IconLock size={12} className="text-white/25" />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
