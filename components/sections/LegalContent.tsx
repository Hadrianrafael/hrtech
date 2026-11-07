import { PageHeader } from '@/components/layout/PageHeader';
import { siteConfig } from '@/config/site';
import { getUi, localeConfig, type Locale } from '@/lib/i18n';

const legalCopy = {
  privacy: {
    'en-US': {
      title: 'Privacy Policy', updated: 'Last updated: September 2026.',
      intro: `This policy explains how ${siteConfig.legalName} (${siteConfig.url.replace('https://', '')}) handles information sent through this website’s contact form.`,
      sections: [
        ['What we collect', 'We collect only the information you provide in the contact form: name, company (optional), email, WhatsApp number (optional), project type, estimated budget (optional) and your message.'],
        ['How we use it', 'We use this information only to reply to your inquiry and, if there is mutual interest, discuss a business proposal. We do not sell, rent or share your data with third parties for marketing.'],
        ['WhatsApp and email', 'Depending on the form configuration when you contact us, your details may be sent directly through WhatsApp or email opened on your device. In that case, sending is subject to WhatsApp’s and your email provider’s privacy policies.'],
        ['Cookies', 'This site does not use its own tracking cookies. If an audience analytics tool such as Google Analytics is active, it may use its own cookies, subject to the provider’s privacy policy.'],
        ['Your rights', 'You may request deletion of the information you sent us at any time by emailing'],
        ['Contact', 'Questions about this policy can be sent to'],
      ],
    },
    'pt-BR': {
      title: 'Política de Privacidade', updated: 'Última atualização: setembro de 2026.',
      intro: `Esta política explica como a ${siteConfig.legalName} (${siteConfig.url.replace('https://', '')}) trata as informações enviadas por meio do formulário de contato deste site.`,
      sections: [
        ['Quais dados coletamos', 'Coletamos apenas os dados que você mesmo informa ao preencher o formulário de contato: nome, empresa (opcional), e-mail, WhatsApp (opcional), tipo de projeto, orçamento estimado (opcional) e a mensagem enviada.'],
        ['Como usamos os dados', 'Usamos essas informações exclusivamente para responder ao seu contato e, se houver interesse mútuo, avançar em uma proposta comercial. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.'],
        ['Envio por WhatsApp e e-mail', 'Dependendo da configuração do formulário no momento do seu contato, os dados podem ser enviados diretamente para o WhatsApp ou e-mail da HR Tech, abertos no seu próprio dispositivo — nesse caso, o envio segue as políticas de privacidade do WhatsApp e do seu provedor de e-mail.'],
        ['Cookies', 'Este site não utiliza cookies de rastreamento próprios. Se uma ferramenta de análise de audiência (como Google Analytics) estiver ativa, ela pode usar cookies próprios — sujeitos à política de privacidade do respectivo provedor.'],
        ['Seus direitos', 'Você pode solicitar a qualquer momento a exclusão dos dados que nos enviou, entrando em contato pelo e-mail'],
        ['Contato', 'Dúvidas sobre esta política podem ser enviadas para'],
      ],
    },
    es: {
      title: 'Política de Privacidad', updated: 'Última actualización: septiembre de 2026.',
      intro: `Esta política explica cómo ${siteConfig.legalName} (${siteConfig.url.replace('https://', '')}) trata la información enviada mediante el formulario de contacto de este sitio.`,
      sections: [
        ['Datos que recopilamos', 'Recopilamos solo los datos que usted proporciona en el formulario: nombre, empresa (opcional), correo electrónico, WhatsApp (opcional), tipo de proyecto, presupuesto estimado (opcional) y mensaje.'],
        ['Cómo usamos los datos', 'Utilizamos esta información únicamente para responder a su consulta y, si existe interés mutuo, avanzar con una propuesta comercial. No vendemos, alquilamos ni compartimos sus datos con terceros para fines de marketing.'],
        ['WhatsApp y correo', 'Según la configuración del formulario al momento del contacto, los datos pueden enviarse directamente por WhatsApp o correo abierto en su dispositivo. En ese caso, el envío se rige por las políticas de privacidad de WhatsApp y de su proveedor de correo.'],
        ['Cookies', 'Este sitio no utiliza cookies de seguimiento propias. Si una herramienta de análisis como Google Analytics está activa, puede utilizar sus propias cookies, sujetas a la política de privacidad del proveedor.'],
        ['Sus derechos', 'Puede solicitar en cualquier momento la eliminación de los datos que nos envió escribiendo al correo'],
        ['Contacto', 'Puede enviar preguntas sobre esta política a'],
      ],
    },
  },
  terms: {
    'en-US': {
      title: 'Terms of Use', updated: 'Last updated: September 2026.',
      intro: `These terms govern use of the ${siteConfig.legalName} institutional website (${siteConfig.url.replace('https://', '')}). By browsing this site, you agree to the conditions below.`,
      sections: [
        ['About the content', 'The text, images, visual identity and code on this site belong to HR Tech Sistemas or are used under an appropriate license.'],
        ['Permitted use', 'This site’s content is freely available for informational purposes. Reproduction, copying or redistribution without prior authorization is not permitted.'],
        ['Quotes and proposals', 'Information sent through the contact form is used only to prepare a reply or commercial proposal. Submitting the form does not create a service contract; every engagement is formalized in a separate agreement.'],
        ['Availability', 'We aim to keep the site available but cannot guarantee uninterrupted access during maintenance or events outside our control.'],
        ['Changes', 'These terms may be updated periodically. The current version is always the one published on this page.'],
        ['Contact', 'Questions about these terms can be sent to'],
      ],
    },
    'pt-BR': {
      title: 'Termos de Uso', updated: 'Última atualização: setembro de 2026.',
      intro: `Estes termos regulam o uso do site institucional da ${siteConfig.legalName} (${siteConfig.url.replace('https://', '')}). Ao navegar neste site, você concorda com as condições descritas abaixo.`,
      sections: [
        ['Sobre o conteúdo', 'Os textos, imagens, identidade visual e código deste site pertencem à HR Tech Sistemas ou são utilizados sob licença adequada.'],
        ['Uso permitido', 'O conteúdo deste site pode ser acessado livremente para fins informativos. A reprodução, cópia ou redistribuição do conteúdo sem autorização prévia não é permitida.'],
        ['Orçamentos e propostas', 'As informações enviadas pelo formulário de contato são usadas apenas para elaborar uma resposta ou proposta comercial. O envio do formulário não representa contratação de serviço — toda contratação é formalizada em contrato específico.'],
        ['Disponibilidade', 'Buscamos manter o site sempre disponível, mas não garantimos ausência de interrupções para manutenção ou fatores fora do nosso controle.'],
        ['Alterações', 'Estes termos podem ser atualizados periodicamente. A versão vigente é sempre a publicada nesta página.'],
        ['Contato', 'Dúvidas sobre estes termos podem ser enviadas para'],
      ],
    },
    es: {
      title: 'Términos de Uso', updated: 'Última actualización: septiembre de 2026.',
      intro: `Estos términos regulan el uso del sitio institucional de ${siteConfig.legalName} (${siteConfig.url.replace('https://', '')}). Al navegar por el sitio, usted acepta las condiciones siguientes.`,
      sections: [
        ['Sobre el contenido', 'Los textos, imágenes, identidad visual y código de este sitio pertenecen a HR Tech Sistemas o se utilizan bajo la licencia correspondiente.'],
        ['Uso permitido', 'El contenido del sitio puede consultarse libremente con fines informativos. No se permite reproducirlo, copiarlo ni redistribuirlo sin autorización previa.'],
        ['Presupuestos y propuestas', 'La información enviada mediante el formulario de contacto se utiliza solo para preparar una respuesta o propuesta comercial. Enviar el formulario no implica contratar un servicio; cada contratación se formaliza mediante un contrato específico.'],
        ['Disponibilidad', 'Procuramos mantener el sitio disponible, pero no garantizamos acceso ininterrumpido durante tareas de mantenimiento o por circunstancias ajenas a nuestro control.'],
        ['Cambios', 'Estos términos pueden actualizarse periódicamente. La versión vigente es la publicada en esta página.'],
        ['Contacto', 'Puede enviar preguntas sobre estos términos a'],
      ],
    },
  },
} as const;

export function LegalContent({ kind, locale }: { kind: 'privacy' | 'terms'; locale: Locale }) {
  const copy = legalCopy[kind][locale];
  const prefix = localeConfig[locale].prefix;
  const path = kind === 'privacy' ? 'privacidade' : 'termos';
  return <>
    <PageHeader breadcrumbs={[{ name: getUi(locale).home, path: `${prefix}/` }, { name: copy.title, path: `${prefix}/${path}/` }]} title={copy.title} description={copy.updated} />
    <section className="pb-24 lg:pb-32"><div className="container max-w-prose space-y-6 text-[15px] leading-relaxed text-muted">
      <p>{copy.intro}</p>
      {copy.sections.map(([heading, body], index) => <div key={heading}>
        <h2 className="pt-2 text-lg font-semibold text-fg">{index + 1}. {heading}</h2>
        <p className="mt-3">{body}{(index === copy.sections.length - 1 || (kind === 'privacy' && index === copy.sections.length - 2)) && <> <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-soft underline-offset-4 hover:underline">{siteConfig.contact.email}</a>.</>}</p>
      </div>)}
    </div></section>
  </>;
}
