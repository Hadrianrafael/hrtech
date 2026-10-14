import type { ServiceContent } from '../types';
import type { ServiceId } from '@/lib/i18n/routes';

export const services: Record<ServiceId, ServiceContent> = {
  web: {
    title: 'Desarrollo web',
    metaTitle: 'Desarrollo de páginas web para pymes y empresas',
    metaDescription:
      'Creación de páginas web corporativas, landing pages y webs multilingües rápidas, adaptadas al móvil y optimizadas para Google. Desarrollo y mantenimiento web.',
    heading: 'Desarrollo de páginas web profesionales',
    summary: 'Webs corporativas, landing pages y sitios a medida que cargan rápido, se posicionan en Google y convierten visitas en contactos.',
    intro:
      'Tu web suele ser el primer contacto de un cliente con tu empresa. Desarrollamos webs a medida, sin plantillas genéricas, pensadas para cargar rápido, funcionar bien en el móvil y convertir visitas en conversaciones.',
    problems: [
      { title: 'Una web lenta o anticuada', text: 'Las páginas que tardan en abrir o fallan en el móvil hacen que el visitante se marche antes de contactar.' },
      { title: 'Poca visibilidad en Google', text: 'Sin una base técnica de SEO, la web no aparece cuando los clientes buscan lo que ofreces.' },
      { title: 'Visitas que no se convierten en contactos', text: 'Sin llamadas a la acción claras, un formulario sencillo y WhatsApp a mano, el interés se pierde.' },
    ],
    capabilities: [
      'Webs corporativas',
      'Landing pages para campañas',
      'Webs para pymes y autónomos',
      'Sitios premium con animaciones',
      'Diseño 100 % adaptable a móvil',
      'Webs multilingües',
      'SEO técnico preparado para Google',
      'Google Analytics y Search Console',
      'Formularios e integración con WhatsApp',
      'Reservas y citas online',
      'Mantenimiento y evolución de la web',
    ],
    approach: [
      { title: 'Diseño propio', text: 'Un diseño creado para tu marca y tu público, no una plantilla genérica con tu logotipo.' },
      { title: 'Rendimiento', text: 'Código ligero, imágenes optimizadas y carga bajo demanda para obtener buenas puntuaciones en Lighthouse.' },
      { title: 'Preparada para crecer', text: 'Contenido organizado para añadir fácilmente nuevas páginas, idiomas e integraciones.' },
    ],
    faq: [
      {
        question: '¿Hacéis webs para pequeñas empresas y autónomos?',
        answer:
          'Sí. Desarrollamos desde landing pages y webs corporativas sencillas hasta sitios más grandes con muchas páginas e integraciones, siempre dimensionados al objetivo y al momento de tu negocio.',
      },
      {
        question: '¿Puede mi web estar en más de un idioma?',
        answer:
          'Sí. Creamos webs multilingües con una URL propia para cada idioma, marcado hreflang para los buscadores y contenido adaptado a cada mercado, igual que en este mismo sitio.',
      },
      {
        question: '¿Os encargáis del mantenimiento de la web?',
        answer:
          'Sí. Además del desarrollo, nos ocupamos del mantenimiento: actualización de contenidos, nuevas páginas, mejoras de rendimiento y seguimiento en Google Search Console.',
      },
    ],
  },
  software: {
    title: 'Software a medida',
    metaTitle: 'Desarrollo de software a medida y CRM para empresas',
    metaDescription:
      'Aplicaciones web a medida, CRM, paneles de control y sistemas de gestión para empresas, con integraciones entre herramientas, control de accesos y datos seguros.',
    heading: 'Software a medida para tu operativa',
    summary: 'Aplicaciones web a medida, CRM, paneles de control y portales que ordenan tu operativa y sustituyen las hojas de cálculo.',
    intro:
      'Cuando las hojas de cálculo se quedan cortas, es hora de tener un sistema. Desarrollamos aplicaciones web a medida para el proceso real de tu empresa, desde el alta de datos hasta el informe, con control de accesos, datos seguros y una interfaz sencilla para tu equipo.',
    problems: [
      { title: 'Operativa atrapada en hojas de cálculo', text: 'La información dispersa entre hojas de cálculo y mensajes genera trabajo repetido, errores y falta de visión de conjunto.' },
      { title: 'Herramientas que no se hablan entre sí', text: 'Los mismos datos se teclean dos veces en herramientas distintas, sin conexión entre ventas, facturación y atención al cliente.' },
      { title: 'Software estándar que no encaja', text: 'Las herramientas genéricas te obligan a adaptar tu proceso al programa, y no al revés.' },
    ],
    capabilities: [
      'Aplicaciones web a medida',
      'CRM a medida',
      'Cuadros de mando e informes',
      'Paneles de administración',
      'Sistemas de gestión y ERP a medida',
      'Portales para clientes y colaboradores',
      'APIs REST',
      'Integraciones entre sistemas',
      'Modelado de datos y bases de datos',
      'Control de accesos por perfiles',
    ],
    approach: [
      { title: 'Primero el proceso, luego el código', text: 'Analizamos cómo funciona hoy tu operativa antes de definir pantallas y reglas.' },
      { title: 'Arquitectura sólida', text: 'Reglas de negocio separadas de la interfaz, pruebas automatizadas y código documentado.' },
      { title: 'Entregas incrementales', text: 'Revisas y validas el sistema por fases, no solo al final.' },
    ],
    faq: [
      {
        question: '¿Software a medida o un programa estándar?',
        answer:
          'El software estándar cubre el proceso medio de un sector; el software a medida se construye para el tuyo. Si una herramienta existente resuelve bien tu caso, te lo decimos, y si hace falta, integramos el nuevo sistema con ella.',
      },
      {
        question: '¿Desarrolláis CRM a medida?',
        answer:
          'Sí. Desarrollamos CRM con embudo de ventas, historial de clientes, tareas e integraciones con WhatsApp, correo y tu web, adaptados a cómo trabaja tu equipo comercial.',
      },
      {
        question: '¿Se puede integrar con las herramientas que ya usamos?',
        answer:
          'En la mayoría de los casos sí, siempre que la herramienta actual ofrezca API o exportación de datos. Evaluamos las integraciones posibles en la fase de descubrimiento.',
      },
    ],
  },
  saas: {
    title: 'Plataformas SaaS',
    metaTitle: 'Desarrollo de plataformas SaaS a medida',
    metaDescription:
      'Desarrollo de plataformas SaaS multiempresa con suscripciones, cobros recurrentes, permisos y una arquitectura preparada para escalar, del MVP a la operación.',
    heading: 'Desarrollo de plataformas SaaS',
    summary: 'Plataformas SaaS multiempresa con suscripciones, cobros recurrentes y una arquitectura preparada para escalar.',
    intro:
      'Convertir una idea en un producto digital requiere mucho más que pantallas: hacen falta cuentas de empresa, planes, cobro recurrente, permisos y una base que aguante el crecimiento. Desarrollamos plataformas SaaS completas, del MVP a la operación diaria.',
    problems: [
      { title: 'Una idea sin producto validado', text: 'Invertir meses en funcionalidades antes de probar con clientes reales aumenta el riesgo del proyecto.' },
      { title: 'Una base técnica que no escala', text: 'Un MVP hecho con prisas se convierte en un freno cuando llegan nuevos clientes, planes e integraciones.' },
      { title: 'Cobros y accesos manuales', text: 'Gestionar suscripciones, impagos y permisos a mano consume tiempo y provoca errores.' },
    ],
    capabilities: [
      'Arquitectura multiempresa (multi-tenant)',
      'Planes, suscripciones y cobro recurrente',
      'Pagos con Stripe',
      'Paneles de cliente y de administración',
      'Permisos por perfil (RBAC)',
      'Notificaciones por correo y WhatsApp',
      'Internacionalización',
      'Onboarding y páginas públicas',
    ],
    approach: [
      { title: 'Un MVP enfocado', text: 'Empezamos por lo que valida el producto, sobre una base técnica que permita seguir evolucionando.' },
      { title: 'Aislamiento de datos', text: 'Cada cliente solo ve sus propios datos: por diseño, no como un parche.' },
      { title: 'Pensado para producción', text: 'Colas, tareas programadas, webhooks y registros diseñados para la operación real.' },
    ],
    faq: [
      {
        question: '¿Podéis desarrollar el MVP de nuestro SaaS?',
        answer:
          'Sí. Empezamos por el conjunto mínimo de funcionalidades que valida el producto, sobre una base lista para incorporar planes, cobro recurrente y nuevos clientes sin reescribir el sistema.',
      },
      {
        question: '¿Cómo se separan los datos de cada cliente?',
        answer:
          'Usamos una arquitectura multiempresa en la que cada empresa solo ve sus datos, con el aislamiento aplicado en el código y, cuando el proyecto lo requiere, también en la base de datos.',
      },
    ],
  },
  ai: {
    title: 'Chatbots con IA',
    metaTitle: 'Chatbots con inteligencia artificial para empresas',
    metaDescription:
      'Desarrollo de chatbots y asistentes virtuales con inteligencia artificial para tu web y WhatsApp, conectados a tus sistemas y con traspaso a una persona cuando hace falta.',
    heading: 'Chatbots y asistentes virtuales con inteligencia artificial',
    summary: 'Chatbots, agentes de IA y atención automatizada en tu web y WhatsApp, conectados a los datos y sistemas de tu empresa.',
    intro:
      'La IA útil es la que está conectada a tu negocio. Desarrollamos asistentes y agentes que atienden a clientes, consultan información, reservan citas y ejecutan tareas, con límites claros sobre lo que pueden hacer y traspaso a una persona cuando es necesario.',
    problems: [
      { title: 'Un equipo saturado de preguntas repetidas', text: 'Las consultas sobre horarios, precios y disponibilidad ocupan a tu equipo y dejan a los clientes esperando.' },
      { title: 'Contactos perdidos fuera de horario', text: 'Los mensajes que llegan por la noche o en fin de semana se quedan sin respuesta y el cliente acaba en la competencia.' },
      { title: 'Chatbots rígidos', text: 'Los flujos de botones que no entienden lo que escribe el cliente frustran más de lo que ayudan.' },
    ],
    capabilities: [
      'Chatbots para web y WhatsApp',
      'Asistentes virtuales con IA',
      'Automatización de la atención al cliente',
      'Agentes de IA con herramientas',
      'IA integrada en tus sistemas actuales',
      'Clasificación y extracción de documentos',
      'Automatización de procesos con IA',
    ],
    approach: [
      { title: 'Alcance controlado', text: 'El agente solo accede a lo que necesita y cada acción queda registrada.' },
      { title: 'Una persona en el circuito', text: 'Cuando la IA no debe responder, la conversación pasa a tu equipo.' },
      { title: 'Modelos de referencia', text: 'Trabajamos con las API de los principales proveedores de modelos de lenguaje.' },
    ],
    faq: [
      {
        question: '¿El chatbot puede funcionar en WhatsApp?',
        answer:
          'Sí. Integramos la API oficial de WhatsApp (WhatsApp Business Platform) y seguimos las normas de Meta: el cliente debe haber aceptado recibir mensajes y, fuera de la ventana de atención, se usan plantillas aprobadas.',
      },
      {
        question: '¿Puede la IA dar una respuesta incorrecta?',
        answer:
          'Los modelos de lenguaje pueden equivocarse. Por eso limitamos el asistente a la información y las acciones que tú defines, registramos las conversaciones y derivamos a una persona los casos delicados o dudosos.',
      },
      {
        question: '¿Qué modelos de IA utilizáis?',
        answer:
          'Trabajamos con las API de proveedores como Anthropic (Claude) y OpenAI. La elección depende del caso de uso, del coste y de los requisitos de privacidad del proyecto.',
      },
    ],
  },
  automation: {
    title: 'Automatización de procesos',
    metaTitle: 'Automatización de procesos empresariales e integraciones',
    metaDescription:
      'Automatización de procesos e integraciones entre sistemas: recordatorios, mensajes por WhatsApp y correo, informes automáticos y flujos que eliminan el trabajo manual.',
    heading: 'Automatización de procesos empresariales',
    summary: 'Flujos automáticos que conectan tus herramientas, envían mensajes y acaban con las tareas manuales repetitivas.',
    intro:
      'Buena parte del tiempo de tu equipo se va en copiar datos, enviar recordatorios y revisar hojas de cálculo. Automatizamos esas tareas conectando las herramientas que ya usas, con seguimiento y control de errores.',
    problems: [
      { title: 'Tareas manuales repetitivas', text: 'Copiar datos entre sistemas, enviar recordatorios y preparar informes ocupa horas cada semana.' },
      { title: 'Errores y olvidos', text: 'Los procesos que dependen de que alguien se acuerde fallan justo en los días de más trabajo.' },
      { title: 'Herramientas aisladas', text: 'Formularios, hojas de cálculo, CRM y facturación sin integración obligan al equipo a hacer de puente a mano.' },
    ],
    capabilities: [
      'Integración entre sistemas y API',
      'Recordatorios y notificaciones automáticas',
      'Mensajes por WhatsApp y correo',
      'Tareas programadas',
      'Procesamiento de hojas de cálculo y archivos',
      'Webhooks',
      'Informes automáticos',
    ],
    approach: [
      { title: 'Localizar el cuello de botella', text: 'Identificamos las tareas que más tiempo consumen y con más riesgo de error.' },
      { title: 'Automatización fiable', text: 'Colas, reintentos automáticos y alertas cuando algo falla.' },
      { title: 'Medir la mejora', text: 'Cada automatización tiene un objetivo claro y verificable.' },
    ],
    faq: [
      {
        question: '¿Qué tipo de procesos se pueden automatizar?',
        answer:
          'Tareas repetitivas con reglas claras: envío de recordatorios y reclamaciones de cobro, alta de contactos procedentes de la web, generación de informes, sincronización de datos entre sistemas y procesamiento de hojas de cálculo y archivos.',
      },
      {
        question: '¿Y si una automatización falla?',
        answer: 'Las automatizaciones incluyen reintentos automáticos, un registro de cada ejecución y alertas cuando algo va mal, para que ningún fallo pase desapercibido.',
      },
    ],
  },
  ecommerce: {
    title: 'Tiendas online',
    metaTitle: 'Desarrollo de tiendas online y e-commerce',
    metaDescription:
      'Creación de tiendas online en Shopify o a medida, con pasarelas de pago, control de stock, integraciones con ERP y marketplaces, y un proceso de compra pensado para el móvil.',
    heading: 'Desarrollo de tiendas online',
    summary: 'Tiendas online con pagos, integraciones y una experiencia de compra pensada para el móvil.',
    intro:
      'Vender por internet exige una tienda rápida, fiable y fácil de gestionar. Configuramos tiendas en plataformas consolidadas como Shopify o desarrollamos soluciones a medida cuando tu negocio tiene reglas propias.',
    problems: [
      { title: 'Ventas dependientes de marketplaces', text: 'Vender solo en marketplaces implica comisiones altas y poco control sobre la relación con el cliente.' },
      { title: 'Un proceso de compra que ahuyenta', text: 'Demasiados pasos, lentitud y una mala experiencia en el móvil aumentan el abandono del carrito.' },
      { title: 'Stock descuadrado', text: 'Pedidos, inventario y pagos sin integración llevan a vender productos que ya no tienes.' },
    ],
    capabilities: [
      'Tiendas online',
      'Shopify',
      'Soluciones de e-commerce a medida',
      'Integración con pasarelas de pago',
      'Control de stock',
      'Integraciones con ERP y marketplaces',
      'Checkout optimizado para móvil',
    ],
    approach: [
      { title: 'La plataforma adecuada', text: 'Recomendamos Shopify cuando encaja y desarrollo a medida cuando de verdad hace falta.' },
      { title: 'Conversión', text: 'Fichas de producto y checkout diseñados para reducir el abandono.' },
      { title: 'Operativa conectada', text: 'Stock, pedidos y pagos funcionando juntos.' },
    ],
    faq: [
      {
        question: '¿Shopify o una tienda a medida?',
        answer:
          'Cuando tu operativa sigue el patrón habitual del comercio, una plataforma como Shopify suele ser más rápida y económica. Desarrollamos a medida cuando tu negocio tiene reglas propias de precios, catálogo o integración.',
      },
      {
        question: '¿La tienda puede vender a otros países?',
        answer:
          'Sí, la tienda puede ser multilingüe y trabajar con más de una moneda. Los medios de pago, los impuestos y el envío internacional se estudian caso por caso, según la plataforma elegida.',
      },
    ],
  },
  cloud: {
    title: 'Cloud e infraestructura',
    metaTitle: 'Cloud e infraestructura en Microsoft Azure y AWS',
    metaDescription:
      'Despliegues, servidores, bases de datos gestionadas, contenedores y pipelines de CI/CD en Microsoft Azure y AWS para aplicaciones web, con foco en coste y seguridad.',
    heading: 'Cloud e infraestructura para aplicaciones web',
    summary: 'Despliegues, servidores, bases de datos e infraestructura en Microsoft Azure y AWS para aplicaciones web.',
    intro:
      'Un buen software necesita una buena casa. Montamos la infraestructura de tus aplicaciones en la nube (contenedores, bases de datos gestionadas, colas, almacenamiento y pipelines de despliegue) cuidando el coste, la seguridad y la disponibilidad.',
    problems: [
      { title: 'Despliegues manuales y arriesgados', text: 'Publicar versiones a mano aumenta el riesgo de errores y de caídas del servicio.' },
      { title: 'Costes de nube sin control', text: 'Recursos sobredimensionados u olvidados generan facturas mayores de lo que el proyecto necesita.' },
      { title: 'Credenciales expuestas', text: 'Las contraseñas y claves de API guardadas en el código o en mensajes son un riesgo serio de seguridad.' },
    ],
    capabilities: [
      'Microsoft Azure',
      'AWS',
      'Despliegue continuo (CI/CD)',
      'Contenedores con Docker',
      'Bases de datos gestionadas',
      'Configuración de servidores y dominios',
      'Gestión de secretos y credenciales',
      'Monitorización y registros',
    ],
    approach: [
      { title: 'Infraestructura como código', text: 'Entornos reproducibles, documentados y versionados.' },
      { title: 'Costes bajo control', text: 'Recursos dimensionados para el momento del proyecto.' },
      { title: 'Seguridad', text: 'Credenciales en cajas fuertes, accesos mínimos y HTTPS en todo.' },
    ],
    faq: [
      {
        question: '¿Trabajáis con Azure y AWS?',
        answer: 'Sí. Desplegamos aplicaciones en Microsoft Azure y AWS con contenedores, bases de datos gestionadas, almacenamiento y pipelines de despliegue automatizado.',
      },
      {
        question: '¿Podéis haceros cargo de una infraestructura que ya existe?',
        answer:
          'Sí. Empezamos con un análisis del entorno actual (costes, seguridad y puntos de fallo) y proponemos mejoras por fases, sin interrumpir la operación.',
      },
    ],
  },
};
