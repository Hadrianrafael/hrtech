import { companyValues, founder } from './company';
import type { Locale } from '@/lib/i18n';

export function getCompanyValues(locale: Locale) {
  if (locale === 'pt-BR') return companyValues;
  const copy = {
    'en-US': [
      ['Technology', 'Modern tools chosen for what they solve, not for trends.'],
      ['Innovation', 'AI and automation applied where they create real operational value.'],
      ['Performance', 'Fast systems and websites designed to work well even on 4G.'],
      ['Security', 'Access controls, protected data and sound practices from the start.'],
      ['Scalability', 'Architecture prepared to grow with your business.'],
      ['User experience', 'Clear interfaces that teams and customers understand immediately.'],
      ['Results', 'Every project starts with a clear business objective.'],
    ],
    es: [
      ['Tecnología', 'Herramientas modernas elegidas por lo que resuelven, no por moda.'],
      ['Innovación', 'IA y automatización aplicadas donde aportan valor real a la operación.'],
      ['Rendimiento', 'Sistemas y sitios rápidos, diseñados para funcionar bien incluso en 4G.'],
      ['Seguridad', 'Control de acceso, datos protegidos y buenas prácticas desde el inicio.'],
      ['Escalabilidad', 'Arquitectura preparada para crecer junto con el negocio.'],
      ['Experiencia de usuario', 'Interfaces claras que el equipo y los clientes entienden de inmediato.'],
      ['Resultados', 'Cada proyecto comienza con un objetivo de negocio claro.'],
    ],
  }[locale];
  return companyValues.map((value, index) => ({ ...value, title: copy[index]![0]!, text: copy[index]![1]! }));
}

export function getFounder(locale: Locale) {
  if (locale === 'pt-BR') return founder;
  const copy = {
    'en-US': {
      role: 'Founder & Developer — HR Tech Sistemas',
      bio: [
        'Hadrian is a software developer who founded HR Tech to bring companies the technical care expected of large digital products: thoughtful architecture, tested code and reliable infrastructure.',
        'He works across the entire process, from requirements to cloud deployment, on websites, web applications, SaaS platforms, automation and Artificial Intelligence solutions.',
      ],
      areas: ['Software Engineering', 'Web Development', 'Systems and SaaS', 'Infrastructure & Cloud', 'Automation', 'Artificial Intelligence'],
      skills: founder.skills.map((skill) => skill === 'Automações' ? 'Automation' : skill === 'IA' ? 'AI' : skill),
    },
    es: {
      role: 'Fundador y desarrollador — HR Tech Sistemas',
      bio: [
        'Hadrian es desarrollador de software y fundó HR Tech para ofrecer a las empresas el rigor técnico de los grandes productos digitales: arquitectura bien pensada, código probado e infraestructura confiable.',
        'Trabaja en todo el proceso, desde los requisitos hasta el despliegue en la nube, en sitios web, aplicaciones, plataformas SaaS, automatización y soluciones de Inteligencia Artificial.',
      ],
      areas: ['Ingeniería de software', 'Desarrollo web', 'Sistemas y SaaS', 'Infraestructura y nube', 'Automatización', 'Inteligencia Artificial'],
      skills: founder.skills.map((skill) => skill === 'Automações' ? 'Automatización' : skill === 'IA' ? 'IA' : skill),
    },
  }[locale];
  return { ...founder, ...copy };
}
