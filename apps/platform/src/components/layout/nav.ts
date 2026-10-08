import type { Permission } from '@/lib/auth/permissions';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
  group: 'main' | 'ai' | 'admin';
}

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', permission: 'dashboard.view', group: 'main' },
  { href: '/inbox', label: 'Conversas', icon: 'MessagesSquare', permission: 'inbox.use', group: 'main' },
  { href: '/contacts', label: 'Leads e clientes', icon: 'Users', permission: 'contacts.read', group: 'main' },
  { href: '/pipeline', label: 'Funil (Kanban)', icon: 'KanbanSquare', permission: 'contacts.read', group: 'main' },
  { href: '/calendar', label: 'Agenda', icon: 'CalendarDays', permission: 'calendar.manage', group: 'main' },
  { href: '/tasks', label: 'Tarefas', icon: 'CheckSquare', permission: 'tasks.manage', group: 'main' },
  { href: '/analytics', label: 'Métricas', icon: 'BarChart3', permission: 'analytics.view', group: 'main' },
  { href: '/ai-team', label: 'Equipe IA', icon: 'BrainCircuit', permission: 'ai_team.view', group: 'ai' },
  { href: '/ai-team/ceo', label: 'Central do CEO', icon: 'Crown', permission: 'ai_team.view', group: 'ai' },
  { href: '/chatbot', label: 'Chatbot e IA', icon: 'Bot', permission: 'chatbot.manage', group: 'ai' },
  { href: '/knowledge', label: 'Base de conhecimento', icon: 'BookOpen', permission: 'knowledge.manage', group: 'ai' },
  { href: '/automations', label: 'Automações', icon: 'Workflow', permission: 'automations.manage', group: 'ai' },
  { href: '/integrations', label: 'Integrações', icon: 'Plug', permission: 'integrations.manage', group: 'admin' },
  { href: '/team', label: 'Equipe', icon: 'UserCog', permission: 'team.view', group: 'admin' },
  { href: '/billing', label: 'Plano', icon: 'CreditCard', permission: 'billing.view', group: 'admin' },
  { href: '/settings', label: 'Configurações', icon: 'Settings', group: 'admin' },
];
