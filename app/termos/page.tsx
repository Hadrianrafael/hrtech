import { PageHeader } from '@/components/layout/PageHeader';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Termos de Uso',
  description: 'Condições de uso do site institucional da HR Tech Sistemas.',
  path: '/termos/',
  noIndex: true,
});

export default function TermsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Termos de Uso', path: '/termos/' },
        ]}
        title="Termos de Uso"
        description="Última atualização: setembro de 2026."
      />
      <section className="pb-24 lg:pb-32">
        <div className="container max-w-prose space-y-6 text-[15px] leading-relaxed text-muted">
          <p>
            Estes termos regulam o uso do site institucional da {siteConfig.legalName} ({siteConfig.url.replace('https://', '')}).
            Ao navegar neste site, você concorda com as condições descritas abaixo.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">1. Sobre o conteúdo</h2>
          <p>
            Os textos, imagens, identidade visual e código deste site pertencem à HR Tech Sistemas ou são utilizados sob
            licença adequada.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">2. Uso permitido</h2>
          <p>
            O conteúdo deste site pode ser acessado livremente para fins informativos. A reprodução, cópia ou redistribuição do
            conteúdo sem autorização prévia não é permitida.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">3. Orçamentos e propostas</h2>
          <p>
            As informações enviadas pelo formulário de contato são usadas apenas para elaborar uma resposta ou proposta
            comercial. O envio do formulário não representa contratação de serviço — toda contratação é formalizada em contrato
            específico.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">4. Disponibilidade</h2>
          <p>
            Buscamos manter o site sempre disponível, mas não garantimos ausência de interrupções para manutenção ou fatores
            fora do nosso controle.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">5. Alterações</h2>
          <p>Estes termos podem ser atualizados periodicamente. A versão vigente é sempre a publicada nesta página.</p>

          <h2 className="pt-2 text-lg font-semibold text-fg">6. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{' '}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-soft underline-offset-4 hover:underline">
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
