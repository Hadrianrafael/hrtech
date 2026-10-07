/**
 * Catálogo de permissões. Papéis (de sistema ou personalizados) são combinações destas chaves.
 * Para adicionar um novo nível de acesso basta criar um Role com o subconjunto desejado.
 */
export const PERMISSIONS = {
  'dashboard.view': 'Ver dashboard',
  'contacts.read': 'Ver leads e clientes',
  'contacts.write': 'Criar e editar leads e clientes',
  'contacts.delete': 'Excluir/anonimizar contatos (LGPD)',
  'contacts.export': 'Exportar dados de contatos (LGPD)',
  'records.view_all': 'Ver registros de toda a equipe (sem esta permissão, apenas os próprios e não atribuídos)',
  'pipeline.manage': 'Configurar funis e etapas',
  'opportunities.write': 'Movimentar oportunidades',
  'inbox.use': 'Atender conversas',
  'inbox.assign': 'Atribuir conversas a outros atendentes',
  'tasks.manage': 'Gerenciar tarefas',
  'calendar.manage': 'Gerenciar agenda',
  'automations.manage': 'Gerenciar automações',
  'chatbot.manage': 'Configurar chatbot e IA',
  'knowledge.manage': 'Gerenciar base de conhecimento',
  'integrations.manage': 'Gerenciar integrações e canais',
  'analytics.view': 'Ver métricas',
  'team.view': 'Ver equipe',
  'team.manage': 'Convidar e administrar usuários',
  'roles.manage': 'Gerenciar papéis e permissões',
  'settings.manage': 'Configurações da empresa',
  'billing.view': 'Ver plano e assinatura',
  'billing.manage': 'Alterar plano e assinatura',
  'audit.view': 'Ver logs de auditoria',
  'ai.use': 'Usar recursos de IA (sugestões, resumos)',
  'ai_team.view': 'Ver a Equipe IA (agentes, tarefas, resultados e custos)',
  'ai_team.command': 'Enviar objetivos e comandos ao CEO Agent',
  'ai_team.approve': 'Aprovar ou rejeitar ações sensíveis dos agentes de IA',
  'ai_team.manage': 'Configurar agentes, prompts, ferramentas, limites, n8n e pausar a Equipe IA',
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

const AGENT: Permission[] = [
  'dashboard.view', 'contacts.read', 'contacts.write', 'opportunities.write', 'inbox.use',
  'tasks.manage', 'calendar.manage', 'ai.use', 'team.view',
];

const MANAGER: Permission[] = [
  ...AGENT, 'records.view_all', 'inbox.assign', 'analytics.view', 'contacts.export',
  'knowledge.manage', 'automations.manage', 'pipeline.manage', 'billing.view',
  'ai_team.view', 'ai_team.command',
];

export const SYSTEM_ROLES: { key: string; name: string; description: string; permissions: Permission[] }[] = [
  { key: 'org_admin', name: 'Administrador', description: 'Administra toda a organização.', permissions: ALL_PERMISSIONS },
  { key: 'manager', name: 'Gestor', description: 'Acompanha equipe, CRM, métricas e conversas.', permissions: MANAGER },
  { key: 'agent', name: 'Atendente/Vendedor', description: 'Trabalha leads, conversas, tarefas e agenda.', permissions: AGENT },
];

export function isPermission(value: string): value is Permission {
  return value in PERMISSIONS;
}
