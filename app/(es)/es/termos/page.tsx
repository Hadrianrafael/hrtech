import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Términos de Uso', description: 'Condiciones de uso del sitio institucional de HR Tech Sistemas.', path: '/es/termos/', locale: 'es', noIndex: true });
export default function TermsPage() { return <LegalContent kind="terms" locale="es" />; }
