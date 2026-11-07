import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { localeConfig, type Locale } from '@/lib/i18n';

export function NotFoundContent({ locale }: { locale: Locale }) {
  const copy = {
    'en-US': ['Page not found', 'The address you tried to open does not exist or has moved.', 'Back to home'],
    'pt-BR': ['Página não encontrada', 'O endereço que você tentou acessar não existe ou foi movido.', 'Voltar para o início'],
    es: ['Página no encontrada', 'La dirección que intentó abrir no existe o fue trasladada.', 'Volver al inicio'],
  }[locale];
  return <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-[var(--header-h)] text-center">
    <p className="font-mono text-sm text-brand-soft">404</p>
    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{copy[0]}</h1>
    <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{copy[1]}</p>
    <ButtonLink href={`${localeConfig[locale].prefix}/`} size="lg" className="mt-8">{copy[2]}<Icon name="arrowRight" size={16} /></ButtonLink>
  </section>;
}
