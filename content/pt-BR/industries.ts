import type { IndustryContent } from '../types';
import type { IndustryId } from '@/lib/i18n/routes';

/**
 * Páginas por segmento. Descrevem o que podemos desenvolver para cada setor —
 * não são cases nem lista de clientes.
 */
export const industries: Record<IndustryId, IndustryContent> = {
  hospitality: {
    name: 'Hotelaria e pousadas',
    metaTitle: 'Sites, reservas e chatbots para hotéis e pousadas',
    metaDescription:
      'Desenvolvimento de sites para hotéis e pousadas com reserva direta, chatbot com IA no WhatsApp, site multilíngue para hóspedes estrangeiros e integrações com sistemas de reserva.',
    heading: 'Tecnologia para hotéis e pousadas',
    summary: 'Sites com reserva direta, atendimento automático no WhatsApp e páginas em vários idiomas para hóspedes estrangeiros.',
    intro:
      'Hotéis e pousadas dependem de fotos bonitas, respostas rápidas e reservas sem atrito. Desenvolvemos sites, chatbots e integrações que ajudam a hospedagem a receber mais reservas diretas e a atender hóspedes a qualquer hora — em português, inglês ou espanhol.',
    challenges: [
      {
        title: 'Dependência das agências online',
        text: 'Quando quase todas as reservas chegam por plataformas como Booking.com e Airbnb, a hospedagem paga comissão em cada diária e tem pouco contato direto com o hóspede.',
      },
      {
        title: 'Perguntas repetidas no WhatsApp',
        text: 'Disponibilidade, preços, café da manhã, pets, estacionamento: a recepção responde as mesmas perguntas o dia inteiro, inclusive de madrugada.',
      },
      {
        title: 'Hóspedes estrangeiros sem informação no idioma deles',
        text: 'Sem site em outros idiomas, o turista estrangeiro tem dificuldade para entender acomodações, políticas e formas de reserva.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Site com foco em reserva direta',
        text: 'Site rápido, com galeria de fotos, acomodações, comodidades, mapa e caminho curto até a reserva — pelo motor de reservas que a hospedagem já usa, por formulário ou pelo WhatsApp.',
      },
      {
        service: 'ai',
        title: 'Assistente com IA no WhatsApp e no site',
        text: 'Responde dúvidas frequentes com base nas informações da hospedagem, coleta datas e número de hóspedes e passa a conversa para a recepção na hora de confirmar.',
      },
      {
        service: 'automation',
        title: 'Mensagens automáticas',
        text: 'Confirmações, orientações de check-in e pedidos de avaliação enviados automaticamente, respeitando o consentimento do hóspede.',
      },
      {
        service: 'software',
        title: 'Integrações e painéis',
        text: 'Integração com o motor de reservas ou channel manager (quando o fornecedor oferece API) e painéis com ocupação e origem das reservas.',
      },
    ],
    features: [
      'Galeria com fotos otimizadas para celular',
      'Páginas de acomodações e comodidades',
      'Site em português, inglês e espanhol',
      'Botões de reserva e WhatsApp sempre visíveis',
      'Mapa e informações de como chegar',
      'Medição da origem das reservas no Google Analytics',
    ],
    note: {
      title: 'Integrações dependem dos fornecedores',
      text: 'A conexão com motores de reserva, channel managers e agências online depende das APIs e das regras de cada fornecedor. Avaliamos o que é possível antes de propor a solução.',
    },
    faq: [
      {
        question: 'O site da pousada pode receber reservas diretas?',
        answer:
          'Sim. O site pode levar o hóspede ao motor de reservas que a hospedagem já usa, a um formulário de pedido de reserva ou ao WhatsApp, conforme a operação. O objetivo é encurtar o caminho até a reserva direta.',
      },
      {
        question: 'O chatbot consegue informar a disponibilidade?',
        answer:
          'Consegue quando há integração com um sistema de reservas que disponibiliza essa informação. Sem integração, o assistente responde dúvidas gerais e encaminha o pedido de reserva para a recepção.',
      },
      {
        question: 'Vale a pena ter o site em outros idiomas?',
        answer:
          'Para hospedagens que recebem turistas estrangeiros, sim: o hóspede entende melhor acomodações e políticas no próprio idioma, e cada versão pode aparecer nas buscas feitas em inglês ou espanhol.',
      },
    ],
    whatsappMessage: 'Olá! Tenho um hotel ou pousada e gostaria de conversar sobre um projeto de tecnologia.',
  },
  solar: {
    name: 'Energia solar',
    metaTitle: 'Sites, CRM e automação para empresas de energia solar',
    metaDescription:
      'Tecnologia para integradoras e empresas de energia solar: sites que geram pedidos de orçamento, simulador de economia, CRM de propostas e automação do atendimento comercial.',
    heading: 'Tecnologia para empresas de energia solar',
    summary: 'Sites que geram pedidos de orçamento, simulador de economia, CRM de propostas e acompanhamento das instalações.',
    intro:
      'No mercado de energia solar, a venda começa com uma conta de luz e termina numa instalação bem acompanhada. Desenvolvemos sites, sistemas e automações que organizam esse caminho: captar o pedido, montar a proposta, acompanhar a instalação e manter o relacionamento depois dela.',
    challenges: [
      {
        title: 'Pedidos sem qualificação',
        text: 'Muitos pedidos de orçamento chegam sem dados básicos, como valor da conta de luz, tipo de imóvel e cidade, e a equipe perde tempo correndo atrás dessas informações.',
      },
      {
        title: 'Propostas e follow-up desorganizados',
        text: 'Propostas enviadas por mensagem e acompanhadas em planilha fazem oportunidades esfriarem sem retorno.',
      },
      {
        title: 'Pós-venda sem acompanhamento',
        text: 'Depois da instalação, o cliente fica sem informações sobre o sistema, e oportunidades de manutenção e indicação se perdem.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Site com simulador de economia',
        text: 'Páginas de serviço claras e um simulador que pede os dados certos — como o valor médio da conta de luz — e mostra uma estimativa inicial, deixando claro que o valor final depende de visita técnica.',
      },
      {
        service: 'software',
        title: 'CRM de propostas',
        text: 'Funil com as etapas do orçamento à instalação, histórico de cada cliente, lembretes de follow-up e relatórios de conversão.',
      },
      {
        service: 'ai',
        title: 'Atendimento com IA',
        text: 'Assistente que responde dúvidas frequentes sobre energia solar, coleta os dados do pedido de orçamento e agenda a visita técnica com a equipe.',
      },
      {
        service: 'automation',
        title: 'Acompanhamento automatizado',
        text: 'Mensagens sobre o andamento do projeto e da instalação e, quando o fabricante do inversor oferece API, painéis com os dados de geração.',
      },
    ],
    features: [
      'Formulário de orçamento com os dados técnicos certos',
      'Simulador de economia com aviso de estimativa',
      'Funil de vendas do orçamento à instalação',
      'Agendamento de visita técnica',
      'Galeria de instalações feitas pela empresa',
      'Relatórios de origem dos pedidos',
    ],
    note: {
      title: 'Estimativas, não promessas',
      text: 'Simuladores devem apresentar os valores como estimativa, com as premissas visíveis. A economia real depende de consumo, tarifa, irradiação e regras da distribuidora — e o site precisa deixar isso claro.',
    },
    faq: [
      {
        question: 'O site pode calcular a economia com energia solar?',
        answer:
          'Pode mostrar uma estimativa inicial a partir de dados informados pelo visitante, como o valor médio da conta de luz. O resultado deve aparecer como estimativa, com as premissas visíveis, e ser confirmado pela equipe técnica.',
      },
      {
        question: 'Vocês desenvolvem CRM para integradoras de energia solar?',
        answer:
          'Sim. O CRM é organizado pelas etapas reais da venda — orçamento, visita técnica, proposta, contrato e instalação — com lembretes de follow-up e relatórios.',
      },
      {
        question: 'É possível mostrar os dados de geração dos sistemas instalados?',
        answer:
          'Quando o fabricante do inversor ou a plataforma de monitoramento oferece API, sim. Avaliamos a documentação de cada fabricante antes de propor a integração.',
      },
    ],
    whatsappMessage: 'Olá! Tenho uma empresa de energia solar e gostaria de conversar sobre um projeto de tecnologia.',
  },
  veterinary: {
    name: 'Clínicas veterinárias',
    metaTitle: 'Sites, agendamento e chatbot para clínicas veterinárias',
    metaDescription:
      'Tecnologia para clínicas veterinárias: site profissional, agendamento online, lembretes de vacinas por WhatsApp e assistente com IA para dúvidas frequentes.',
    heading: 'Tecnologia para clínicas veterinárias',
    summary: 'Agendamento online, lembretes de vacinas e retornos, site profissional e atendimento automático para dúvidas frequentes.',
    intro:
      'Uma clínica veterinária lida ao mesmo tempo com agenda cheia, tutores preocupados e muitas mensagens. Desenvolvemos sites, sistemas e automações que organizam a agenda, lembram os tutores de vacinas e retornos e liberam a equipe para cuidar dos animais.',
    challenges: [
      {
        title: 'Telefone e WhatsApp sobrecarregados',
        text: 'Horário de funcionamento, preço de consulta, serviços e marcações chegam todos pelo mesmo canal, ao mesmo tempo.',
      },
      {
        title: 'Vacinas e retornos esquecidos',
        text: 'Sem lembretes, o tutor perde a data da vacina ou do retorno, e a clínica perde o acompanhamento do paciente.',
      },
      {
        title: 'Agenda e fichas desencontradas',
        text: 'Agendamentos em papel ou em ferramentas separadas dificultam ver a ocupação do dia e o histórico de cada animal.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Site da clínica',
        text: 'Serviços, equipe, horários, localização e orientações claras — com destaque para o contato de urgência quando a clínica oferece esse atendimento.',
      },
      {
        service: 'software',
        title: 'Agendamento online',
        text: 'Marcação de consultas, vacinas ou banho e tosa pelo site, com as regras de horário definidas pela clínica.',
      },
      {
        service: 'automation',
        title: 'Lembretes automáticos',
        text: 'Avisos de vacinas, vermifugação e retornos por WhatsApp ou e-mail, enviados a tutores que autorizaram o contato.',
      },
      {
        service: 'ai',
        title: 'Assistente para dúvidas frequentes',
        text: 'Responde perguntas sobre horários, serviços e preparo para procedimentos e encaminha qualquer suspeita de urgência diretamente para a equipe.',
      },
    ],
    features: [
      'Agendamento online por tipo de serviço',
      'Lembretes de vacinas e retornos',
      'Cadastro de tutores e pets',
      'Página de serviços e especialidades',
      'Botão de WhatsApp e mapa de localização',
      'Painel com os agendamentos do dia',
    ],
    note: {
      title: 'A IA não substitui o veterinário',
      text: 'O assistente não faz diagnóstico nem orienta tratamento. Ele responde dúvidas administrativas e encaminha sintomas e urgências para o médico-veterinário.',
    },
    faq: [
      {
        question: 'O tutor pode agendar a consulta pelo site?',
        answer:
          'Sim. O agendamento online segue as regras da clínica — tipos de atendimento, duração, profissionais e horários disponíveis — e a equipe recebe cada marcação no painel.',
      },
      {
        question: 'Como funcionam os lembretes de vacina?',
        answer:
          'A partir da data registrada, o sistema envia lembretes por WhatsApp ou e-mail antes do vencimento, apenas para tutores que autorizaram esse contato.',
      },
      {
        question: 'O chatbot pode orientar em caso de emergência?',
        answer:
          'Não. Diante de qualquer sinal de urgência, o assistente informa o contato de emergência da clínica e passa a conversa para a equipe. Diagnóstico e orientação clínica são sempre do médico-veterinário.',
      },
    ],
    whatsappMessage: 'Olá! Tenho uma clínica veterinária e gostaria de conversar sobre um projeto de tecnologia.',
  },
  legal: {
    name: 'Escritórios de advocacia',
    metaTitle: 'Sites e sistemas para escritórios de advocacia',
    metaDescription:
      'Sites para escritórios de advocacia dentro das regras de publicidade da OAB, triagem de contatos, portal do cliente e controle de prazos e documentos.',
    heading: 'Tecnologia para escritórios de advocacia',
    summary: 'Sites institucionais dentro das regras da OAB, triagem de contatos, portal do cliente e controle de prazos.',
    intro:
      'Escritórios de advocacia precisam transmitir confiança sem cair na publicidade agressiva e organizar uma rotina cheia de prazos, documentos e clientes pedindo atualização. Desenvolvemos sites e sistemas que respeitam as regras da profissão e trazem ordem ao dia a dia do escritório.',
    challenges: [
      {
        title: 'Presença digital que não transmite autoridade',
        text: 'Sites genéricos não explicam as áreas de atuação com clareza e não diferenciam o escritório.',
      },
      {
        title: 'Clientes pedindo atualização o tempo todo',
        text: 'Mensagens perguntando sobre o andamento do caso tomam o tempo dos advogados e da equipe.',
      },
      {
        title: 'Prazos e documentos espalhados',
        text: 'Controlar prazos, contratos e documentos em pastas e planilhas aumenta o risco de perder uma data importante.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Site institucional informativo',
        text: 'Áreas de atuação explicadas em linguagem clara, apresentação da equipe e canais de contato, dentro das regras de publicidade da advocacia.',
      },
      {
        service: 'ai',
        title: 'Triagem de contatos',
        text: 'Formulário ou assistente que organiza as informações iniciais do contato e agenda a conversa com o advogado, sem emitir parecer jurídico.',
      },
      {
        service: 'software',
        title: 'Portal do cliente e controle de prazos',
        text: 'Área restrita para o cliente acompanhar o caso e enviar documentos, e painel interno de prazos, tarefas e responsáveis.',
      },
      {
        service: 'automation',
        title: 'Automação de rotinas',
        text: 'Lembretes de prazos e reuniões, documentos gerados a partir de modelos e organização automática de arquivos.',
      },
    ],
    features: [
      'Páginas por área de atuação',
      'Agendamento de consultas',
      'Portal do cliente com acesso seguro',
      'Controle de prazos e tarefas',
      'Modelos de documentos',
      'Controle de acesso por perfil',
    ],
    note: {
      title: 'Ética e sigilo em primeiro lugar',
      text: 'O conteúdo do site segue as regras de publicidade da advocacia (no Brasil, o Provimento 205/2021 da OAB): informativo, sóbrio e sem captação indevida. Os dados dos clientes são tratados com sigilo e de acordo com a LGPD.',
    },
    faq: [
      {
        question: 'O site do escritório segue as regras da OAB?',
        answer:
          'Sim. O conteúdo é informativo e sóbrio, sem promessa de resultado, sem divulgação de valores e sem captação indevida de clientes, como pedem as regras de publicidade da advocacia. A revisão final dos textos é sempre do escritório.',
      },
      {
        question: 'O chatbot dá orientação jurídica?',
        answer: 'Não. O assistente apenas organiza as informações iniciais e agenda a conversa com o advogado. Qualquer análise do caso é feita pelo profissional.',
      },
      {
        question: 'Como ficam a segurança e o sigilo dos dados?',
        answer:
          'Portais e sistemas têm controle de acesso por perfil, conexões criptografadas e registro de acessos. Os dados são tratados de acordo com a LGPD e com o dever de sigilo profissional.',
      },
    ],
    whatsappMessage: 'Olá! Tenho um escritório de advocacia e gostaria de conversar sobre um projeto de tecnologia.',
  },
  construction: {
    name: 'Construção civil e reformas',
    metaTitle: 'Sites e sistemas para construtoras e reformas',
    metaDescription:
      'Tecnologia para construtoras e empresas de reformas: site com portfólio de obras, pedidos de orçamento qualificados, controle de obras e relatórios com fotos para o cliente.',
    heading: 'Tecnologia para construção civil e reformas',
    summary: 'Sites com portfólio de obras, orçamentos organizados, controle de obras e relatórios com fotos para o cliente.',
    intro:
      'Em construção e reformas, a confiança vem de obras bem feitas e de um cliente bem informado. Desenvolvemos sites, sistemas e automações que ajudam a captar orçamentos, organizar a execução das obras e manter o cliente atualizado.',
    challenges: [
      {
        title: 'Orçamentos sem informação suficiente',
        text: 'Pedidos que chegam sem metragem, localização, fotos ou tipo de serviço exigem várias rodadas de conversa antes de qualquer estimativa.',
      },
      {
        title: 'Obras acompanhadas por mensagens soltas',
        text: 'Fotos, medições e decisões espalhadas em grupos de mensagem dificultam saber o que foi combinado.',
      },
      {
        title: 'Custos e compras fora de controle',
        text: 'Sem registrar materiais, compras e mão de obra por obra, a margem do projeto só aparece no fim — quando já é tarde.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'Site com portfólio de obras',
        text: 'Apresentação dos serviços, galeria de obras realizadas pela empresa e um formulário de orçamento que pede as informações certas.',
      },
      {
        service: 'software',
        title: 'Controle de obras',
        text: 'Cronograma, etapas, compras, materiais e custos por obra, com acesso pelo celular para a equipe de campo.',
      },
      {
        service: 'automation',
        title: 'Relatórios para o cliente',
        text: 'Atualizações periódicas com fotos e andamento de cada etapa, enviadas automaticamente ou disponíveis em um portal.',
      },
      {
        service: 'ai',
        title: 'Atendimento inicial com IA',
        text: 'Assistente que responde dúvidas frequentes, coleta os dados do pedido de orçamento e agenda a visita técnica.',
      },
    ],
    features: [
      'Galeria de obras por tipo de serviço',
      'Formulário de orçamento detalhado',
      'Cronograma e etapas por obra',
      'Controle de compras e materiais',
      'Relatórios com fotos para o cliente',
      'Acesso pelo celular para a equipe de campo',
    ],
    note: {
      title: 'Portfólio real',
      text: 'A galeria deve mostrar apenas obras da própria empresa, com autorização dos clientes quando houver imagens de imóveis identificáveis.',
    },
    faq: [
      {
        question: 'O site pode receber pedidos de orçamento com fotos?',
        answer:
          'Sim. O formulário pode pedir fotos, medidas e localização. O envio de arquivos exige um serviço de recebimento (um formulário hospedado ou uma API própria), definido no projeto.',
      },
      {
        question: 'Vocês desenvolvem sistema para controle de obras?',
        answer:
          'Sim. O sistema é desenhado a partir da forma como a empresa trabalha: etapas, cronograma, compras, equipe e custos por obra, com acesso pelo celular.',
      },
      {
        question: 'O cliente consegue acompanhar a obra?',
        answer: 'Sim. Com um portal do cliente ou relatórios automáticos, o cliente recebe o andamento das etapas e fotos da obra sem precisar pedir.',
      },
    ],
    whatsappMessage: 'Olá! Tenho uma empresa de construção ou reformas e gostaria de conversar sobre um projeto de tecnologia.',
  },
};
