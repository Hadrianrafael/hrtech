import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { whatsappLink } from '@/lib/whatsapp';
import { defaultLocale, getUi, localeConfig, whatsappGreeting, type Locale } from '@/lib/i18n';

type CtaBandProps = { title?: string; text?: string; locale?: Locale };

export function CtaBand({
  title,
  text,
  locale = defaultLocale,
}: CtaBandProps) {
  const copy = {
    'en-US': { title: 'Have an idea? Let’s turn it into technology.', text: 'Tell us what you need and learn the next steps to bring your project to life.' },
    'pt-BR': { title: 'Tem uma ideia? Vamos transformá-la em tecnologia.', text: 'Conte o que você precisa e receba os próximos passos para tirar o projeto do papel.' },
    es: { title: '¿Tiene una idea? Convirtámosla en tecnología.', text: 'Cuéntenos qué necesita y conozca los próximos pasos para hacer realidad el proyecto.' },
  }[locale];
  return (
    <section className="pb-24 lg:pb-32">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/20 via-surface to-surface px-6 py-12 sm:px-12 sm:py-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_80%_at_100%_0%,#000,transparent)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-4xl">{title ?? copy.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">{text ?? copy.text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <ButtonLink href={`${localeConfig[locale].prefix}/#contato`} size="lg">
                {getUi(locale).requestQuote}
                <Icon name="arrowRight" size={16} />
              </ButtonLink>
              <ButtonLink href={whatsappLink(whatsappGreeting(locale))} external size="lg" variant="secondary">
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
