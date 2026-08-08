import type { Metadata } from 'next';
import { Container, Section, Breadcrumb, Reveal } from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a HR Tech coleta, utiliza e protege dados pessoais, em conformidade com a LGPD.',
};

const sections = [
  {
    title: '1. Quais dados coletamos',
    body: 'Coletamos os dados que você nos fornece voluntariamente através do formulário de contato do site — nome, empresa, e-mail, telefone e o conteúdo da sua mensagem. Não coletamos dados sensíveis.',
  },
  {
    title: '2. Como utilizamos seus dados',
    body: 'Os dados enviados pelo formulário de contato são utilizados exclusivamente para responder à sua solicitação e, quando aplicável, dar seguimento comercial ao seu pedido de orçamento ou demonstração.',
  },
  {
    title: '3. Compartilhamento de dados',
    body: 'Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados podem ser processados por provedores de infraestrutura (como serviços de e-mail transacional) estritamente para viabilizar o envio da sua mensagem.',
  },
  {
    title: '4. Seus direitos',
    body: 'Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a confirmar a existência de tratamento, acessar, corrigir, anonimizar, portar ou solicitar a exclusão dos seus dados pessoais a qualquer momento.',
  },
  {
    title: '5. Segurança',
    body: 'Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados pessoais coletados contra acesso não autorizado, perda ou alteração.',
  },
  {
    title: '6. Contato',
    body: `Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato pelo e-mail ${siteConfig.email}.`,
  },
];

export default function PrivacidadePage() {
  return (
    <Section size="lg">
      <Container>
        <Reveal className="max-w-3xl">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Privacidade' }]} />
          <span className="mt-6 block font-mono text-xs uppercase tracking-[0.2em] text-ink/35">
            Última atualização: 2026
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/50">
            Esta política descreve como a HR Tech coleta, utiliza e protege os dados pessoais fornecidos através
            deste site.
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
