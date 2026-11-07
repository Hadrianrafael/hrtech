import ServicePage, { generateMetadata as serviceMetadata, generateStaticParams } from '@/app/(en)/solucoes/[slug]/page';

export { generateStaticParams };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return serviceMetadata({ params, locale: 'es' });
}

export default function SpanishServicePage({ params }: { params: Promise<{ slug: string }> }) {
  return <ServicePage params={params} locale="es" />;
}
