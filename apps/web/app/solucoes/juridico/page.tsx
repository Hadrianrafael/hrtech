import type { Metadata } from 'next';
import {
  IconScale,
  IconUsers,
  IconFolders,
  IconCalendarEvent,
  IconCoin,
  IconFileText,
  IconSignature,
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
  Badge,
  Button,
  Card,
  SectionHeading,
  Reveal,
  Container,
  Section,
  Breadcrumb,
  MockupFrame,
  Skeleton,
  Accordion,
} from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';

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
    icon: IconSignature,
    title: 'Assinatura Eletrônica',
    description: 'Fluxo de assinatura de documentos integrado, sem sair da plataforma.',
  },
  {
    icon: IconReportAnalytics,
    title: 'Relatórios',
    description: 'Visão consolidada de processos, produtividade e financeiro do escritório.',
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
      <Section size="lg" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
        <Container className="relative">
          <Reveal>
            <Breadcrumb
              items={[{ label: 'Home', href: '/' }, { label: 'Soluções', href: '/solucoes' }, { label: 'Jurídico' }]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="gradient" dot>
                <IconScale size={13} className="mr-1" />
                Soluções para Advocacia
              </Badge>
              <Badge variant="outline">Apresentação conceitual — em desenvolvimento</Badge>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
              O futuro SaaS jurídico da HR Tech.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
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
            <MockupFrame label="app.hrtech.com.br/juridico — dashboard (conceito)">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                <div className="hidden flex-col gap-1 lg:flex">
                  {['Dashboard', 'Processos', 'Clientes', 'Agenda', 'Financeiro', 'Documentos'].map((label, i) => (
                    <div
                      key={label}
                      className={
                        'rounded-lg px-3 py-2.5 text-xs ' +
                        (i === 0 ? 'bg-brand-gradient-soft text-white' : 'text-white/45')
                      }
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Processos ativos', 'Prazos esta semana', 'Audiências hoje'].map((label) => (
                      <div key={label} className="rounded-xl border border-border bg-surface p-4">
                        <span className="text-[11px] text-white/40">{label}</span>
                        <Skeleton className="mt-3 h-6 w-12" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                    <span className="text-[11px] text-white/40">Processos recentes</span>
                    <div className="mt-3 space-y-2.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </MockupFrame>
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
                  <li key={problem} className="flex items-start gap-3 text-sm text-white/60">
                    <IconAlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-orange" />
                    {problem}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <SectionHeading eyebrow="A solução" title="Tudo em uma única plataforma." align="left" />
              <p className="mt-8 text-sm leading-relaxed text-white/55">
                A proposta da solução jurídica da HR Tech é reunir processos, clientes, agenda, documentos e
                financeiro em uma plataforma única, com automações e Inteligência Artificial aplicadas ao dia a
                dia do escritório — reduzindo retrabalho e risco de prazo perdido.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                <IconCircleCheck size={16} />
                Conceito desenhado a partir do fluxo real de trabalho jurídico
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Recursos planejados" title="Tudo que o escritório precisa, em um só produto." />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 4) * 0.05}>
                <Card padding="lg" hoverable className="h-full">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(233,32,52,0.15) 0%, rgba(255,135,31,0.15) 100%)' }}
                  >
                    <feature.icon size={20} className="text-brand-orange" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Fluxo de uso" title="Como a plataforma vai funcionar, na prática." />
          <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: IconShieldLock, title: 'Segurança', description: 'Controle de acesso, criptografia e boas práticas desde a concepção.' },
              { icon: IconTrendingUp, title: 'Escalabilidade', description: 'Arquitetura multi-tenant preparada para crescer com o escritório.' },
              { icon: IconBolt, title: 'Automações', description: 'Tarefas repetitivas automatizadas para a equipe focar no jurídico.' },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <Card padding="lg" className="h-full text-center">
                  <item.icon size={26} className="mx-auto text-brand-orange" />
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
                </Card>
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

      <Section className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col items-center rounded-3xl border border-border bg-brand-gradient-soft px-6 py-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
              Quer acompanhar o lançamento da solução jurídica?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/55">
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
