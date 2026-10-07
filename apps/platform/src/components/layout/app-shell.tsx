'use client';

import {
  BarChart3, BookOpen, Bot, CalendarDays, CheckSquare, ChevronsUpDown, CreditCard, KanbanSquare, LayoutDashboard, LogOut, Menu, MessagesSquare,
  Moon, Plug, Settings, Shield, Sun, UserCog, Users, Workflow, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { logoutAction, switchOrganizationAction } from '@/app/actions/auth';
import { Avatar } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import type { NavItem } from './nav';

const ICONS = { BarChart3, BookOpen, Bot, CalendarDays, CheckSquare, CreditCard, KanbanSquare, LayoutDashboard, MessagesSquare, Plug, Settings, UserCog, Users, Workflow };
const GROUPS: Record<NavItem['group'], string> = { main: 'Operação', ai: 'IA e automação', admin: 'Administração' };

export interface ShellProps {
  nav: NavItem[];
  user: { name: string; email: string; isPlatformAdmin: boolean };
  org: { id: string; name: string };
  roleName: string | null;
  memberships: { organizationId: string; name: string }[];
  isSupportMode: boolean;
  badges?: Record<string, number>;
  children: ReactNode;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('hrt-theme', next ? 'dark' : 'light');
    } catch {
      /* armazenamento indisponível */
    }
  };
  return (
    <button type="button" onClick={toggle} className="rounded-lg p-2 text-fg-muted hover:bg-muted hover:text-fg" aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AppShell({ nav, user, org, roleName, memberships, isSupportMode, badges = {}, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [orgMenu, setOrgMenu] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Navegação principal">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/dashboard"><Logo /></Link>
        <button type="button" className="rounded p-1 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative border-b p-3">
        <button
          type="button"
          onClick={() => setOrgMenu((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border bg-bg px-2.5 py-2 text-left hover:bg-muted"
          aria-expanded={orgMenu}
        >
          <Avatar name={org.name} size={26} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{org.name}</span>
            <span className="block truncate text-[11px] text-fg-muted">{isSupportMode ? 'Modo suporte HR Tech' : roleName}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-fg-muted" />
        </button>
        {orgMenu && (
          <div className="absolute inset-x-3 top-full z-20 mt-1 rounded-lg border bg-surface p-1 shadow-pop">
            {memberships.map((m) => (
              <button
                key={m.organizationId}
                type="button"
                onClick={() => switchOrganizationAction(m.organizationId)}
                className={cn('w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', m.organizationId === org.id && 'font-semibold text-brand')}
              >
                {m.name}
              </button>
            ))}
            {user.isPlatformAdmin && (
              <Link href="/admin" className="mt-1 flex items-center gap-2 border-t px-2 py-1.5 text-sm text-fg-muted hover:text-fg">
                <Shield className="h-3.5 w-3.5" /> Painel HR Tech
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin">
        {(Object.keys(GROUPS) as NavItem['group'][]).map((g) => {
          const items = nav.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{GROUPS[g]}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon as keyof typeof ICONS];
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition',
                          active ? 'bg-brand-soft font-medium text-brand' : 'text-fg-muted hover:bg-muted hover:text-fg',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="flex-1">{item.label}</span>
                        {badges[item.href] ? <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-fg">{badges[item.href]}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {user.isPlatformAdmin && (
        <div className="border-t p-3">
          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-fg-muted hover:bg-muted hover:text-fg">
            <Shield className="h-4 w-4" /> Painel HR Tech
          </Link>
        </div>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-surface shadow-pop">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {isSupportMode && (
          <div className="bg-warning px-4 py-1.5 text-center text-xs font-medium text-white">
            Modo suporte: você está acessando {org.name} como administrador da plataforma. Todas as ações são auditadas.
          </div>
        )}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-surface/85 px-4 backdrop-blur">
          <button type="button" className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <div className="flex items-center gap-2 border-l pl-3">
            <Avatar name={user.name} size={28} />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{user.name}</p>
              <p className="text-[11px] leading-tight text-fg-muted">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="rounded-lg p-2 text-fg-muted hover:bg-muted hover:text-fg" aria-label="Sair" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
