import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';
import { homeSectionPath } from '@/lib/i18n/routes';
import { whatsappLink } from '@/lib/whatsapp';

type CtaBandProps = { locale: Locale; title?: string; text?: string; whatsappMessage?: string };

export function CtaBand({ locale, title, text, whatsappMessage }: CtaBandProps) {
  const dict = getDictionary(locale);
  return (
    <section className="pb-24 lg:pb-32">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/20 via-surface to-surface px-6 py-12 sm:px-12 sm:py-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_80%_at_100%_0%,#000,transparent)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-4xl">{title ?? dict.cta.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{text ?? dict.cta.text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <ButtonLink href={homeSectionPath(locale, 'contact')} size="lg">
                {dict.cta.primary}
                <Icon name="arrowRight" size={16} />
              </ButtonLink>
              <ButtonLink href={whatsappLink(whatsappMessage ?? dict.whatsapp.defaultMessage)} external size="lg" variant="secondary" data-track="whatsapp_click">
                <BrandIcon name="whatsapp" size={17} />
                {dict.cta.whatsapp}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
