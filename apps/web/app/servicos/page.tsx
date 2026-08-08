import type { Metadata } from 'next';
import {
  IconCode,
  IconCloud,
  IconSparkles,
  IconBolt,
  IconPlugConnected,
  IconChartBar,
  IconLayoutGrid,
  IconBuildingSkyscraper,
  IconArrowRight,
  IconCheck,
} from '@tabler/icons-react';
import { Button, Badge, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Desenvolvimento de sistemas, SaaS, Inteligência Artificial, automações, APIs, dashboards e integrações.',
};

const services = [
  {
    icon: IconCode,
    title: 'Desenvolvimento de Sistemas',
    description: 'Sistemas web sob medida, desenhados para o processo real da sua empresa.',
    items: ['Arquitetura orientada ao domínio', 'Interfaces modernas e responsivas', 'Código testado e documentado'],
  },
  {
    icon: IconCloud,
    title: 'Desenvolvimento SaaS',
    description: 'Plataformas multi-tenant, do primeiro protótipo à operação em produção.',
    items: ['Multi-tenancy e isolamento de dados', 'Autenticação e controle de acesso', 'Base pronta para escalar'],
  },
  {
    icon: IconSparkles,
    title: 'Inteligência Artificial',
    description: 'IA aplicada a processos reais — extração de dados, automação de decisões, assistentes internos.',
    items: ['Integração com modelos de IA', 'Automação de fluxos com IA', 'Soluções sob medida, não genéricas'],
  },
  {
    icon: IconBolt,
    title: 'Automações',
    description: 'Eliminação de tarefas manuais e repetitivas com automações confiáveis e monitoradas.',
    items: ['Integração entre sistemas', 'Rotinas agendadas e gatilhos', 'Redução de erro humano'],
  },
  {
    icon: IconPlugConnected,
    title: 'APIs e Integrações',
    description: 'Construção e integração de APIs conectando sistemas internos e serviços de terceiros.',
    items: ['APIs REST documentadas', 'Integrações com serviços externos', 'Webhooks e eventos em tempo real'],
  },
  {
    icon: IconChartBar,
    title: 'Dashboards',
    description: 'Painéis de dados construídos para decisão rápida, não apenas visualização.',
    items: ['Métricas relevantes ao negócio', 'Performance de carregamento', 'Design claro e hierárquico'],
  },
  {
    icon: IconLayoutGrid,
    title: 'Landing Pages',
    description: 'Páginas de alta conversão para produtos, campanhas e lançamentos.',
    items: ['Foco em conversão', 'Performance e SEO', 'Design alinhado à marca'],
  },
  {
    icon: IconBuildingSkyscraper,
    title: 'Sistemas Empresariais',
    description: 'Soluções internas sob medida para operações, gestão e controle empresarial.',
    items: ['Módulos sob medida', 'Controle de permissões', 'Integração com sistemas existentes'],
  },
];

export default function ServicosPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Serviços' }]} />
            <Badge variant="gradient" dot className="mt-6">
              O que fazemos
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
              Serviços de engenharia de software sob medida.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
              Da concepção à operação em produção — cada serviço segue o mesmo padrão de qualidade, performance e
              segurança.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="border-t border-border">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.03}>
                <div className="group grid grid-cols-1 gap-4 border-b border-border py-9 lg:grid-cols-12 lg:gap-8">
                  <div className="flex items-start gap-4 lg:col-span-4">
                    <service.icon
                      size={22}
                      className="mt-0.5 shrink-0 text-brand-orange transition-transform duration-300 group-hover:scale-110"
                    />
                    <h2 className="text-xl font-medium text-white">{service.title}</h2>
                  </div>
                  <div className="lg:col-span-8">
                    <p className="max-w-xl text-sm leading-relaxed text-white/50">{service.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.items.map((item) => (
                        <span
                          key={item}
                          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-white/45"
                        >
                          <IconCheck size={12} className="text-brand-orange" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col items-center rounded-3xl border border-border bg-brand-gradient-soft px-6 py-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
              Não encontrou exatamente o que precisa?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/55">
              Conte o que sua empresa precisa — construímos soluções sob medida além dessa lista.
            </p>
            <div className="mt-8">
              <Button href="/contato" iconRight={<IconArrowRight size={16} />}>
                Solicitar Orçamento
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
