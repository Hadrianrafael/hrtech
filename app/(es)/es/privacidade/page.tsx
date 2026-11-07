import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Política de Privacidad', description: 'Cómo HR Tech Sistemas recopila, utiliza y protege los datos enviados mediante este sitio.', path: '/es/privacidade/', locale: 'es', noIndex: true });
export default function PrivacyPage() { return <LegalContent kind="privacy" locale="es" />; }
