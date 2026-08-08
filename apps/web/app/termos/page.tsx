import type { Metadata } from 'next';
import { Container, Section, Breadcrumb, Reveal } from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de uso do site institucional da HR Tech.',
};

const sections = [
  {
    title: '1. Aceitação dos termos',
    body: 'Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Caso não concorde, recomendamos que não utilize o site.',
  },
  {
    title: '2. Sobre o conteúdo do site',
    body: 'Este site tem finalidade institucional: apresentar a HR Tech, seus serviços e a apresentação conceitual de soluções em desenvolvimento. Conteúdos marcados como "em desenvolvimento" ou "apresentação conceitual" representam produtos ainda não disponíveis comercialmente.',
  },
  {
    title: '3. Propriedade intelectual',
    body: 'Todo o conteúdo deste site — textos, identidade visual, componentes de interface e código — é de propriedade da HR Tech, salvo indicação em contrário, e não pode ser reproduzido sem autorização.',
  },
  {
    title: '4. Formulário de contato',
    body: 'Ao enviar uma mensagem pelo formulário de contato, você concorda com o processamento dos dados fornecidos conforme descrito em nossa Política de Privacidade.',
  },
  {
    title: '5. Limitação de responsabilidade',
    body: 'A HR Tech se empenha para manter as informações deste site precisas e atualizadas, mas não garante ausência total de erros ou interrupções de disponibilidade.',
  },
  {
    title: '6. Alterações destes termos',
    body: 'Estes Termos de Uso podem ser atualizados periodicamente. A versão vigente estará sempre disponível nesta página.',
  },
  {
    title: '7. Contato',
    body: `Dúvidas sobre estes termos podem ser enviadas para ${siteConfig.email}.`,
  },
];

export default function TermosPage() {
  return (
    <Section size="lg">
      <Container>
        <Reveal className="max-w-3xl">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Termos de Uso' }]} />
          <span className="mt-6 block font-mono text-xs uppercase tracking-[0.2em] text-ink/35">
            Última atualização: 2026
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">Termos de Uso</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/50">
            Estes termos regem o uso do site institucional da HR Tech.
          </p>

          <div className="mt-12 flex flex-col gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">{section.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
