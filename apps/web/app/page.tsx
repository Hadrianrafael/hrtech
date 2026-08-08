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
} from '@tabler/icons-react';
import { Button, Card, CardEyebrow, Badge, SectionHeading, Reveal, Container, Section, MockupFrame, Skeleton } from '@hrtech/ui';
import { HeroBackground } from '@/components/HeroBackground';
import { siteConfig } from '@/lib/site-config';

const services = [
  {
    icon: IconCode,
    title: 'Sistemas Personalizados',
    description: 'Software sob medida para processos que sistemas genéricos não resolvem.',
  },
  {
    icon: IconCloud,
    title: 'Plataformas SaaS',
    description: 'Produtos multi-tenant, escaláveis, do zero à primeira versão em produção.',
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
    description: 'Visualização de dados clara, rápida e construída para decisão.',
  },
  {
    icon: IconPlugConnected,
    title: 'APIs e Integrações',
    description: 'Conectando sistemas internos, parceiros e serviços de terceiros.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <HeroBackground />
        <Container className="relative pt-28 pb-24 md:pt-40 md:pb-32">
          <Reveal className="flex flex-col items-center text-center">
            <Badge variant="gradient" dot>
              Engenharia de software de padrão internacional
            </Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl">
              Desenvolvimento de Sistemas,{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
              >
                SaaS
              </span>{' '}
              e Inteligência Artificial.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
              A HR Tech constrói sistemas, plataformas SaaS e automações sob medida — com engenharia de
              software rigorosa do primeiro commit à produção.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Solicitar Orçamento
              </Button>
              <Button
                href={siteConfig.whatsappHref}
                variant="secondary"
                size="lg"
                iconLeft={<IconBrandWhatsapp size={18} />}
              >
                Falar no WhatsApp
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <Section size="lg" className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="O que fazemos"
            title="Software construído para o problema real, não adaptado a ele."
            description="Da concepção à produção, cada entrega segue o mesmo padrão de qualidade, performance e segurança."
          />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.05}>
                <Card hoverable padding="lg" className="group h-full">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(233,32,52,0.15) 0%, rgba(255,135,31,0.15) 100%)' }}
                  >
                    <service.icon size={22} className="text-brand-orange" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{service.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section size="lg" className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <CardEyebrow>Solução em destaque</CardEyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">
                Soluções para Escritórios de Advocacia
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">
                Nossa primeira vertical: uma plataforma SaaS conceitual para gestão de processos, clientes,
                agenda, documentos e financeiro de escritórios de advocacia — com Inteligência Artificial
                aplicada ao fluxo jurídico.
              </p>
              <Badge variant="outline" className="mt-5">
                Apresentação conceitual — em desenvolvimento
              </Badge>
              <div className="mt-8">
                <Button href="/solucoes/juridico" variant="secondary" iconRight={<IconArrowRight size={16} />}>
                  Conhecer a solução
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <MockupFrame label="app.hrtech.com.br/juridico">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconScale size={16} className="text-brand-orange" />
                    <span className="text-xs font-medium text-white/70">Painel de Processos</span>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-surface p-4">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="mt-3 h-5 w-10" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              </MockupFrame>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section size="lg" className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col items-center rounded-3xl border border-border bg-brand-gradient-soft px-6 py-16 text-center md:py-20">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">
              Vamos construir o próximo sistema da sua empresa.
            </h2>
            <p className="mt-4 max-w-lg text-white/55">
              Conte o que você precisa — respondemos com um plano claro de como a HR Tech pode ajudar.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
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
