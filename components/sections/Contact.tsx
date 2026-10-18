import { BrandIcon } from '@/components/icons/BrandIcon';
import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import { getDictionary } from '@/content';
import type { Locale } from '@/lib/i18n/config';
import { homeAnchor } from '@/lib/i18n/routes';
import { whatsappLink } from '@/lib/whatsapp';
import { ContactForm } from './ContactForm';

export function Contact({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const text = dict.contactSection;
  const channels = [
    { label: text.whatsappLabel, value: siteConfig.contact.whatsappDisplay, href: whatsappLink(dict.whatsapp.defaultMessage), external: true, track: 'whatsapp_click', icon: <BrandIcon name="whatsapp" size={19} /> },
    { label: text.emailLabel, value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}`, external: false, track: 'email_click', icon: <Icon name="mail" size={19} /> },
  ];

  return (
    <Section id={homeAnchor(locale, 'contact')} aria-labelledby="contact-title" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[40rem] bg-[radial-gradient(50%_60%_at_50%_100%,rgb(var(--brand)/0.16),transparent)]" />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-soft/60" aria-hidden="true" />
              {text.eyebrow}
            </p>
            <h2 id="contact-title" className="mt-5 text-[2.2rem] font-semibold leading-[1.05] tracking-tightest text-fg sm:text-5xl">
              {text.titleStart}
              <span className="text-gradient">{text.titleHighlight}</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">{text.text}</p>
          </Reveal>

          <Reveal className="mt-10 space-y-3" delay={80}>
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                data-track={channel.track}
                {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="card card-hover group flex items-center gap-4 p-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/[0.12] text-brand-soft">{channel.icon}</span>
                <span className="min-w-0">
                  <span className="block text-xs text-subtle">{channel.label}</span>
                  <span className="block truncate text-[15px] font-medium text-fg">{channel.value}</span>
                </span>
                <Icon name="arrowUpRight" size={17} className="ml-auto shrink-0 text-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
              </a>
            ))}
          </Reveal>
        </div>

        <Reveal className="lg:col-span-7" delay={120}>
          <div className="card relative p-5 sm:p-8 lg:p-10">
            <h3 className="text-lg font-semibold text-fg">{text.formTitle}</h3>
            <p className="mt-1 text-sm text-muted">{text.formSubtitle}</p>
            <div className="mt-7">
              <ContactForm locale={locale} text={dict.form} />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
