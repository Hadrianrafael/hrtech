import { SolutionsContent } from '@/components/sections/SolutionsContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Soluciones', description: 'Conozca los servicios de HR Tech Sistemas: sitios web, sistemas empresariales, SaaS, Inteligencia Artificial, automatización, comercio electrónico e infraestructura en la nube.', path: '/es/solucoes/', locale: 'es' });

export default function SolutionsPage() {
  return <SolutionsContent locale="es" />;
}
