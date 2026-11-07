import { Icon } from '@/components/icons/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSegments } from '@/data/section-translations';
import { defaultLocale, type Locale } from '@/lib/i18n';

export function Segments({ locale = defaultLocale }: { locale?: Locale }) {
  const segments = getSegments(locale);
  const copy = {
    'en-US': ['Industries', 'Technology for different markets', 'Every industry has its own processes. These are some markets that can benefit from the solutions we develop.', 'The industries above illustrate possible applications; they are not a list of clients.'],
    'pt-BR': ['Segmentos', 'Tecnologia para diferentes mercados', 'Cada setor tem processos próprios. Estes são alguns mercados que podem se beneficiar das soluções que desenvolvemos.', 'Os segmentos acima ilustram possibilidades de aplicação e não representam uma lista de clientes.'],
    es: ['Sectores', 'Tecnología para diferentes mercados', 'Cada sector tiene sus propios procesos. Estos son algunos mercados que pueden beneficiarse de nuestras soluciones.', 'Los sectores anteriores ilustran posibles aplicaciones; no son una lista de clientes.'],
  }[locale];
  return (
    <Section id="segmentos" aria-labelledby="segmentos-title" className="border-y border-line/[0.06] bg-surface/30">
      <SectionHeading
        id="segmentos-title"
        eyebrow={copy[0]!}
        title={copy[1]!}
        description={copy[2]!}
      />
      <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((segment, index) => (
          <Reveal as="li" key={segment.name} delay={(index % 4) * 60} className="card card-hover group p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/[0.1] bg-white/[0.03] text-brand-soft transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                <Icon name={segment.icon} size={19} />
              </span>
              <h3 className="text-base font-semibold text-fg">{segment.name}</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{segment.example}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-8 flex items-start gap-2.5 text-sm text-subtle">
        <Icon name="info" size={16} className="mt-0.5 shrink-0" />
        <p>{copy[3]}</p>
      </Reveal>
    </Section>
  );
}
