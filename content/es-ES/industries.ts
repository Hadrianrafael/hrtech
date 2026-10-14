import type { IndustryContent } from '../types';
import type { IndustryId } from '@/lib/i18n/routes';

/**
 * Páginas por sector. Describen lo que podemos desarrollar para cada sector:
 * no son casos de éxito ni una lista de clientes.
 */
export const industries: Record<IndustryId, IndustryContent> = {
  hospitality: {
    name: 'Hoteles y alojamientos',
    metaTitle: 'Webs y chatbots para hoteles y alojamientos',
    metaDescription:
      'Desarrollo web para hoteles, hostales y casas rurales: reserva directa, chatbot con IA en WhatsApp, webs multilingües para huéspedes extranjeros e integraciones con motores de reservas.',
    heading: 'Tecnología para hoteles y alojamientos',
    summary: 'Webs pensadas para la reserva directa, atención automática por WhatsApp y páginas en varios idiomas para huéspedes internacionales.',
    intro:
      'Hoteles y alojamientos dependen de buenas fotos, respuestas rápidas y una reserva sin fricciones. Desarrollamos webs, chatbots e integraciones que ayudan a captar más reservas directas y a atender a los huéspedes a cualquier hora, en español, inglés o portugués.',
    challenges: [
      {
        title: 'Dependencia de las agencias de viajes online',
        text: 'Cuando casi todas las reservas llegan por plataformas como Booking.com o Airbnb, el alojamiento paga comisión por cada noche y casi no tiene contacto directo con el huésped.',
      },
      {
        title: 'Las mismas preguntas todo el día',
        text: 'Disponibilidad, tarifas, desayuno, mascotas, aparcamiento: recepción responde una y otra vez los mismos mensajes, también de madrugada.',
      },
      {
        title: 'Huéspedes extranjeros sin información en su idioma',
        text: 'Sin una web en otros idiomas, al viajero extranjero le cuesta entender las habitaciones, las condiciones y cómo reservar.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Una web orientada a la reserva directa',
        text: 'Un sitio rápido con galería de fotos, habitaciones, servicios, mapa y un camino corto hasta la reserva: mediante el motor de reservas que ya usas, un formulario de solicitud o WhatsApp.',
      },
      {
        service: 'ai',
        title: 'Un asistente con IA en WhatsApp y en tu web',
        text: 'Responde a las dudas frecuentes con la información de tu alojamiento, recoge fechas y número de huéspedes y pasa la conversación a recepción para confirmar.',
      },
      {
        service: 'automation',
        title: 'Mensajes automáticos a los huéspedes',
        text: 'Confirmaciones de reserva, instrucciones de llegada y solicitudes de opinión enviadas automáticamente, respetando el consentimiento del huésped.',
      },
      {
        service: 'software',
        title: 'Integraciones y paneles',
        text: 'Conexión con tu motor de reservas o channel manager (cuando el proveedor ofrece API) y paneles con la ocupación y el origen de las reservas.',
      },
    ],
    features: [
      'Galerías de fotos optimizadas para móvil',
      'Páginas de habitaciones y servicios',
      'Web en español, inglés y portugués',
      'Botones de reserva y WhatsApp siempre visibles',
      'Mapa e indicaciones de cómo llegar',
      'Medición del origen de las reservas en Google Analytics',
    ],
    note: {
      title: 'Las integraciones dependen de tus proveedores',
      text: 'La conexión con motores de reservas, channel managers y agencias online depende de la API y de las normas de cada proveedor. Comprobamos qué es posible antes de proponer una solución.',
    },
    faq: [
      {
        question: '¿Puede la web de mi alojamiento recibir reservas directas?',
        answer:
          'Sí. La web puede llevar al huésped al motor de reservas que ya usas, a un formulario de solicitud de reserva o a WhatsApp, según tu forma de trabajar. El objetivo es acortar al máximo el camino hasta la reserva directa.',
      },
      {
        question: '¿Puede el chatbot informar de la disponibilidad?',
        answer:
          'Puede hacerlo si está conectado a un sistema de reservas que ofrezca esa información. Sin integración, el asistente resuelve dudas generales y pasa las solicitudes de reserva a recepción.',
      },
      {
        question: '¿Merece la pena una web en varios idiomas?',
        answer:
          'Si recibes viajeros extranjeros, sí: entienden mejor las habitaciones y las condiciones en su idioma y cada versión puede aparecer en las búsquedas hechas en ese idioma.',
      },
    ],
    whatsappMessage: 'Hola, tengo un hotel o alojamiento y me gustaría hablar de un proyecto tecnológico.',
  },
  solar: {
    name: 'Energía solar',
    metaTitle: 'Webs y CRM para empresas de energía solar',
    metaDescription:
      'Tecnología para instaladoras y empresas de energía solar: webs que generan solicitudes de presupuesto, simulador de ahorro, CRM de propuestas y seguimiento comercial automatizado.',
    heading: 'Tecnología para empresas de energía solar',
    summary: 'Webs que generan solicitudes de presupuesto, simulador de ahorro, CRM de propuestas y seguimiento de las instalaciones.',
    intro:
      'En el sector solar, la venta empieza con una factura de la luz y termina con una instalación bien acompañada. Desarrollamos webs, software y automatizaciones que ordenan ese camino: captar la solicitud, preparar la propuesta, seguir la instalación y mantener la relación después.',
    challenges: [
      {
        title: 'Solicitudes de presupuesto sin cualificar',
        text: 'Muchas solicitudes llegan sin datos básicos, como el importe de la factura, el tipo de inmueble o la localidad, y el equipo pierde tiempo reclamándolos.',
      },
      {
        title: 'Propuestas y seguimiento desordenados',
        text: 'Las propuestas enviadas por mensaje y seguidas en hojas de cálculo dejan que oportunidades interesantes se enfríen.',
      },
      {
        title: 'Posventa sin seguimiento',
        text: 'Tras la instalación, el cliente recibe poca información y se pierden oportunidades de mantenimiento y recomendación.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Una web con simulador de ahorro',
        text: 'Páginas de servicio claras y un simulador que pide los datos adecuados, como el importe medio de la factura, y muestra una estimación inicial, dejando claro que la cifra final depende de una visita técnica.',
      },
      {
        service: 'software',
        title: 'CRM de propuestas',
        text: 'Un embudo desde el presupuesto hasta la instalación, historial de cada cliente, recordatorios de seguimiento e informes de conversión.',
      },
      {
        service: 'ai',
        title: 'Atención al cliente con IA',
        text: 'Un asistente que resuelve dudas frecuentes sobre energía solar, recoge los datos de la solicitud de presupuesto y agenda la visita técnica con tu equipo.',
      },
      {
        service: 'automation',
        title: 'Seguimiento automatizado',
        text: 'Mensajes sobre el avance del proyecto y de la instalación y, cuando el fabricante del inversor ofrece API, paneles con los datos de generación.',
      },
    ],
    features: [
      'Formulario de presupuesto con los datos técnicos adecuados',
      'Simulador de ahorro con aviso de estimación',
      'Embudo de ventas desde el presupuesto hasta la instalación',
      'Cita para la visita técnica',
      'Galería de instalaciones realizadas por tu empresa',
      'Informes del origen de las solicitudes',
    ],
    note: {
      title: 'Estimaciones, no promesas',
      text: 'Los simuladores deben presentar las cifras como estimación, con las hipótesis a la vista. El ahorro real depende del consumo, la tarifa, la irradiación y la normativa vigente, y la web tiene que dejarlo claro.',
    },
    faq: [
      {
        question: '¿Puede la web calcular el ahorro con energía solar?',
        answer:
          'Puede mostrar una estimación inicial a partir de los datos que introduce el visitante, como el importe medio de su factura. El resultado debe aparecer como estimación, con sus hipótesis visibles, y ser confirmado por tu equipo técnico.',
      },
      {
        question: '¿Desarrolláis CRM para instaladoras solares?',
        answer:
          'Sí. El CRM sigue las fases reales de tu venta (presupuesto, visita técnica, propuesta, contrato e instalación) con recordatorios de seguimiento e informes.',
      },
      {
        question: '¿Se pueden mostrar los datos de generación de las instalaciones?',
        answer:
          'Cuando el fabricante del inversor o la plataforma de monitorización ofrecen API, sí. Revisamos la documentación de cada fabricante antes de proponer la integración.',
      },
    ],
    whatsappMessage: 'Hola, tengo una empresa de energía solar y me gustaría hablar de un proyecto tecnológico.',
  },
  veterinary: {
    name: 'Clínicas veterinarias',
    metaTitle: 'Webs, cita online y chatbots para clínicas veterinarias',
    metaDescription:
      'Tecnología para clínicas veterinarias: web profesional, cita online, recordatorios de vacunas por WhatsApp y un asistente con IA para las dudas frecuentes.',
    heading: 'Tecnología para clínicas veterinarias',
    summary: 'Cita online, recordatorios de vacunas y revisiones, web profesional y respuestas automáticas a las dudas frecuentes.',
    intro:
      'Una clínica veterinaria gestiona a la vez una agenda llena, tutores preocupados y muchos mensajes. Desarrollamos webs, software y automatizaciones que ordenan la agenda, recuerdan a los tutores las vacunas y revisiones y liberan a tu equipo para cuidar de los animales.',
    challenges: [
      {
        title: 'Teléfono y WhatsApp saturados',
        text: 'Horarios, precio de la consulta, servicios y peticiones de cita llegan por el mismo canal y al mismo tiempo.',
      },
      {
        title: 'Vacunas y revisiones olvidadas',
        text: 'Sin recordatorios, el tutor se olvida de la fecha de la vacuna o de la revisión y la clínica pierde el seguimiento del paciente.',
      },
      {
        title: 'Agenda y fichas dispersas',
        text: 'Las citas en papel o en herramientas separadas dificultan ver la carga del día y el historial de cada animal.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'La web de la clínica',
        text: 'Servicios, equipo, horarios, ubicación e indicaciones claras, con el contacto de urgencias bien visible si la clínica atiende urgencias.',
      },
      {
        service: 'software',
        title: 'Cita online',
        text: 'Reserva de consultas, vacunas o peluquería desde la web, siguiendo las reglas de horarios que defina la clínica.',
      },
      {
        service: 'automation',
        title: 'Recordatorios automáticos',
        text: 'Avisos de vacunas, desparasitación y revisiones por WhatsApp o correo, enviados solo a los tutores que han aceptado ser contactados.',
      },
      {
        service: 'ai',
        title: 'Asistente para dudas frecuentes',
        text: 'Responde a preguntas sobre horarios, servicios y preparación para procedimientos y deriva directamente a tu equipo cualquier sospecha de urgencia.',
      },
    ],
    features: [
      'Cita online por tipo de servicio',
      'Recordatorios de vacunas y revisiones',
      'Ficha de tutores y mascotas',
      'Páginas de servicios y especialidades',
      'Botón de WhatsApp y mapa de ubicación',
      'Panel con las citas del día',
    ],
    note: {
      title: 'La IA no sustituye al veterinario',
      text: 'El asistente no diagnostica ni recomienda tratamientos. Resuelve dudas administrativas y deriva síntomas y urgencias a un veterinario colegiado.',
    },
    faq: [
      {
        question: '¿Pueden los tutores pedir cita desde la web?',
        answer:
          'Sí. La cita online sigue las reglas de la clínica (tipos de consulta, duración, profesionales y horarios disponibles) y tu equipo ve cada reserva en el panel.',
      },
      {
        question: '¿Cómo funcionan los recordatorios de vacunas?',
        answer:
          'A partir de la fecha registrada, el sistema envía recordatorios por WhatsApp o correo antes del vencimiento, solo a los tutores que han dado su consentimiento.',
      },
      {
        question: '¿Puede el chatbot orientar en caso de urgencia?',
        answer:
          'No. Ante cualquier señal de urgencia, el asistente facilita el contacto de urgencias de la clínica y pasa la conversación a tu equipo. El diagnóstico y la orientación clínica son siempre del veterinario.',
      },
    ],
    whatsappMessage: 'Hola, tengo una clínica veterinaria y me gustaría hablar de un proyecto tecnológico.',
  },
  legal: {
    name: 'Despachos de abogados',
    metaTitle: 'Webs y software para despachos de abogados',
    metaDescription:
      'Webs para despachos de abogados que respetan las normas de publicidad de la abogacía, filtrado de consultas, portal del cliente y control de plazos y documentos.',
    heading: 'Tecnología para despachos de abogados',
    summary: 'Webs informativas acordes con las normas de publicidad de la abogacía, filtrado de consultas, portal del cliente y control de plazos.',
    intro:
      'Los despachos de abogados necesitan transmitir confianza sin caer en la publicidad agresiva y ordenar una rutina llena de plazos, documentos y clientes que piden novedades. Desarrollamos webs y sistemas que respetan las reglas de la profesión y aportan orden al día a día del despacho.',
    challenges: [
      {
        title: 'Una presencia online que no transmite autoridad',
        text: 'Las webs genéricas no explican con claridad las áreas de práctica y no diferencian al despacho.',
      },
      {
        title: 'Clientes que piden novedades constantemente',
        text: 'Los mensajes preguntando por el estado del asunto quitan tiempo a abogados y personal.',
      },
      {
        title: 'Plazos y documentos por todas partes',
        text: 'Controlar plazos, contratos y archivos en carpetas y hojas de cálculo aumenta el riesgo de dejar pasar una fecha importante.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Una web informativa para el despacho',
        text: 'Áreas de práctica explicadas con claridad, presentación del equipo y canales de contacto, dentro de las normas de publicidad aplicables a la abogacía.',
      },
      {
        service: 'ai',
        title: 'Filtrado de consultas',
        text: 'Un formulario o asistente que ordena los datos iniciales de la consulta y agenda una conversación con el abogado, sin emitir asesoramiento jurídico.',
      },
      {
        service: 'software',
        title: 'Portal del cliente y control de plazos',
        text: 'Un área privada para que el cliente siga su asunto y suba documentos, y un panel interno de plazos, tareas y responsables.',
      },
      {
        service: 'automation',
        title: 'Automatización de rutinas',
        text: 'Recordatorios de plazos y reuniones, documentos generados a partir de modelos y organización automática de archivos.',
      },
    ],
    features: [
      'Páginas por área de práctica',
      'Cita para consultas',
      'Portal del cliente con acceso seguro',
      'Control de plazos y tareas',
      'Modelos de documentos',
      'Control de accesos por perfiles',
    ],
    note: {
      title: 'Primero, ética y confidencialidad',
      text: 'El contenido de la web debe ajustarse a las normas de publicidad y deontología de la abogacía que apliquen (en España, el Estatuto General de la Abogacía Española y el Código Deontológico): informativo, sobrio y sin captación indebida de clientela. La revisión final de los textos corresponde siempre al despacho. Los datos de los clientes se tratan con confidencialidad y conforme al RGPD.',
    },
    faq: [
      {
        question: '¿La web del despacho respetará las normas de la abogacía?',
        answer:
          'Preparamos contenidos informativos y sobrios, sin promesas de resultados y sin captación indebida de clientela. Las normas varían según el país y el colegio profesional, por lo que la revisión final de los textos la hace siempre el despacho.',
      },
      {
        question: '¿El chatbot da asesoramiento jurídico?',
        answer: 'No. El asistente solo ordena la información inicial y agenda una conversación con el abogado. Cualquier análisis del asunto lo realiza el profesional.',
      },
      {
        question: '¿Cómo se garantizan la seguridad y el secreto profesional?',
        answer:
          'Los portales y sistemas incluyen control de accesos por perfil, conexiones cifradas y registro de accesos. Los datos se tratan conforme al RGPD y respetando el deber de secreto profesional.',
      },
    ],
    whatsappMessage: 'Hola, tengo un despacho de abogados y me gustaría hablar de un proyecto tecnológico.',
  },
  construction: {
    name: 'Construcción y reformas',
    metaTitle: 'Webs y software para empresas de construcción y reformas',
    metaDescription:
      'Tecnología para constructoras y empresas de reformas: web con portfolio de obras, solicitudes de presupuesto bien cualificadas, control de obra e informes con fotos para el cliente.',
    heading: 'Tecnología para construcción y reformas',
    summary: 'Webs con portfolio de obras, presupuestos ordenados, control de obra e informes con fotos para el cliente.',
    intro:
      'En construcción y reformas, la confianza nace de las obras bien hechas y de un cliente bien informado. Desarrollamos webs, software y automatizaciones que ayudan a captar presupuestos, ordenar la ejecución de las obras y mantener al cliente al día.',
    challenges: [
      {
        title: 'Solicitudes de presupuesto con poca información',
        text: 'Las peticiones que llegan sin medidas, ubicación, fotos o alcance exigen varias rondas de conversación antes de poder estimar nada.',
      },
      {
        title: 'Obras seguidas con mensajes sueltos',
        text: 'Fotos, mediciones y decisiones repartidas en grupos de mensajería dificultan saber qué se acordó.',
      },
      {
        title: 'Costes y compras sin control',
        text: 'Si no se registran materiales, compras y mano de obra por obra, el margen real solo aparece al final, cuando ya es tarde.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Una web con portfolio de obras',
        text: 'Presentación de servicios, galería de obras realizadas por tu empresa y un formulario de presupuesto que pide la información adecuada.',
      },
      {
        service: 'software',
        title: 'Control de obra',
        text: 'Cronograma, fases, compras, materiales y costes por obra, con acceso desde el móvil para el equipo en obra.',
      },
      {
        service: 'automation',
        title: 'Informes para el cliente',
        text: 'Actualizaciones periódicas con fotos y avance de cada fase, enviadas automáticamente o disponibles en un portal.',
      },
      {
        service: 'ai',
        title: 'Primera atención con IA',
        text: 'Un asistente que resuelve dudas frecuentes, recoge los datos de la solicitud de presupuesto y agenda la visita técnica.',
      },
    ],
    features: [
      'Galería de obras por tipo de trabajo',
      'Formulario de presupuesto detallado',
      'Cronograma y fases por obra',
      'Control de compras y materiales',
      'Informes con fotos para el cliente',
      'Acceso desde el móvil para el equipo en obra',
    ],
    note: {
      title: 'Un portfolio real',
      text: 'La galería debe mostrar solo obras de la propia empresa, con autorización de los clientes cuando las imágenes muestren inmuebles identificables.',
    },
    faq: [
      {
        question: '¿Puede la web recibir solicitudes de presupuesto con fotos?',
        answer:
          'Sí. El formulario puede pedir fotos, medidas y ubicación. Para recibir archivos hace falta un servicio de formularios o una API propia, que se define en el proyecto.',
      },
      {
        question: '¿Desarrolláis software para el control de obras?',
        answer:
          'Sí. Se diseña a partir de cómo trabaja tu empresa: fases, cronograma, compras, equipo y costes por obra, con acceso desde el móvil.',
      },
      {
        question: '¿Puede el cliente seguir la obra?',
        answer: 'Sí. Con un portal del cliente o informes automáticos, el cliente recibe el avance de las fases y fotos de la obra sin tener que pedirlo.',
      },
    ],
    whatsappMessage: 'Hola, tengo una empresa de construcción o reformas y me gustaría hablar de un proyecto tecnológico.',
  },
};
