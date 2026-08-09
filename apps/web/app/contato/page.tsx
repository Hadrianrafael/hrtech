import { IconBrandWhatsapp, IconBrandInstagram, IconMail, IconClock, IconArrowRight } from '@tabler/icons-react';
import { Button, Card, Reveal, Container, Section, Breadcrumb } from '@hrtech/ui';
import { ContactForm } from '@/components/ContactForm';
import { siteConfig } from '@/lib/site-config';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata(
  'Contato',
  'Fale com a HR Tech — solicite um orçamento ou tire suas dúvidas sobre nossos serviços.',
  '/contato',
);

export default function ContatoPage() {
  return (
    <>
      <Section size="lg">
        <Container>
          <Reveal>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contato' }]} />
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Vamos conversar sobre o seu projeto.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/55 md:text-lg">
              Conte o que você precisa — respondemos com um plano claro de como a HR Tech pode ajudar.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* CTA direto — para quem quer agilidade */}
      <Section className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-lg">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">
                Prefere ir direto ao ponto?
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                Fale agora pelo WhatsApp ou envie um e-mail.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noreferrer"
                size="lg"
                iconLeft={<IconBrandWhatsapp size={18} />}
              >
                Chamar no WhatsApp
              </Button>
              <Button href={`mailto:${siteConfig.email}`} variant="secondary" size="lg" iconLeft={<IconMail size={18} />}>
                Enviar e-mail
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Formulário */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr]">
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
              <div className="flex items-start gap-3">
                <IconBrandInstagram size={20} className="mt-0.5 shrink-0 text-brand-orange" />
                <div>
                  <h3 className="text-sm font-semibold text-ink">Instagram</h3>
                  <a
                    href={siteConfig.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-ink/55 transition-colors hover:text-ink"
                  >
                    Seguir a HR Tech
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Card padding="lg" variant="elevated">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-brand-orange">
                  Solicitar orçamento
                </span>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">
                  Vamos transformar sua ideia em tecnologia?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  Conte o que sua empresa precisa e vamos conversar sobre a melhor solução.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section size="lg" className="bg-dark-bg">
        <Container>
          <Reveal className="flex flex-col items-center border-t border-dark-border pt-16 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Ainda não sabe exatamente o que precisa?
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/50">
              Sem problema — conte o contexto do seu negócio e ajudamos a definir o melhor caminho.
            </p>
            <div className="mt-8">
              <Button href={siteConfig.whatsappHref} target="_blank" rel="noreferrer" iconRight={<IconArrowRight size={16} />}>
                Falar com a HR Tech
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
