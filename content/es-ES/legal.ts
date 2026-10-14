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
      title: '1. Responsable del tratamiento',
      paragraphs: [
        'El responsable del tratamiento es {company}, con identificación fiscal brasileña (CNPJ) {cnpj} y sede en Suzano (São Paulo), Brasil. Para cualquier consulta o solicitud sobre privacidad, escribe a {email}.',
      ],
    },
    {
      title: '2. Qué datos recogemos',
      paragraphs: [
        'Solo recogemos los datos que tú mismo introduces en el formulario de contacto: nombre, empresa (opcional), país, correo electrónico, WhatsApp o teléfono (opcional), tipo de servicio, presupuesto estimado (opcional, cuando se ofrece), idioma de atención y descripción del proyecto.',
      ],
    },
    {
      title: '3. Para qué los usamos',
      paragraphs: [
        'Utilizamos esta información exclusivamente para responder a tu consulta y, si hay interés mutuo, avanzar en una propuesta comercial. No vendemos, alquilamos ni cedemos tus datos a terceros con fines de marketing.',
      ],
    },
    {
      title: '4. Envío por WhatsApp y correo electrónico',
      paragraphs: [
        'Este sitio no recibe ni guarda lo que escribes en el formulario: monta el mensaje y abre WhatsApp o tu aplicación de correo en tu propio dispositivo. Los datos solo llegan a HR Tech cuando tú mismo envías el mensaje, y ese envío se rige por las políticas de privacidad de WhatsApp (Meta) y de tu proveedor de correo.',
      ],
    },
    {
      title: '5. Cookies y almacenamiento en el navegador',
      paragraphs: [
        'Este sitio no define cookies de seguimiento propias. Guarda en tu navegador (almacenamiento local) únicamente el idioma que has elegido y tu decisión sobre las cookies de analítica; son datos funcionales, no de seguimiento.',
        'Utilizamos Google Analytics para medir la audiencia, pero solo si lo aceptas, en cualquier país. Hasta que aceptes, el script de Google Analytics no se carga y no se guarda ninguna cookie de analítica. Si lo rechazas, no se carga y eliminamos las cookies de analítica que el sitio puede controlar (_ga, _ga_*, _gid y _gat*). Puedes aceptar, rechazar o cambiar tu decisión en cualquier momento con el enlace «Preferencias de cookies» del pie de página. Si aceptas, Google Analytics guarda cookies de analítica y trata datos de uso conforme a la política de privacidad de Google; no activamos funciones de publicidad ni de personalización. Los datos enviados a Google antes de un rechazo se rigen por la política de Google; para solicitar su supresión, escribe a {email}.',
      ],
    },
    {
      title: '6. Proveedores y transferencias internacionales',
      paragraphs: [
        'Para el funcionamiento del sitio y la atención, pueden tratar datos por cuenta nuestra o por cuenta propia: GitHub (alojamiento del sitio en GitHub Pages, que puede registrar datos técnicos de acceso, como la dirección IP), Google (Google Analytics, solo si lo aceptas), Meta (WhatsApp) y el proveedor de correo que utiliza HR Tech. Estos proveedores pueden tratar datos fuera de tu país, incluidos los Estados Unidos. Como HR Tech tiene su sede en Brasil, los datos que nos envías se tratan en Brasil, un país fuera del Espacio Económico Europeo.',
      ],
    },
    {
      title: '7. Cuánto tiempo los conservamos',
      paragraphs: [
        'Conservamos los datos enviados mediante el formulario durante el tiempo necesario para responder a tu consulta, tramitar una posible propuesta y cumplir obligaciones legales. Puedes pedir su supresión antes, como se indica a continuación.',
      ],
    },
    {
      title: '8. Tus derechos',
      paragraphs: [
        'Puedes solicitar en cualquier momento el acceso, la rectificación, la supresión, la limitación, la oposición o la portabilidad de los datos que nos has enviado, conforme al Reglamento General de Protección de Datos (RGPD) y a la normativa aplicable, escribiendo a {email}. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).',
      ],
    },
    {
      title: '9. Contacto',
      paragraphs: ['Las dudas sobre esta política pueden enviarse a {email}.'],
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
