import { processSteps } from './process';
import { segments } from './segments';
import { techGroups } from './technologies';
import type { Locale } from '@/lib/i18n';

export function getProcessSteps(locale: Locale) {
  if (locale === 'pt-BR') return processSteps;
  const copy = {
    'en-US': [
      ['Discovery', 'We understand the business, audience and problem to solve.', 'Discovery meeting', 'Mapping the current process', 'Project goals'],
      ['Strategy', 'We define architecture, features, priorities and user experience.', 'Scope and priorities', 'Technical architecture', 'Flows and prototype'],
      ['Development', 'We build in short cycles while you follow the progress.', 'Incremental delivery', 'Reviewed and versioned code', 'Staging environment'],
      ['Testing', 'We validate performance, security, accessibility and behavior on every screen.', 'Automated tests', 'Mobile, tablet and desktop tests', 'Security review'],
      ['Launch', 'We publish the solution with the domain and monitoring configured.', 'Production deployment', 'Domain and HTTPS', 'Analytics and Search Console'],
      ['Evolution', 'We follow real usage and develop the next improvements.', 'Support and maintenance', 'New features', 'Continuous improvement'],
    ],
    es: [
      ['Descubrimiento', 'Entendemos el negocio, el público y el problema que hay que resolver.', 'Reunión inicial', 'Análisis del proceso actual', 'Objetivos del proyecto'],
      ['Estrategia', 'Definimos arquitectura, funciones, prioridades y experiencia de usuario.', 'Alcance y prioridades', 'Arquitectura técnica', 'Flujos y prototipo'],
      ['Desarrollo', 'Construimos en ciclos cortos para que usted siga el avance.', 'Entregas incrementales', 'Código revisado y versionado', 'Entorno de pruebas'],
      ['Pruebas', 'Validamos rendimiento, seguridad, accesibilidad y comportamiento en cada pantalla.', 'Pruebas automatizadas', 'Pruebas en móvil, tableta y escritorio', 'Revisión de seguridad'],
      ['Lanzamiento', 'Publicamos la solución con el dominio y el monitoreo configurados.', 'Despliegue en producción', 'Dominio y HTTPS', 'Analytics y Search Console'],
      ['Evolución', 'Seguimos el uso real y desarrollamos las siguientes mejoras.', 'Soporte y mantenimiento', 'Nuevas funciones', 'Mejora continua'],
    ],
  }[locale];
  return processSteps.map((step, index) => ({ ...step, title: copy[index]![0]!, text: copy[index]![1]!, details: copy[index]!.slice(2) }));
}

export function getSegments(locale: Locale) {
  if (locale === 'pt-BR') return segments;
  const copy = {
    'en-US': [
      ['Hospitality', 'Websites with reservations, availability and automated support.'],
      ['Events', 'Registration, digital invitations, check-in and attendee management.'],
      ['Healthcare', 'Online scheduling, reminders and an online presence for clinics.'],
      ['Legal', 'Case, deadline, document and client service management.'],
      ['Construction', 'Project, budget, purchase and report management.'],
      ['Energy', 'Monitoring dashboards, proposals and installation management.'],
      ['Retail', 'E-commerce, inventory, orders and payment integration.'],
      ['Services', 'Scheduling, CRM, recurring billing and support automation.'],
    ],
    es: [
      ['Hotelería', 'Sitios con reservas, disponibilidad y atención automatizada.'],
      ['Eventos', 'Inscripciones, invitaciones digitales, registro y gestión de participantes.'],
      ['Salud', 'Citas en línea, recordatorios y presencia digital para clínicas.'],
      ['Sector jurídico', 'Gestión de casos, plazos, documentos y atención a clientes.'],
      ['Construcción', 'Control de obras, presupuestos, compras e informes.'],
      ['Energía', 'Paneles de monitoreo, propuestas y gestión de instalaciones.'],
      ['Comercio', 'Comercio electrónico, inventario, pedidos e integración de pagos.'],
      ['Servicios', 'Agenda, CRM, cobros recurrentes y automatización de la atención.'],
    ],
  }[locale];
  return segments.map((segment, index) => ({ ...segment, name: copy[index]![0]!, example: copy[index]![1]! }));
}

export function getTechGroups(locale: Locale) {
  if (locale === 'pt-BR') return techGroups;
  const copy = {
    'en-US': [
      ['Frontend', 'Fast, accessible and responsive interfaces.'],
      ['Backend', 'Well-organized APIs and business logic.'],
      ['Cloud', 'Cloud infrastructure for web applications.'],
      ['Database', 'Consistent, secure and performant data.'],
      ['DevOps', 'Version control, testing and automated deployment.'],
      ['Artificial Intelligence', 'Language models applied to business needs.'],
      ['Automation', 'Monitored workflows that run on their own.'],
      ['Integrations', 'Connections with the tools your business already uses.'],
    ],
    es: [
      ['Frontend', 'Interfaces rápidas, accesibles y adaptables.'],
      ['Backend', 'API y lógica de negocio bien organizadas.'],
      ['Nube', 'Infraestructura en la nube para aplicaciones web.'],
      ['Bases de datos', 'Datos consistentes, seguros y eficientes.'],
      ['DevOps', 'Control de versiones, pruebas y despliegue automatizado.'],
      ['Inteligencia Artificial', 'Modelos de lenguaje aplicados al negocio.'],
      ['Automatización', 'Flujos supervisados que funcionan de forma autónoma.'],
      ['Integraciones', 'Conexión con las herramientas que su negocio ya usa.'],
    ],
  }[locale];
  const names = locale === 'es'
    ? { 'Rotinas agendadas': 'Tareas programadas', 'Filas e novas tentativas': 'Colas y reintentos' }
    : { 'Agentes de IA': 'AI agents', 'Rotinas agendadas': 'Scheduled jobs', 'Filas e novas tentativas': 'Queues and retries' };
  return techGroups.map((group, index) => ({
    ...group,
    title: copy[index]![0]!,
    description: copy[index]![1]!,
    items: group.items.map((item) => ({ ...item, name: names[item.name as keyof typeof names] ?? item.name })),
  }));
}
