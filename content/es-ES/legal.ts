import type { LegalDocument } from '../types';

export const privacy: LegalDocument = {
  metaTitle: 'Política de privacidad',
  metaDescription: 'Cómo HR Tech Sistemas recoge, utiliza y protege los datos enviados a través de este sitio web.',
  title: 'Política de privacidad',
  updated: 'Última actualización: octubre de 2026.',
  intro: [
    'Esta política explica cómo {company} ({site}) trata la información que envías mediante el formulario de contacto y la que se recoge durante la navegación por este sitio web.',
  ],
  sections: [
    {
      title: '1. Qué datos recogemos',
      paragraphs: [
        'Solo recogemos los datos que tú mismo introduces en el formulario de contacto: nombre, empresa (opcional), país, correo electrónico, WhatsApp o teléfono (opcional), tipo de servicio, presupuesto estimado (opcional, cuando se ofrece), idioma de atención y descripción del proyecto.',
      ],
    },
    {
      title: '2. Para qué los usamos',
      paragraphs: [
        'Utilizamos esta información exclusivamente para responder a tu consulta y, si hay interés mutuo, avanzar en una propuesta comercial. No vendemos, alquilamos ni cedemos tus datos a terceros con fines de marketing.',
      ],
    },
    {
      title: '3. Envío por WhatsApp y correo electrónico',
      paragraphs: [
        'Según la configuración del formulario en el momento de tu contacto, los datos pueden enviarse directamente al WhatsApp o al correo de HR Tech, que se abren en tu propio dispositivo. En ese caso, el envío se rige por las políticas de privacidad de WhatsApp y de tu proveedor de correo.',
      ],
    },
    {
      title: '4. Cookies y almacenamiento en el navegador',
      paragraphs: [
        'Este sitio no utiliza cookies propias de seguimiento. Guarda en tu navegador (almacenamiento local) únicamente el idioma que has elegido y, cuando corresponda, tu decisión sobre las cookies de analítica.',
        'Utilizamos Google Analytics para medir la audiencia de forma agregada. Para los visitantes del Espacio Económico Europeo, el Reino Unido y Suiza, las cookies de analítica solo se activan con tu consentimiento; sin él, Google Analytics funciona sin guardar cookies. A ese tratamiento le es aplicable la política de privacidad de Google.',
      ],
    },
    {
      title: '5. Tus derechos',
      paragraphs: [
        'Puedes solicitar en cualquier momento el acceso, la rectificación, la supresión, la limitación, la oposición o la portabilidad de los datos que nos has enviado, conforme al Reglamento General de Protección de Datos (RGPD) y a la normativa española aplicable, escribiendo a {email}. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).',
      ],
    },
    {
      title: '6. Responsable del tratamiento',
      paragraphs: [
        'El responsable del tratamiento es {company}, con sede en Suzano (São Paulo), Brasil. Para cualquier duda sobre esta política, escribe a {email}.',
      ],
    },
  ],
};

export const terms: LegalDocument = {
  metaTitle: 'Términos de uso',
  metaDescription: 'Condiciones de uso del sitio web de HR Tech Sistemas.',
  title: 'Términos de uso',
  updated: 'Última actualización: octubre de 2026.',
  intro: ['Estos términos regulan el uso del sitio web de {company} ({site}). Al navegar por este sitio aceptas las condiciones que se describen a continuación.'],
  sections: [
    {
      title: '1. Sobre el contenido',
      paragraphs: ['Los textos, imágenes, la identidad visual y el código de este sitio pertenecen a HR Tech Sistemas o se utilizan bajo la licencia adecuada.'],
    },
    {
      title: '2. Uso permitido',
      paragraphs: ['El contenido de este sitio puede consultarse libremente con fines informativos. No se permite su reproducción, copia ni redistribución sin autorización previa.'],
    },
    {
      title: '3. Presupuestos y propuestas',
      paragraphs: [
        'La información enviada mediante el formulario de contacto se utiliza únicamente para elaborar una respuesta o una propuesta comercial. El envío del formulario no supone la contratación de ningún servicio: toda contratación se formaliza en un contrato específico.',
      ],
    },
    {
      title: '4. Disponibilidad',
      paragraphs: ['Procuramos mantener el sitio siempre disponible, pero no garantizamos la ausencia de interrupciones por mantenimiento o por causas ajenas a nuestro control.'],
    },
    {
      title: '5. Idiomas',
      paragraphs: ['El sitio está disponible en portugués, inglés y español. En caso de discrepancia entre las versiones de estos términos, prevalece la versión en portugués.'],
    },
    {
      title: '6. Cambios',
      paragraphs: ['Estos términos pueden actualizarse periódicamente. La versión vigente es siempre la publicada en esta página.'],
    },
    {
      title: '7. Contacto',
      paragraphs: ['Las dudas sobre estos términos pueden enviarse a {email}.'],
    },
  ],
};
