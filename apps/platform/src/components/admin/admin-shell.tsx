'use client';

import { ArrowLeft, Building2, CreditCard, LayoutDashboard, LogOut, ScrollText, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/actions/auth';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/organizations', label: 'Empresas', icon: Building2 },
  { href: '/admin/plans', label: 'Planos', icon: CreditCard },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/logs', label: 'Logs e erros', icon: ScrollText },
];

export function AdminShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Logo />
          <span className="rounded-md bg-fg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bg">Admin plataforma</span>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Administração">
            {NAV.map((n) => {
              const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm', active ? 'bg-brand-soft font-medium text-brand' : 'text-fg-muted hover:bg-muted hover:text-fg')}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
            <Link href="/dashboard" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-fg-muted hover:bg-muted"><ArrowLeft className="h-3.5 w-3.5" /> Aplicação</Link>
            <ThemeToggle />
            <span className="hidden text-xs text-fg-muted sm:inline">{userName}</span>
            <form action={logoutAction}><button type="submit" className="rounded-lg p-2 text-fg-muted hover:bg-muted" aria-label="Sair"><LogOut className="h-4 w-4" /></button></form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden" aria-label="Administração (mobile)">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn('whitespace-nowrap rounded-lg px-2.5 py-1 text-xs', pathname === n.href ? 'bg-brand-soft text-brand' : 'text-fg-muted')}>{n.label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}

