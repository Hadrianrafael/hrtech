'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/ai-team', label: 'Equipe IA', exact: true },
  { href: '/ai-team/ceo', label: 'Central do CEO' },
  { href: '/ai-team/tasks', label: 'Tarefas' },
  { href: '/ai-team/approvals', label: 'Aprovações' },
  { href: '/ai-team/memory', label: 'Memória' },
  { href: '/ai-team/costs', label: 'Custos' },
  { href: '/ai-team/settings', label: 'Configurações' },
];

export function AiTeamTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Equipe IA" className="-mx-4 mb-4 overflow-x-auto border-b px-4 sm:-mx-6 sm:px-6">
      <ul className="flex gap-1 text-sm">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href || pathname.startsWith('/ai-team/agents') : pathname.startsWith(t.href) || (t.href === '/ai-team/ceo' && pathname.startsWith('/ai-team/objectives'));
          return (
            <li key={t.href}>
              <Link href={t.href} className={cn('-mb-px inline-block whitespace-nowrap border-b-2 px-3 py-2 transition', active ? 'border-brand font-medium text-fg' : 'border-transparent text-fg-muted hover:text-fg')}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
