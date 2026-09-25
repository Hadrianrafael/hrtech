export type ProcessStep = { number: string; title: string; text: string; details: string[] };

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Descoberta',
    text: 'Entendemos o negócio, o público e o problema que precisa ser resolvido.',
    details: ['Reunião de entendimento', 'Mapeamento do processo atual', 'Objetivos do projeto'],
  },
  {
    number: '02',
    title: 'Estratégia',
    text: 'Definimos arquitetura, funcionalidades, prioridades e a experiência do usuário.',
    details: ['Escopo e prioridades', 'Arquitetura técnica', 'Fluxos e protótipo'],
  },
  {
    number: '03',
    title: 'Desenvolvimento',
    text: 'Construímos a solução em entregas curtas, com você acompanhando a evolução.',
    details: ['Entregas incrementais', 'Código revisado e versionado', 'Ambiente de homologação'],
  },
  {
    number: '04',
    title: 'Testes',
    text: 'Validamos performance, segurança, acessibilidade e o comportamento em cada tela.',
    details: ['Testes automatizados', 'Testes em celular, tablet e desktop', 'Revisão de segurança'],
  },
  {
    number: '05',
    title: 'Lançamento',
    text: 'Publicamos a solução com domínio, monitoramento e tudo configurado.',
    details: ['Deploy em produção', 'Domínio e HTTPS', 'Analytics e Search Console'],
  },
  {
    number: '06',
    title: 'Evolução',
    text: 'Acompanhamos o uso real e desenvolvemos as próximas melhorias.',
    details: ['Suporte e manutenção', 'Novas funcionalidades', 'Melhoria contínua'],
  },
];
