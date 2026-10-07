/** Catálogo de ações de automação (usado pelo motor e pelo editor visual). */
export interface ActionParamDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'stage' | 'user' | 'tag';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface ActionDef {
  label: string;
  description: string;
  params: ActionParamDef[];
}

const PRIORITY = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export const ACTIONS: Record<string, ActionDef> = {
  create_task: {
    label: 'Criar tarefa / follow-up',
    description: 'Cria uma tarefa vinculada ao contato.',
    params: [
      { key: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ex.: Ligar para {{contact.name}}' },
      { key: 'type', label: 'Tipo', type: 'select', options: [{ value: 'TASK', label: 'Tarefa' }, { value: 'FOLLOW_UP', label: 'Follow-up' }] },
      { key: 'dueInHours', label: 'Prazo (horas)', type: 'number' },
      { key: 'priority', label: 'Prioridade', type: 'select', options: PRIORITY },
      {
        key: 'assignee',
        label: 'Responsável',
        type: 'select',
        options: [
          { value: 'owner', label: 'Responsável pelo contato' },
          { value: 'round_robin', label: 'Distribuir entre a equipe' },
        ],
      },
    ],
  },
  add_tag: {
    label: 'Aplicar etiqueta',
    description: 'Adiciona uma etiqueta ao contato (cria se não existir).',
    params: [{ key: 'tag', label: 'Etiqueta', type: 'tag', required: true }],
  },
  assign_owner: {
    label: 'Atribuir responsável',
    description: 'Define o vendedor/atendente do contato, oportunidade e conversa.',
    params: [
      { key: 'mode', label: 'Modo', type: 'select', options: [{ value: 'round_robin', label: 'Distribuição automática' }, { value: 'user', label: 'Usuário específico' }] },
      { key: 'userId', label: 'Usuário', type: 'user' },
      { key: 'onlyIfEmpty', label: 'Somente se não houver responsável', type: 'boolean' },
    ],
  },
  move_stage: {
    label: 'Mover etapa do funil',
    description: 'Move a oportunidade aberta do contato para outra etapa.',
    params: [{ key: 'stageKey', label: 'Etapa', type: 'stage', required: true }],
  },
  set_status: {
    label: 'Alterar status do lead',
    description: 'Atualiza o status do contato.',
    params: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'CONTACTED', label: 'Contatado' },
          { value: 'IN_CONVERSATION', label: 'Em conversa' },
          { value: 'QUALIFIED', label: 'Qualificado' },
          { value: 'UNQUALIFIED', label: 'Desqualificado' },
        ],
      },
    ],
  },
  send_message: {
    label: 'Enviar mensagem',
    description: 'Envia uma mensagem na conversa do evento (respeita as regras do canal).',
    params: [{ key: 'text', label: 'Mensagem', type: 'textarea', required: true }],
  },
  pause_ai: {
    label: 'Pausar IA e encaminhar para humano',
    description: 'Interrompe as respostas automáticas na conversa.',
    params: [],
  },
  add_note: {
    label: 'Registrar observação',
    description: 'Adiciona uma observação na timeline do contato.',
    params: [{ key: 'text', label: 'Texto', type: 'textarea', required: true }],
  },
};
