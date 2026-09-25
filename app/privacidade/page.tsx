import { PageHeader } from '@/components/layout/PageHeader';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Política de Privacidade',
  description: 'Como a HR Tech Sistemas coleta, usa e protege os dados enviados pelo site.',
  path: '/privacidade/',
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Política de Privacidade', path: '/privacidade/' },
        ]}
        title="Política de Privacidade"
        description={`Última atualização: setembro de 2026.`}
      />
      <section className="pb-24 lg:pb-32">
        <div className="container max-w-prose space-y-6 text-[15px] leading-relaxed text-muted">
          <p>
            Esta política explica como a {siteConfig.legalName} ({siteConfig.url.replace('https://', '')}) trata as informações
            enviadas por meio do formulário de contato deste site.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">1. Quais dados coletamos</h2>
          <p>
            Coletamos apenas os dados que você mesmo informa ao preencher o formulário de contato: nome, empresa (opcional),
            e-mail, WhatsApp (opcional), tipo de projeto, orçamento estimado (opcional) e a mensagem enviada.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">2. Como usamos os dados</h2>
          <p>
            Usamos essas informações exclusivamente para responder ao seu contato e, se houver interesse mútuo, avançar em uma
            proposta comercial. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">3. Envio por WhatsApp e e-mail</h2>
          <p>
            Dependendo da configuração do formulário no momento do seu contato, os dados podem ser enviados diretamente para o
            WhatsApp ou e-mail da HR Tech, abertos no seu próprio dispositivo — nesse caso, o envio segue as políticas de
            privacidade do WhatsApp e do seu provedor de e-mail.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">4. Cookies</h2>
          <p>
            Este site não utiliza cookies de rastreamento próprios. Se uma ferramenta de análise de audiência (como Google
            Analytics) estiver ativa, ela pode usar cookies próprios — sujeitos à política de privacidade do respectivo
            provedor.
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">5. Seus direitos</h2>
          <p>
            Você pode solicitar a qualquer momento a exclusão dos dados que nos enviou, entrando em contato pelo e-mail{' '}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-soft underline-offset-4 hover:underline">
              {siteConfig.contact.email}
            </a>
            .
          </p>

          <h2 className="pt-2 text-lg font-semibold text-fg">6. Contato</h2>
          <p>
            Dúvidas sobre esta política podem ser enviadas para{' '}
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
