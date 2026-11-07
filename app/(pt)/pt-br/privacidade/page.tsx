import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Política de Privacidade', description: 'Como a HR Tech Sistemas coleta, usa e protege os dados enviados pelo site.', path: '/pt-br/privacidade/', locale: 'pt-BR', noIndex: true });
export default function PrivacyPage() { return <LegalContent kind="privacy" locale="pt-BR" />; }
