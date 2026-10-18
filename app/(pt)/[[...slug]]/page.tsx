import { RenderRoute, metadataFor, resolveRoute, staticParamsFor, type SlugParams } from '@/components/pages/LocaleRoute';

const locale = 'pt-BR';

export const dynamicParams = false;

export function generateStaticParams() {
  return staticParamsFor(locale);
}

export async function generateMetadata({ params }: { params: Promise<SlugParams> }) {
  const { slug } = await params;
  return metadataFor(locale, resolveRoute(locale, slug));
}

export default async function Page({ params }: { params: Promise<SlugParams> }) {
  const { slug } = await params;
  return <RenderRoute locale={locale} route={resolveRoute(locale, slug)} />;
}
