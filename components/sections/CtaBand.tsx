import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { whatsappLink } from '@/lib/whatsapp';

type CtaBandProps = { title?: string; text?: string };

export function CtaBand({
  title = 'Tem uma ideia? Vamos transformá-la em tecnologia.',
  text = 'Conte o que você precisa e receba os próximos passos para tirar o projeto do papel.',
}: CtaBandProps) {
  return (
    <section className="pb-24 lg:pb-32">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/20 via-surface to-surface px-6 py-12 sm:px-12 sm:py-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_80%_at_100%_0%,#000,transparent)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <ButtonLink href="/#contato" size="lg">
                Solicitar orçamento
                <Icon name="arrowRight" size={16} />
              </ButtonLink>
              <ButtonLink href={whatsappLink()} external size="lg" variant="secondary">
                <BrandIcon name="whatsapp" size={17} />
                WhatsApp
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
