import type { Service } from './services';
import type { Locale } from '@/lib/i18n';

type TranslatedService = Pick<Service, 'title' | 'summary' | 'intro' | 'capabilities' | 'approach'>;

// Stable slugs and technology names remain unchanged across languages.
export const serviceTranslations: Record<Exclude<Locale, 'pt-BR'>, Record<string, TranslatedService>> = {
  'en-US': {
    sites: {
      title: 'Websites',
      summary: 'Fast corporate websites, landing pages and premium sites built to perform in search and generate inquiries.',
      intro: 'A website is often a customer’s first encounter with your company. We build custom websites without off-the-shelf templates, designed to load quickly, work well on mobile and turn visits into conversations.',
      capabilities: ['Corporate websites', 'Campaign landing pages', 'Premium websites with animations', 'Fully responsive layouts', 'Multilingual websites', 'Technical SEO and search-friendly structure', 'Google Analytics and Search Console', 'Forms and WhatsApp integration', 'Online bookings and scheduling', 'Integration with other systems'],
      approach: [
        { title: 'Custom design', text: 'A layout designed for your brand and audience, rather than adapted from a generic theme.' },
        { title: 'Performance', text: 'Lean code, optimized images and on-demand loading aimed at strong Lighthouse scores.' },
        { title: 'Ready to grow', text: 'Content organized to make new pages, languages and integrations easier to add.' },
      ],
    },
    sistemas: {
      title: 'Business systems',
      summary: 'Custom web applications, admin dashboards and portals that organize operations and replace spreadsheets.',
      intro: 'When spreadsheets are no longer enough, it is time for a system. We build web applications tailored to your company’s actual processes, from records to reports, with access controls, protected data and a straightforward interface for your team.',
      capabilities: ['Custom web applications', 'Dashboards and reports', 'Admin dashboards', 'Custom internal systems and ERPs', 'Customer and partner portals', 'REST APIs', 'System integrations', 'Data modeling and databases', 'Role-based access control'],
      approach: [
        { title: 'Process before code', text: 'We map how your operation works today before defining screens and rules.' },
        { title: 'Solid architecture', text: 'Business rules are separate from the interface, with automated tests and documented code.' },
        { title: 'Incremental delivery', text: 'You follow and validate the system in stages, not just at the end.' },
      ],
    },
    saas: {
      title: 'SaaS',
      summary: 'Multi-company SaaS platforms with subscriptions, recurring payments and an architecture designed to scale.',
      intro: 'Turning an idea into a digital product takes more than screens. It requires company accounts, plans, recurring billing, permissions and a foundation that supports growth. We develop complete SaaS platforms, from MVP to day-to-day operation.',
      capabilities: ['Multi-tenant architecture', 'Plans, subscriptions and recurring billing', 'Stripe payments', 'Customer and admin dashboards', 'Role-based permissions (RBAC)', 'Email and WhatsApp notifications', 'Internationalization', 'Onboarding and public pages'],
      approach: [
        { title: 'Focused MVP', text: 'We start with what validates the product while building a technical foundation for its evolution.' },
        { title: 'Data isolation', text: 'Each company sees only its own data by design.' },
        { title: 'Real operations', text: 'Queues, scheduled jobs, webhooks and logs designed for production.' },
      ],
    },
    'inteligencia-artificial': {
      title: 'Artificial Intelligence',
      summary: 'Chatbots, AI agents and automated WhatsApp support integrated with company data and systems.',
      intro: 'Useful AI is connected to your business. We build assistants and agents that answer customers, retrieve information, schedule appointments and carry out tasks, with clear boundaries and handoff to a person when needed.',
      capabilities: ['Website and WhatsApp chatbots', 'AI-assisted support', 'AI agents with tools', 'AI integration with existing systems', 'WhatsApp and AI', 'Document classification and extraction', 'AI process automation'],
      approach: [
        { title: 'Controlled scope', text: 'An agent accesses only what it needs, and every action is logged.' },
        { title: 'Human oversight', text: 'When AI should not answer, the conversation goes to your team.' },
        { title: 'Leading models', text: 'We work with APIs from major language model providers.' },
      ],
    },
    automacoes: {
      title: 'Automation',
      summary: 'Automated workflows that connect tools, send messages and remove repetitive manual tasks.',
      intro: 'Teams spend a great deal of time copying data, sending reminders and checking spreadsheets. We automate those routines by connecting the systems you already use, with monitoring and failure handling.',
      capabilities: ['System and API integration', 'Automated reminders and notifications', 'WhatsApp and email messages', 'Scheduled workflows', 'Spreadsheet and file processing', 'Webhooks', 'Automated reports'],
      approach: [
        { title: 'Find the bottleneck', text: 'We identify the tasks that take the most time and carry the greatest risk of error.' },
        { title: 'Reliable automation', text: 'Queues, automatic retries and alerts when something fails.' },
        { title: 'Measure the impact', text: 'Every automation has a clear, verifiable goal.' },
      ],
    },
    'e-commerce': {
      title: 'E-commerce',
      summary: 'Online stores with payments, integrations and a shopping experience designed for mobile.',
      intro: 'Selling online calls for a fast, reliable store that is easy to manage. We configure stores on established platforms such as Shopify or develop custom solutions when the business needs its own rules.',
      capabilities: ['Online stores', 'Shopify', 'Custom e-commerce solutions', 'Payment integration', 'Inventory management', 'ERP and marketplace integrations', 'Mobile-optimized checkout'],
      approach: [
        { title: 'The right platform', text: 'We recommend Shopify when it fits, and custom development when needed.' },
        { title: 'Conversion', text: 'Product pages and checkout designed to reduce abandonment.' },
        { title: 'Connected operations', text: 'Inventory, orders and payments working together.' },
      ],
    },
    'cloud-infraestrutura': {
      title: 'Cloud & Infrastructure',
      summary: 'Deployment, servers, databases and infrastructure on Microsoft Azure and AWS for web applications.',
      intro: 'Good software needs a good home. We structure cloud infrastructure for applications, including containers, managed databases, queues, storage and deployment pipelines, with attention to cost, security and availability.',
      capabilities: ['Microsoft Azure', 'AWS', 'Continuous deployment (CI/CD)', 'Docker containers', 'Managed databases', 'Server and domain configuration', 'Secret and credential management', 'Monitoring and logs'],
      approach: [
        { title: 'Infrastructure as code', text: 'Reproducible, documented and versioned environments.' },
        { title: 'Costs under control', text: 'Infrastructure sized for the current stage of the project.' },
        { title: 'Security', text: 'Vaulted credentials, least-privilege access and HTTPS throughout.' },
      ],
    },
  },
  es: {
    sites: {
      title: 'Sitios web',
      summary: 'Sitios corporativos, páginas de destino y sitios premium rápidos, preparados para posicionarse en buscadores y generar contactos.',
      intro: 'Un sitio web suele ser el primer contacto de un cliente con su empresa. Creamos sitios a medida, sin plantillas genéricas, para que carguen rápido, funcionen bien en móviles y conviertan visitas en conversaciones.',
      capabilities: ['Sitios web corporativos', 'Páginas de destino para campañas', 'Sitios premium con animaciones', 'Diseños totalmente adaptables', 'Sitios multilingües', 'SEO técnico y estructura para buscadores', 'Google Analytics y Search Console', 'Formularios e integración con WhatsApp', 'Reservas y citas en línea', 'Integración con otros sistemas'],
      approach: [
        { title: 'Diseño propio', text: 'Un diseño creado para su marca y público, sin adaptar un tema genérico.' },
        { title: 'Rendimiento', text: 'Código ligero, imágenes optimizadas y carga bajo demanda para lograr buenos resultados en Lighthouse.' },
        { title: 'Preparado para crecer', text: 'Contenido organizado para facilitar nuevas páginas, idiomas e integraciones.' },
      ],
    },
    sistemas: {
      title: 'Sistemas empresariales',
      summary: 'Aplicaciones web, paneles administrativos y portales a medida que organizan la operación y sustituyen hojas de cálculo.',
      intro: 'Cuando las hojas de cálculo ya no bastan, hace falta un sistema. Creamos aplicaciones web adaptadas a los procesos reales de su empresa, desde registros hasta informes, con control de acceso, datos protegidos y una interfaz sencilla para el equipo.',
      capabilities: ['Aplicaciones web a medida', 'Paneles e informes', 'Paneles administrativos', 'Sistemas internos y ERP a medida', 'Portales para clientes y socios', 'API REST', 'Integración entre sistemas', 'Modelado de datos y bases de datos', 'Control de acceso por roles'],
      approach: [
        { title: 'Procesos antes que código', text: 'Analizamos cómo funciona la operación actual antes de definir pantallas y reglas.' },
        { title: 'Arquitectura sólida', text: 'Reglas de negocio separadas de la interfaz, pruebas automatizadas y código documentado.' },
        { title: 'Entregas incrementales', text: 'Usted acompaña y valida el sistema por etapas, no solo al final.' },
      ],
    },
    saas: {
      title: 'SaaS',
      summary: 'Plataformas SaaS multiempresa con suscripciones, pagos recurrentes y arquitectura preparada para crecer.',
      intro: 'Convertir una idea en producto digital requiere más que pantallas: hacen falta cuentas de empresas, planes, cobros recurrentes, permisos y una base capaz de acompañar el crecimiento. Desarrollamos plataformas SaaS completas, desde el MVP hasta la operación.',
      capabilities: ['Arquitectura multiempresa', 'Planes, suscripciones y cobros recurrentes', 'Pagos con Stripe', 'Paneles de clientes y administración', 'Permisos por roles (RBAC)', 'Notificaciones por correo y WhatsApp', 'Internacionalización', 'Incorporación y páginas públicas'],
      approach: [
        { title: 'MVP enfocado', text: 'Empezamos por lo que valida el producto, con una base técnica que admite su evolución.' },
        { title: 'Aislamiento de datos', text: 'Cada empresa ve solo sus propios datos desde el diseño.' },
        { title: 'Operación real', text: 'Colas, tareas programadas, webhooks y registros pensados para producción.' },
      ],
    },
    'inteligencia-artificial': {
      title: 'Inteligencia Artificial',
      summary: 'Chatbots, agentes de IA y atención automatizada por WhatsApp integrados con los datos y sistemas de la empresa.',
      intro: 'La IA útil está conectada con su negocio. Creamos asistentes y agentes que responden a clientes, consultan información, programan citas y ejecutan tareas, con límites claros y derivación a una persona cuando corresponde.',
      capabilities: ['Chatbots para sitios web y WhatsApp', 'Atención asistida por IA', 'Agentes de IA con herramientas', 'Integración de IA en sistemas existentes', 'WhatsApp e IA', 'Clasificación y extracción de documentos', 'Automatización de procesos con IA'],
      approach: [
        { title: 'Alcance controlado', text: 'El agente accede solo a lo necesario y registra cada acción.' },
        { title: 'Supervisión humana', text: 'Cuando la IA no debe responder, la conversación pasa al equipo.' },
        { title: 'Modelos avanzados', text: 'Trabajamos con API de los principales proveedores de modelos de lenguaje.' },
      ],
    },
    automacoes: {
      title: 'Automatización',
      summary: 'Flujos automáticos que conectan herramientas, envían mensajes y eliminan tareas manuales repetitivas.',
      intro: 'Los equipos dedican mucho tiempo a copiar datos, enviar recordatorios y revisar hojas de cálculo. Automatizamos esas rutinas conectando los sistemas que ya utilizan, con monitoreo y manejo de fallos.',
      capabilities: ['Integración de sistemas y API', 'Recordatorios y notificaciones automáticas', 'Mensajes por WhatsApp y correo', 'Flujos programados', 'Procesamiento de hojas de cálculo y archivos', 'Webhooks', 'Informes automáticos'],
      approach: [
        { title: 'Identificar el cuello de botella', text: 'Detectamos las tareas que consumen más tiempo y tienen mayor riesgo de error.' },
        { title: 'Automatización confiable', text: 'Colas, reintentos automáticos y alertas cuando algo falla.' },
        { title: 'Medir el impacto', text: 'Cada automatización tiene un objetivo claro y verificable.' },
      ],
    },
    'e-commerce': {
      title: 'Comercio electrónico',
      summary: 'Tiendas en línea con pagos, integraciones y una experiencia de compra diseñada para móviles.',
      intro: 'Vender en línea exige una tienda rápida, confiable y fácil de administrar. Configuramos tiendas en plataformas consolidadas como Shopify o desarrollamos soluciones a medida cuando el negocio necesita reglas propias.',
      capabilities: ['Tiendas en línea', 'Shopify', 'Soluciones de comercio electrónico a medida', 'Integración de pagos', 'Control de inventario', 'Integraciones con ERP y marketplaces', 'Proceso de pago optimizado para móviles'],
      approach: [
        { title: 'La plataforma adecuada', text: 'Recomendamos Shopify cuando encaja y desarrollo propio cuando hace falta.' },
        { title: 'Conversión', text: 'Páginas de producto y proceso de pago pensados para reducir el abandono.' },
        { title: 'Operación integrada', text: 'Inventario, pedidos y pagos conectados entre sí.' },
      ],
    },
    'cloud-infraestrutura': {
      title: 'Nube e infraestructura',
      summary: 'Despliegue, servidores, bases de datos e infraestructura en Microsoft Azure y AWS para aplicaciones web.',
      intro: 'Un buen software necesita un buen entorno. Diseñamos infraestructura en la nube para aplicaciones, con contenedores, bases de datos administradas, colas, almacenamiento y canales de despliegue, cuidando el costo, la seguridad y la disponibilidad.',
      capabilities: ['Microsoft Azure', 'AWS', 'Despliegue continuo (CI/CD)', 'Contenedores Docker', 'Bases de datos administradas', 'Configuración de servidores y dominios', 'Gestión de secretos y credenciales', 'Monitoreo y registros'],
      approach: [
        { title: 'Infraestructura como código', text: 'Entornos reproducibles, documentados y versionados.' },
        { title: 'Costos controlados', text: 'Infraestructura dimensionada para la etapa actual del proyecto.' },
        { title: 'Seguridad', text: 'Credenciales en bóvedas, accesos mínimos y HTTPS en todo el sistema.' },
      ],
    },
  },
};

export function translatedService(service: Service, locale: Locale): Service {
  if (locale === 'pt-BR') return service;
  const translation = serviceTranslations[locale][service.slug];
  if (!translation) throw new Error(`Missing ${locale} translation for ${service.slug}`);
  return { ...service, ...translation };
}
