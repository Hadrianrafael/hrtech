import type { LegalDocument } from '../types';

export const privacy: LegalDocument = {
  metaTitle: 'Política de Privacidade',
  metaDescription: 'Como a HR Tech Sistemas coleta, usa e protege os dados enviados pelo site.',
  title: 'Política de Privacidade',
  updated: 'Última atualização: outubro de 2026.',
  intro: [
    'Esta política explica como a {company} ({site}) trata as informações enviadas pelo formulário de contato e as coletadas durante a navegação neste site.',
  ],
  sections: [
    {
      title: '1. Quais dados coletamos',
      paragraphs: [
        'Coletamos apenas os dados que você mesmo informa ao preencher o formulário de contato: nome, empresa (opcional), país, e-mail, WhatsApp ou telefone (opcional), tipo de serviço, orçamento estimado (opcional, quando disponível), idioma de atendimento e a descrição do projeto.',
      ],
    },
    {
      title: '2. Como usamos os dados',
      paragraphs: [
        'Usamos essas informações exclusivamente para responder ao seu contato e, se houver interesse mútuo, avançar em uma proposta comercial. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.',
      ],
    },
    {
      title: '3. Envio por WhatsApp e e-mail',
      paragraphs: [
        'Dependendo da configuração do formulário no momento do seu contato, os dados podem ser enviados diretamente para o WhatsApp ou o e-mail da HR Tech, abertos no seu próprio dispositivo. Nesse caso, o envio segue as políticas de privacidade do WhatsApp e do seu provedor de e-mail.',
      ],
    },
    {
      title: '4. Cookies e armazenamento no navegador',
      paragraphs: [
        'Este site não utiliza cookies próprios de rastreamento. Guardamos no seu navegador (armazenamento local) apenas o idioma que você escolheu e, quando aplicável, a sua decisão sobre cookies de análise.',
        'Usamos o Google Analytics para medir a audiência de forma agregada. Para visitantes do Espaço Econômico Europeu, do Reino Unido e da Suíça, os cookies de análise só são ativados depois do consentimento; sem ele, o Google Analytics funciona sem gravar cookies. O tratamento desses dados segue a política de privacidade do Google.',
      ],
    },
    {
      title: '5. Seus direitos',
      paragraphs: [
        'Você pode solicitar a qualquer momento o acesso, a correção ou a exclusão dos dados que nos enviou, nos termos da Lei Geral de Proteção de Dados (LGPD), pelo e-mail {email}.',
      ],
    },
    {
      title: '6. Contato',
      paragraphs: ['Dúvidas sobre esta política podem ser enviadas para {email}.'],
    },
  ],
};

export const terms: LegalDocument = {
  metaTitle: 'Termos de Uso',
  metaDescription: 'Condições de uso do site institucional da HR Tech Sistemas.',
  title: 'Termos de Uso',
  updated: 'Última atualização: outubro de 2026.',
  intro: [
    'Estes termos regulam o uso do site institucional da {company} ({site}). Ao navegar neste site, você concorda com as condições descritas abaixo.',
  ],
  sections: [
    {
      title: '1. Sobre o conteúdo',
      paragraphs: ['Os textos, imagens, identidade visual e código deste site pertencem à HR Tech Sistemas ou são utilizados sob licença adequada.'],
    },
    {
      title: '2. Uso permitido',
      paragraphs: [
        'O conteúdo deste site pode ser acessado livremente para fins informativos. A reprodução, cópia ou redistribuição do conteúdo sem autorização prévia não é permitida.',
      ],
    },
    {
      title: '3. Orçamentos e propostas',
      paragraphs: [
        'As informações enviadas pelo formulário de contato são usadas apenas para elaborar uma resposta ou proposta comercial. O envio do formulário não representa contratação de serviço — toda contratação é formalizada em contrato específico.',
      ],
    },
    {
      title: '4. Disponibilidade',
      paragraphs: [
        'Buscamos manter o site sempre disponível, mas não garantimos ausência de interrupções para manutenção ou por fatores fora do nosso controle.',
      ],
    },
    {
      title: '5. Idiomas',
      paragraphs: [
        'O site está disponível em português, inglês e espanhol. Em caso de divergência entre as versões destes termos, prevalece a versão em português.',
      ],
    },
    {
      title: '6. Alterações',
      paragraphs: ['Estes termos podem ser atualizados periodicamente. A versão vigente é sempre a publicada nesta página.'],
    },
    {
      title: '7. Contato',
      paragraphs: ['Dúvidas sobre estes termos podem ser enviadas para {email}.'],
    },
  ],
};
