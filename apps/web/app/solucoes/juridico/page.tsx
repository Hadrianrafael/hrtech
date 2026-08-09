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
  IconLayoutDashboard,
  IconArrowRight,
  IconBrandWhatsapp,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Badge, Button, SectionHeading, Reveal, Container, Section, Breadcrumb, MockupFrame, Accordion } from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';
import { TiltCard } from '@/components/TiltCard';
import { LegalProductMockup } from '@/components/legal/LegalProductMockup';

export const metadata: Metadata = {
  title: 'Legal Tech — Solução para Advocacia',
  description:
    'Legal Tech: a plataforma que a HR Tech está desenvolvendo para modernizar a gestão de escritórios de advocacia — processos, clientes, agenda, documentos, financeiro, automações e Inteligência Artificial em um único ambiente.',
};

const problems = [
  'Informações espalhadas entre e-mail, planilhas e pastas pessoais',
  'Controle manual de processos e prazos',
  'Excesso de planilhas paralelas',
  'Perda de prazos importantes',
  'Dificuldade de acompanhar o andamento dos processos',
  'Documentos desorganizados',
  'Falta de visão financeira clara',
  'Tarefas repetitivas consumindo tempo da equipe',
  'Pouca automação no dia a dia do escritório',
];

const mainFeatures = [
  {
    icon: IconLayoutDashboard,
    eyebrow: 'Dashboard',
    title: 'Visão geral da operação, em um único painel.',
    description:
      'Indicadores, processos, prazos e atividades reunidos em um painel único e claro — sem precisar abrir cinco telas diferentes para entender como o escritório está.',
    bullets: ['Indicadores', 'Processos', 'Prazos', 'Atividades', 'Financeiro'],
    screen: 'Dashboard' as const,
  },
  {
    icon: IconFolders,
    eyebrow: 'Gestão de Processos',
    title: 'Cada processo, sempre à vista.',
    description:
      'Número do processo, tribunal, partes, responsáveis, status e movimentações organizados em um só lugar, com tarefas vinculadas a cada caso.',
    bullets: ['Número do processo', 'Tribunal', 'Partes', 'Responsáveis', 'Status', 'Movimentações', 'Tarefas relacionadas'],
    screen: 'Processos' as const,
  },
  {
    icon: IconUsers,
    eyebrow: 'Gestão de Clientes',
    title: 'Relacionamento e histórico, sem depender de memória.',
    description:
      'Cadastro, histórico completo, documentos, contatos e observações vinculados a cada cliente do escritório.',
    bullets: ['Cadastro', 'Histórico', 'Documentos', 'Contatos', 'Observações'],
    screen: 'Clientes' as const,
  },
  {
    icon: IconCalendarEvent,
    eyebrow: 'Agenda',
    title: 'Prazos e compromissos, sem depender de lembrete manual.',
    description: 'Audiências, reuniões, prazos e tarefas organizados com lembretes automáticos para toda a equipe.',
    bullets: ['Audiências', 'Reuniões', 'Prazos', 'Lembretes', 'Tarefas'],
    screen: 'Agenda' as const,
  },
  {
    icon: IconCoin,
    eyebrow: 'Financeiro',
    title: 'Visão clara da saúde financeira do escritório.',
    description: 'Receitas, despesas, pagamentos, cobranças e indicadores reunidos em um painel financeiro único.',
    bullets: ['Receitas', 'Despesas', 'Pagamentos', 'Cobranças', 'Fluxo financeiro', 'Indicadores'],
    screen: 'Financeiro' as const,
  },
  {
    icon: IconSparkles,
    eyebrow: 'Inteligência Artificial',
    title: 'IA aplicada ao dia a dia jurídico.',
    description:
      'Recursos planejados para apoiar a equipe no que consome mais tempo — sem prometer funcionalidades jurídicas específicas ainda não definidas.',
    bullets: ['Assistente jurídico', 'Análise de documentos', 'Resumo de informações', 'Pesquisa interna', 'Automação de tarefas'],
    screen: 'IA' as const,
    badge: 'Recursos planejados',
  },
];

const moreFeatures = [
  {
    icon: IconFileText,
    title: 'Gestão de Documentos',
    tags: ['Armazenamento', 'Organização', 'Categorização', 'Busca', 'Vinculação a clientes/processos', 'Controle de acesso'],
  },
  {
    icon: IconChecklist,
    title: 'Gestão de Tarefas',
    tags: ['Responsáveis', 'Prioridades', 'Prazos', 'Status', 'Notificações'],
  },
  {
    icon: IconBolt,
    title: 'Automações',
    tags: ['Lembretes', 'Notificações', 'Acompanhamento', 'Organização', 'Fluxos internos'],
  },
  {
    icon: IconReportAnalytics,
    title: 'Relatórios',
    tags: ['Processos', 'Produtividade', 'Financeiro', 'Clientes', 'Tarefas', 'Indicadores'],
  },
  {
    icon: IconShieldLock,
    title: 'Segurança',
    tags: ['Controle de acesso', 'Permissões', 'Proteção de dados', 'Auditoria', 'Arquitetura escalável'],
  },
];

const howItWorks = [
  { n: '01', title: 'Cadastre seu escritório.' },
  { n: '02', title: 'Organize clientes e processos.' },
  { n: '03', title: 'Centralize documentos e tarefas.' },
  { n: '04', title: 'Automatize atividades.' },
  { n: '05', title: 'Acompanhe indicadores.' },
  { n: '06', title: 'Use IA para ganhar produtividade.' },
];

const benefits = [
  'Mais organização',
  'Menos trabalho manual',
  'Maior controle',
  'Mais produtividade',
  'Informações centralizadas',
  'Automação',
  'Inteligência Artificial',
  'Visão estratégica',
];

const faqs = [
  {
    value: 'status',
    question: 'Esse sistema já está disponível?',
    answer:
      'Não. Esta página apresenta o conceito e os recursos planejados para o Legal Tech, que ainda está em desenvolvimento. As telas mostradas são mockups ilustrativos, não o produto funcional.',
  },
  {
    value: 'quando',
    question: 'Quando o Legal Tech estará disponível?',
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
      {/* Hero */}
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb
              items={[{ label: 'Home', href: '/' }, { label: 'Soluções', href: '/solucoes' }, { label: 'Legal Tech' }]}
            />
            <div className="mt-6 flex items-center gap-2">
              <IconScale size={16} className="text-brand-orange" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                Legal Tech — produto em desenvolvimento pela HR Tech
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Mais inteligência para a gestão jurídica.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              Uma plataforma inteligente para modernizar a gestão de escritórios de advocacia — centralizando
              processos, clientes, documentos, agenda, financeiro e automações em um único ambiente.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
              <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
                Quero conhecer a solução
              </Button>
              <Button href={siteConfig.whatsappHref} target="_blank" rel="noreferrer" variant="secondary" size="lg" iconLeft={<IconBrandWhatsapp size={18} />}>
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

      {/* Problema / Solução */}
      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Reveal>
              <SectionHeading eyebrow="O problema" title="O que a maioria dos escritórios ainda enfrenta." align="left" />
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {problems.map((problem) => (
                  <li key={problem} className="flex items-start gap-3 text-sm text-ink/60">
                    <IconAlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-orange" />
                    {problem}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <SectionHeading eyebrow="A solução" title="Um único ambiente para administrar a operação do escritório." align="left" />
              <p className="mt-8 text-sm leading-relaxed text-ink/55">
                O Legal Tech centraliza processos, clientes, agenda, documentos e financeiro em uma plataforma
                única, com automações e Inteligência Artificial aplicadas ao dia a dia do escritório — reduzindo
                retrabalho e risco de prazo perdido.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-700">
                <IconCircleCheck size={16} />
                Conceito desenhado a partir do fluxo real de trabalho jurídico
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Funcionalidades principais — blocos alternados com mockup */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Funcionalidades</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Tudo que o escritório precisa, em um só produto.
            </h2>
          </Reveal>

          <div className="mt-16 flex flex-col gap-24">
            {mainFeatures.map((feature, index) => {
              const reversed = index % 2 === 1;
              return (
                <div
                  key={feature.eyebrow}
                  className="grid grid-cols-1 items-center gap-10 border-t border-dark-border pt-16 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-14"
                >
                  <Reveal className={reversed ? 'lg:col-span-5 lg:order-2' : 'lg:col-span-5'}>
                    <div className="flex items-center gap-2">
                      <feature.icon size={16} className="text-brand-orange" />
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                        {feature.eyebrow}
                      </span>
                      {feature.badge && (
                        <Badge variant="outline" className="border-white/15 text-white/55">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/55">{feature.description}</p>
                    <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
                      {feature.bullets.map((bullet, i) => (
                        <span key={bullet} className="flex items-center gap-2 text-xs text-white/40">
                          {i > 0 && <span className="text-white/15">·</span>}
                          {bullet}
                        </span>
                      ))}
                    </div>
                  </Reveal>
                  <Reveal delay={0.1} className={reversed ? 'lg:col-span-7 lg:order-1' : 'lg:col-span-7'}>
                    <TiltCard strength={3}>
                      <div className="overflow-hidden rounded-md border border-dark-border bg-dark-surface p-5 md:p-7">
                        <LegalProductMockup defaultScreen={feature.screen} interactive={false} />
                      </div>
                    </TiltCard>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Mais recursos da plataforma */}
      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Mais recursos</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              O que mais a plataforma vai oferecer.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {moreFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 3) * 0.05}>
                <feature.icon size={20} className="text-brand-orange" />
                <h3 className="mt-3 text-base font-semibold text-ink">{feature.title}</h3>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Como funciona */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Como funciona</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Do cadastro do escritório à produtividade com IA.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-8 border-t border-dark-border pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((step, index) => (
              <Reveal key={step.n} delay={index * 0.05}>
                <span
                  className="text-3xl font-semibold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
                >
                  {step.n}
                </span>
                <h3 className="mt-3 text-base font-medium text-white">{step.title}</h3>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Benefícios */}
      <Section className="border-t border-border">
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Por que usar o Legal Tech?</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Benefícios pensados para o dia a dia do escritório.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-5 border-t border-border pt-10 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <Reveal key={benefit} delay={(index % 4) * 0.04} className="flex items-center gap-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
                />
                <span className="text-sm text-ink/65">{benefit}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border">
        <Container>
          <SectionHeading eyebrow="Perguntas frequentes" title="Antes de conversar com a gente." />
          <Reveal delay={0.1} className="mt-10">
            <Accordion items={faqs.map(({ value, question, answer }) => ({ value, question, answer }))} />
          </Reveal>
        </Container>
      </Section>

      {/* CTA final */}
      <Section size="lg" className="border-t border-border bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Seu escritório está pronto para evoluir?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/50">
              Estamos desenvolvendo uma nova geração de tecnologia para gestão jurídica.
            </p>
            <div className="mt-8">
              <Button href={siteConfig.whatsappHref} target="_blank" rel="noreferrer" size="lg" iconRight={<IconArrowRight size={18} />}>
                Falar com a HR Tech
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
