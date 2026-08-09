import { IconArrowRight } from '@tabler/icons-react';
import { Badge, Button, Reveal, Container, Section, Breadcrumb, ProjectCard } from '@hrtech/ui';
import { LegalProductMockup } from '@/components/legal/LegalProductMockup';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata(
  'Soluções',
  'Produtos e soluções SaaS que a HR Tech está construindo — hoje em desenvolvimento: Legal Tech para escritórios de advocacia.',
  '/solucoes',
);

const roadmap = [
  { emoji: '🏗️', title: 'Construção Civil' },
  { emoji: '🏥', title: 'Saúde' },
  { emoji: '🚚', title: 'Logística' },
  { emoji: '🏠', title: 'Imobiliário' },
  { emoji: '🐾', title: 'Veterinário' },
  { emoji: '🏭', title: 'Indústria' },
  { emoji: '🛍️', title: 'Varejo' },
  { emoji: '🏨', title: 'Hotelaria' },
  { emoji: '📦', title: 'Distribuição' },
  { emoji: '💼', title: 'Serviços Profissionais' },
];

export default function SolucoesPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Soluções' }]} />
            <span className="mt-6 block font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
              Produtos e Soluções
            </span>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Soluções que estamos construindo.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              Produtos digitais pensados para resolver problemas específicos de diferentes setores — um setor de
              cada vez, com profundidade, antes de anunciar o próximo.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Legal Tech em destaque */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal>
            <ProjectCard
              eyebrow="⚖️ Legal Tech"
              title="Legal Tech"
              status="Em desenvolvimento"
              description="Sistema inteligente para escritórios de advocacia — uma solução SaaS criada para centralizar operações, processos, clientes, documentos, agenda, financeiro e automações em um único ambiente."
              href="/solucoes/juridico"
              ctaLabel="Conhecer o Legal Tech"
              visual={<LegalProductMockup />}
            />
          </Reveal>
        </Container>
      </Section>

      {/* Roadmap — honesto, sem fingir prontidão */}
      <Section>
        <Container>
          <Reveal className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Mais soluções estão chegando</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
              Próximos setores no radar — ainda sem desenvolvimento iniciado.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/50">
              Estas verticais fazem parte da visão de longo prazo da HR Tech. Elas aparecem aqui para transparência
              sobre a direção da empresa, não como produtos disponíveis.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {roadmap.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <div className="flex flex-col items-start gap-3 rounded-md border border-border p-5">
                  <span className="text-2xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <h3 className="text-sm font-medium text-ink/75">{item.title}</h3>
                  <Badge variant="outline">Em breve</Badge>
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
