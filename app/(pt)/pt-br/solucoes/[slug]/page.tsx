import ServicePage, { generateMetadata as serviceMetadata, generateStaticParams } from '@/app/(en)/solucoes/[slug]/page';

export { generateStaticParams };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return serviceMetadata({ params, locale: 'pt-BR' });
}

export default function PortugueseServicePage({ params }: { params: Promise<{ slug: string }> }) {
  return <ServicePage params={params} locale="pt-BR" />;
}
