import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Termos de Uso', description: 'Condições de uso do site institucional da HR Tech Sistemas.', path: '/pt-br/termos/', locale: 'pt-BR', noIndex: true });
export default function TermsPage() { return <LegalContent kind="terms" locale="pt-BR" />; }
