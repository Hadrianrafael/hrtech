import type { Metadata } from 'next';
import { IconBrandWhatsapp, IconMail, IconClock } from '@tabler/icons-react';
import { Card, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';
import { ContactForm } from '@/components/ContactForm';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a HR Tech — solicite um orçamento ou tire suas dúvidas sobre nossos serviços.',
};

export default function ContatoPage() {
  return (
    <Section size="lg">
      <Container>
        <Reveal>
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contato' }]} />
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
            Vamos conversar sobre o seu projeto.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/55 md:text-lg">
            Conte o que você precisa — respondemos com um plano claro de como a HR Tech pode ajudar.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr]">
          <Reveal delay={0.05} className="flex flex-col gap-7 border-t border-border pt-7">
            <div className="flex items-start gap-3">
              <IconBrandWhatsapp size={20} className="mt-0.5 shrink-0 text-brand-orange" />
              <div>
                <h3 className="text-sm font-semibold text-ink">WhatsApp</h3>
                <a
                  href={siteConfig.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-ink/55 transition-colors hover:text-ink"
                >
                  Falar agora
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconMail size={20} className="mt-0.5 shrink-0 text-brand-orange" />
              <div>
                <h3 className="text-sm font-semibold text-ink">E-mail</h3>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="mt-1 block text-sm text-ink/55 transition-colors hover:text-ink"
                >
                  {siteConfig.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconClock size={20} className="mt-0.5 shrink-0 text-brand-orange" />
              <div>
                <h3 className="text-sm font-semibold text-ink">Tempo de resposta</h3>
                <p className="mt-1 text-sm text-ink/55">Respondemos em até 1 dia útil.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Card padding="lg" variant="elevated">
              <ContactForm />
            </Card>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
