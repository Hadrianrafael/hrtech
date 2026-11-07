import { SolutionsContent } from '@/components/sections/SolutionsContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Soluções', description: 'Conheça os serviços da HR Tech Sistemas: sites, sistemas, SaaS, Inteligência Artificial, automações, e-commerce e infraestrutura em nuvem.', path: '/pt-br/solucoes/', locale: 'pt-BR' });

export default function SolutionsPage() {
  return <SolutionsContent locale="pt-BR" />;
}
