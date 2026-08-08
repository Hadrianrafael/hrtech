import type { Metadata } from 'next';
import { IconScale, IconArrowRight } from '@tabler/icons-react';
import { Button, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';

export const metadata: Metadata = {
  title: 'Soluções',
  description: 'Tecnologia para diferentes negócios — hoje em desenvolvimento: Legal Tech para escritórios de advocacia.',
};

export default function SolucoesPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Soluções' }]} />
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Tecnologia para diferentes negócios.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/55 md:text-lg">
              A HR Tech está construindo um ecossistema de plataformas SaaS especializadas por setor — um setor de
              cada vez, começando pelo jurídico.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-8 border-t border-border pt-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <IconScale size={18} className="text-brand-orange" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                  Legal Tech — em desenvolvimento
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Solução para escritórios de advocacia.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/50">
                Gestão de processos, clientes, agenda, documentos e financeiro em uma plataforma única, com
                Inteligência Artificial aplicada ao fluxo jurídico.
              </p>
            </div>
            <Button href="/solucoes/juridico" size="lg" iconRight={<IconArrowRight size={18} />}>
              Conhecer a solução
            </Button>
          </Reveal>

          <Reveal delay={0.1} className="mt-16 max-w-xl border-t border-border pt-8 text-sm leading-relaxed text-ink/40">
            Outros setores — construção civil, saúde, logística, indústria e mais — estão no roadmap de longo prazo
            da HR Tech, mas ainda não têm desenvolvimento iniciado.
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
