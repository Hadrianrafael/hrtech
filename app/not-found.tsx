import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-[var(--header-h)] text-center">
      <p className="font-mono text-sm text-brand-soft">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <ButtonLink href="/" size="lg" className="mt-8">
        Voltar para o início
        <Icon name="arrowRight" size={16} />
      </ButtonLink>
    </section>
  );
}
