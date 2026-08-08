import type { Metadata } from 'next';
import {
  IconScale,
  IconUsers,
  IconFolders,
  IconCalendarEvent,
  IconCoin,
  IconFileText,
  IconChecklist,
  IconReportAnalytics,
  IconSparkles,
  IconBolt,
  IconShieldLock,
  IconTrendingUp,
  IconArrowRight,
  IconBrandWhatsapp,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  Button,
  SectionHeading,
  Reveal,
  Container,
  Section,
  Breadcrumb,
  MockupFrame,
  Accordion,
} from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';
import { TiltCard } from '@/components/TiltCard';
import { LegalProductMockup } from '@/components/legal/LegalProductMockup';

export const metadata: Metadata = {
  title: 'Soluções para Advocacia',
  description:
    'Apresentação conceitual do futuro SaaS da HR Tech para escritórios de advocacia — gestão de processos, clientes, agenda, financeiro e documentos com Inteligência Artificial.',
};

const problems = [
  'Processos e prazos controlados em planilhas dispersas',
  'Documentos espalhados entre e-mail, pastas e drives pessoais',
  'Agenda de audiências e prazos sem alertas automáticos',
  'Financeiro do escritório sem visão clara de honorários e custos',
  'Tempo perdido em tarefas manuais que poderiam ser automatizadas',
];

const features = [
  {
    icon: IconFolders,
    title: 'Gestão de Processos',
    description: 'Organização centralizada de processos, andamentos e prazos por cliente e por área.',
  },
  {
    icon: IconUsers,
    title: 'Gestão de Clientes',
    description: 'Histórico completo de relacionamento, contatos e processos vinculados a cada cliente.',
  },
  {
    icon: IconCalendarEvent,
    title: 'Agenda Integrada',
    description: 'Audiências, prazos e compromissos com alertas automáticos para toda a equipe.',
  },
  {
    icon: IconCoin,
    title: 'Financeiro',
    description: 'Controle de honorários, custas processuais e fluxo de caixa do escritório.',
  },
  {
    icon: IconFileText,
    title: 'Gestão de Documentos',
    description: 'Repositório centralizado, versionado e pesquisável de petições e documentos.',
  },
  {
    icon: IconChecklist,
    title: 'Tarefas',
    description: 'Distribuição e acompanhamento de tarefas da equipe, vinculadas a cada processo.',
  },
  {
    icon: IconBolt,
    title: 'Automações',
    description: 'Rotinas automáticas para movimentações, notificações e atualizações de status.',
  },
  {
    icon: IconReportAnalytics,
    title: 'Indicadores',
    description: 'Painel consolidado de processos, produtividade e financeiro do escritório.',
  },
  {
    icon: IconSparkles,
    title: 'Inteligência Artificial',
    description: 'IA aplicada à leitura de processos, resumo de andamentos e apoio à redação.',
  },
];

const flow = [
  { step: '01', title: 'Cadastro do processo', description: 'O processo entra na plataforma com todos os dados vinculados ao cliente.' },
  { step: '02', title: 'Organização automática', description: 'Prazos, andamentos e documentos são organizados automaticamente.' },
  { step: '03', title: 'Alertas e agenda', description: 'A equipe recebe alertas de prazos e audiências antes do vencimento.' },
  { step: '04', title: 'Relatórios e decisão', description: 'Gestores acompanham o escritório inteiro em um painel único.' },
];

const faqs = [
  {
    value: 'status',
    question: 'Esse sistema já está disponível?',
    answer:
      'Não. Esta página apresenta o conceito e os recursos planejados para a solução jurídica da HR Tech, que ainda está em desenvolvimento. As telas mostradas são mockups ilustrativos, não o produto funcional.',
  },
  {
    value: 'quando',
    question: 'Quando o SaaS jurídico estará disponível?',
    answer: 'Ainda não temos uma data de lançamento definida. Entre em contato para acompanhar as novidades.',
  },
  {
    value: 'contato',
    question: 'Como posso ter mais informações ou demonstrar interesse?',
    answer: 'Fale com a nossa equipe pelo formulário de contato ou WhatsApp — vamos te manter informado sobre o lançamento.',
  },
];

export default function SolucaoJuridicaPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb
              items={[{ label: 'Home', href: '/' }, { label: 'Soluções', href: '/solucoes' }, { label: 'Jurídico' }]}
            />
            <div className="mt-6 flex items-center gap-2">
              <IconScale size={16} className="text-brand-orange" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                Apresentação conceitual — em desenvolvimento
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              O futuro SaaS jurídico da HR Tech.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              Uma plataforma para escritórios de advocacia gerirem processos, clientes, agenda, documentos e
              financeiro em um só lugar — com Inteligência Artificial aplicada ao fluxo jurídico.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Solicitar Demonstração
              </Button>
              <Button href={siteConfig.whatsappHref} variant="secondary" size="lg" iconLeft={<IconBrandWhatsapp size={18} />}>
                Falar no WhatsApp
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-16">
            <TiltCard strength={3}>
              <MockupFrame label="app.hrtech.com.br/juridico — conceito de produto">
                <LegalProductMockup />
              </MockupFrame>
            </TiltCard>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Reveal>
              <SectionHeading eyebrow="O problema" title="O que a maioria dos escritórios ainda enfrenta." align="left" />
              <ul className="mt-8 flex flex-col gap-4">
                {problems.map((problem) => (
                  <li key={problem} className="flex items-start gap-3 text-sm text-ink/60">
                    <IconAlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-orange" />
                    {problem}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <SectionHeading eyebrow="A solução" title="Tudo em uma única plataforma." align="left" />
              <p className="mt-8 text-sm leading-relaxed text-ink/55">
                A proposta da solução jurídica da HR Tech é reunir processos, clientes, agenda, documentos e
                financeiro em uma plataforma única, com automações e Inteligência Artificial aplicadas ao dia a
                dia do escritório — reduzindo retrabalho e risco de prazo perdido.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-700">
                <IconCircleCheck size={16} />
                Conceito desenhado a partir do fluxo real de trabalho jurídico
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Recursos planejados</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Tudo que o escritório precisa, em um só produto.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-10 border-t border-border sm:grid-cols-2">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 4) * 0.04}>
                <div className="flex items-start gap-4 border-b border-border py-7">
                  <feature.icon size={20} className="mt-0.5 shrink-0 text-brand-orange" />
                  <div>
                    <h3 className="text-base font-medium text-ink">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/50">{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Fluxo de uso</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Como a plataforma vai funcionar, na prática.
            </h2>
          </Reveal>
          <div className="relative mt-14 grid grid-cols-1 gap-8 border-t border-dark-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.08}>
                <div>
                  <span
                    className="text-3xl font-semibold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 border-t border-dark-border pt-12 sm:grid-cols-3">
            {[
              { icon: IconShieldLock, title: 'Segurança', description: 'Controle de acesso, criptografia e boas práticas desde a concepção.' },
              { icon: IconTrendingUp, title: 'Escalabilidade', description: 'Arquitetura multi-tenant preparada para crescer com o escritório.' },
              { icon: IconBolt, title: 'Automações', description: 'Tarefas repetitivas automatizadas para a equipe focar no jurídico.' },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <item.icon size={22} className="text-brand-orange" />
                <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Perguntas frequentes" title="Antes de conversar com a gente." />
          <Reveal delay={0.1} className="mt-10">
            <Accordion items={faqs.map(({ value, question, answer }) => ({ value, question, answer }))} />
          </Reveal>
        </Container>
      </Section>

      <Section size="lg" className="border-t border-border bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Quer acompanhar o lançamento da solução jurídica?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/50">
              Entre em contato e fique por dentro das novidades sobre o SaaS para escritórios de advocacia.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Solicitar Demonstração
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
