import type { IconName } from '@/components/icons/Icon';

export type Segment = { name: string; icon: IconName; example: string };

/**
 * Setores que podem usar as soluções da HR Tech.
 * Não é uma lista de clientes — é uma lista de possibilidades.
 */
export const segments: Segment[] = [
  { name: 'Hotelaria', icon: 'bed', example: 'Sites com reservas, disponibilidade e atendimento automático.' },
  { name: 'Eventos', icon: 'ticket', example: 'Inscrições, convites digitais, check-in e gestão de participantes.' },
  { name: 'Saúde', icon: 'heart', example: 'Agendamento online, lembretes e presença digital para clínicas.' },
  { name: 'Jurídico', icon: 'scale', example: 'Gestão de processos, prazos, documentos e atendimento a clientes.' },
  { name: 'Construção', icon: 'building', example: 'Controle de obras, orçamentos, compras e relatórios.' },
  { name: 'Energia', icon: 'bolt', example: 'Dashboards de monitoramento, propostas e gestão de instalações.' },
  { name: 'Comércio', icon: 'store', example: 'E-commerce, estoque, pedidos e integrações com pagamento.' },
  { name: 'Serviços', icon: 'briefcase', example: 'Agenda, CRM, cobrança recorrente e automação do atendimento.' },
];
