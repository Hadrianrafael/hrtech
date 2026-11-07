import { SolutionsContent } from '@/components/sections/SolutionsContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Solutions',
  description: 'Explore HR Tech Sistemas services: websites, business systems, SaaS, Artificial Intelligence, automation, e-commerce and cloud infrastructure.',
  path: '/solucoes/',
});

export default function SolutionsPage() {
  return <SolutionsContent locale="en-US" />;
}
