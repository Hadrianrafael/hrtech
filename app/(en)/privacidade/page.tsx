import { LegalContent } from '@/components/sections/LegalContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Privacy Policy', description: 'How HR Tech Sistemas collects, uses and protects information sent through this website.', path: '/privacidade/', noIndex: true });
export default function PrivacyPage() { return <LegalContent kind="privacy" locale="en-US" />; }
