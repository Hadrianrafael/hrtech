import { Icon } from '@/components/icons/Icon';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Faq as FaqItem } from '@/content/types';
import { faqSchema } from '@/lib/seo';
import type { Locale } from '@/lib/i18n/config';

/**
 * Lista de perguntas e respostas. Todo o texto fica no HTML (os itens apenas começam
 * recolhidos) e os dados estruturados descrevem exatamente o que está visível.
 */
export function FaqList({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  return (
    <>
      <div className="divide-y divide-line/[0.08] overflow-hidden rounded-2xl border border-line/[0.08] bg-surface/50">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-fg marker:hidden sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
              {item.question}
              <Icon name="chevronDown" size={18} className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{item.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqSchema(items, locale)} />
    </>
  );
}
