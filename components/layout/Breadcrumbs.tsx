import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo';
import { localeFromPathname } from '@/lib/i18n';

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const locale = localeFromPathname(items[0]?.path ?? '/');
  const label = locale === 'pt-BR' ? 'Você está em' : locale === 'es' ? 'Usted está en' : 'You are here';
  return (
    <>
      <nav aria-label={label} className="font-mono text-[11px] uppercase tracking-[0.14em]">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-subtle">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-muted">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="transition-colors hover:text-fg">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(items)} />
    </>
  );
}
