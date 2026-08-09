import {
  IconCode,
  IconCloud,
  IconBuildingSkyscraper,
  IconBolt,
  IconSparkles,
  IconLayoutGrid,
  IconPlugConnected,
  IconArrowRight,
} from '@tabler/icons-react';
import { Button, Reveal, Container, Section, Breadcrumb, SectionHeading, Accordion } from '@hrtech/ui';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata(
  'Serviços',
  'Desenvolvimento de sistemas, SaaS, sistemas empresariais, automação, Inteligência Artificial, desenvolvimento web e integrações.',
  '/servicos',
);

const services = [
  {
    n: '01',
    icon: IconCode,
    title: 'Desenvolvimento de sistemas',
    description: 'Sistemas web sob medida, desenhados a partir do processo real da sua empresa — não de um template genérico.',
  },
  {
    n: '02',
    icon: IconCloud,
    title: 'SaaS',
    description: 'Plataformas multi-tenant, da concepção do produto à operação em produção, prontas para escalar.',
  },
  {
    n: '03',
    icon: IconBuildingSkyscraper,
    title: 'Sistemas empresariais',
    description: 'Módulos internos sob medida para gestão, controle e dashboards de decisão — integrados ao que a empresa já usa.',
  },
  {
    n: '04',
    icon: IconBolt,
    title: 'Automação',
    description: 'Eliminação de tarefas manuais e repetitivas com rotinas confiáveis, monitoradas e auditáveis.',
  },
  {
    n: '05',
    icon: IconSparkles,
    title: 'Inteligência Artificial',
    description: 'IA aplicada a processos reais de negócio — extração de dados, automação de decisões, assistentes internos.',
  },
  {
    n: '06',
    icon: IconLayoutGrid,
    title: 'Desenvolvimento Web',
    description: 'Sites e landing pages de alta performance, construídos com o mesmo padrão de engenharia dos sistemas.',
  },
  {
    n: '07',
    icon: IconPlugConnected,
    title: 'Integrações e APIs',
    description: 'Construção e integração de APIs conectando sistemas internos e serviços de terceiros.',
  },
];

const faqs = [
  {
    value: 'custo',
    question: 'Quanto custa desenvolver um sistema?',
    answer:
      'Varia conforme o escopo, a complexidade e as integrações necessárias — não trabalhamos com valor fixo genérico. Depois de entender o que sua empresa precisa, enviamos uma proposta objetiva.',
  },
  {
    value: 'saas',
    question: 'Vocês desenvolvem SaaS?',
    answer: 'Sim. Desenvolvimento de plataformas SaaS é uma das nossas principais frentes de trabalho.',
  },
  {
    value: 'pequenas-empresas',
    question: 'Vocês atendem pequenas empresas?',
    answer: 'Sim. Atendemos empresas de diferentes portes — o escopo é sempre dimensionado à realidade do negócio.',
  },
  {
    value: 'integracao',
    question: 'É possível integrar sistemas existentes?',
    answer: 'Sim. Integrações e APIs conectando sistemas internos e serviços de terceiros fazem parte do nosso dia a dia.',
  },
  {
    value: 'ia',
    question: 'Vocês trabalham com IA?',
    answer: 'Sim, aplicada a processos reais de negócio — não como modismo ou recurso decorativo.',
  },
  {
    value: 'manutencao',
    question: 'Vocês fazem manutenção?',
    answer: 'Sim. Acompanhamento e evolução contínua fazem parte do nosso processo, não terminam na entrega inicial.',
  },
  {
    value: 'prazo',
    question: 'Quanto tempo leva para desenvolver?',
    answer:
      'Depende do escopo do projeto. Definimos um cronograma realista logo após a etapa de descoberta, antes de qualquer compromisso.',
  },
  {
    value: 'processo',
    question: 'Como funciona o processo?',
    answer: 'Descoberta, estratégia, desenvolvimento, testes, lançamento e evolução contínua — sempre com arquitetura pensada antes da primeira tela.',
  },
  {
    value: 'orcamento',
    question: 'Como solicitar orçamento?',
    answer: 'Pelo formulário de contato ou diretamente pelo WhatsApp — respondemos com um plano claro de como podemos ajudar.',
  },
];

export default function ServicosPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Serviços' }]} />
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Engenharia de software sob medida, do escopo à operação.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              Sete frentes de trabalho, um único padrão de qualidade. Cada serviço segue a mesma disciplina de
              arquitetura, performance e segurança.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Índice de serviços — tipografia editorial, sem cards */}
      <Section className="bg-dark-bg">
        <Container>
          <div className="border-t border-dark-border">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.03}>
                <div className="group grid grid-cols-1 gap-3 border-b border-dark-border py-9 lg:grid-cols-12 lg:items-baseline lg:gap-8">
                  <div className="flex items-center gap-4 lg:col-span-5">
                    <span className="font-mono text-sm text-white/25">{service.n}</span>
                    <service.icon
                      size={18}
                      className="shrink-0 text-brand-orange transition-transform duration-300 group-hover:scale-110"
                    />
                    <h2 className="text-xl font-medium tracking-[-0.01em] text-white transition-colors duration-300 sm:text-2xl">
                      {service.title}
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-white/45 lg:col-span-7">
                    {service.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Como entregamos — princípios, não cards */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Como entregamos</span>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Um único padrão de engenharia para todos os serviços.
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              <p className="max-w-2xl text-base leading-relaxed text-ink/60">
                Não vendemos serviços isolados — vendemos o mesmo rigor técnico aplicado a diferentes frentes.
                Arquitetura pensada antes da primeira tela, código testado, segurança desde o primeiro commit e um
                Design System próprio garantem que qualquer entrega da HR Tech tenha a mesma qualidade, do
                pequeno ajuste ao produto completo.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/45">
                Sem escopo genérico adaptado à força — cada projeto começa com o mapeamento do processo real da
                sua empresa.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Perguntas frequentes" title="Antes de solicitar um orçamento." />
          <Reveal delay={0.1} className="mt-10">
            <Accordion items={faqs} />
          </Reveal>
        </Container>
      </Section>

      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center border-t border-dark-border pt-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Não encontrou exatamente o que precisa?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/50">
              Conte o que sua empresa precisa — construímos soluções sob medida além dessa lista.
            </p>
            <div className="mt-8">
              <Button href="/contato" iconRight={<IconArrowRight size={16} />}>
                Quero desenvolver meu projeto
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
