import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Terms of Use', description: 'Conditions for using the HR Tech Sistemas institutional website.', path: '/termos/', noIndex: true });
export default function TermsPage() { return <LegalContent kind="terms" locale="en-US" />; }
