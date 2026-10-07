/**
 * Seed idempotente (pode rodar a cada deploy):
 *  - planos iniciais (sem sobrescrever edições feitas no painel) e papéis de sistema;
 *  - primeiro Super Admin HR Tech (somente se ainda não existir nenhum);
 *  - organização HR Tech;
 *  - dados de demonstração FICTÍCIOS ("Pousada Exemplo", prospects) quando SEED_DEMO=true.
 *
 *   pnpm db:seed
 *
 * Banco local (localhost): admin "admin@hrtech.example", senha "Demo@12345" e demo ativada por padrão.
 * Banco remoto (produção): exige SEED_ADMIN_EMAIL e SEED_PASSWORD no primeiro bootstrap; demo desativada por padrão.
 */
import { makeServiceCtx } from '../src/lib/auth/ctx';
import { hashPassword, passwordSchema } from '../src/lib/auth/password';
import { systemDb } from '../src/lib/db';
import { saveKnowledgeDocument } from '../src/server/ai/rag';
import { ensureAiCompany } from '../src/server/ai-company/agents';
import { createAppointment } from '../src/server/calendar';
import { createContact } from '../src/server/contacts';
import { moveOpportunity } from '../src/server/pipeline';
import { createTask } from '../src/server/tasks';
import { ensureSystemRoles, getSystemRole, provisionOrganization } from '../src/server/orgs';

function isLocalDatabase(url = process.env.DATABASE_URL ?? '') {
  try {
    return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const LOCAL = isLocalDatabase();
const DEMO = process.env.SEED_DEMO ? process.env.SEED_DEMO === 'true' : LOCAL;

let cachedPassword: string | null = null;
/** Senha dos usuários criados pelo seed. Em banco remoto nunca usa a senha de demonstração conhecida. */
function seedPassword(): string {
  if (cachedPassword) return cachedPassword;
  const p = process.env.SEED_PASSWORD;
  if (p) {
    const r = passwordSchema.safeParse(p);
    if (!r.success) throw new Error(`SEED_PASSWORD inválida: ${r.error.issues[0]!.message}`);
    return (cachedPassword = p);
  }
  if (LOCAL) return (cachedPassword = 'Demo@12345');
  throw new Error('Banco remoto: defina SEED_PASSWORD (mín. 8 caracteres, com letras e números) para criar o primeiro administrador.');
}

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    description: 'Para começar a organizar o atendimento.',
    priceCents: 19700,
    position: 1,
    limits: { users: 3, contacts: 1000, conversationsPerMonth: 500, aiMessagesPerMonth: 300, automations: 5, channels: 2, knowledgeDocuments: 20 },
    features: ['CRM e Kanban', 'Caixa de entrada unificada', 'Chat do site', 'IA copiloto'],
  },
  {
    key: 'professional',
    name: 'Professional',
    description: 'Para equipes comerciais em crescimento.',
    priceCents: 39700,
    position: 2,
    limits: { users: 10, contacts: 10000, conversationsPerMonth: 3000, aiMessagesPerMonth: 3000, automations: 25, channels: 5, knowledgeDocuments: 200 },
    features: ['Tudo do Starter', 'IA automática', 'Automações avançadas', 'Métricas completas'],
  },
  {
    key: 'business',
    name: 'Business',
    description: 'Operações maiores e múltiplos canais.',
    priceCents: 79700,
    position: 3,
    limits: { users: 50, contacts: 100000, conversationsPerMonth: 20000, aiMessagesPerMonth: 20000, automations: 100, channels: 15, knowledgeDocuments: 1000 },
    features: ['Tudo do Professional', 'Suporte prioritário', 'Limites ampliados'],
  },
];

async function upsertUser(email: string, name: string, isPlatformAdmin = false) {
  const passwordHash = await hashPassword(seedPassword());
  return systemDb.user.upsert({
    where: { email },
    create: { email, name, passwordHash, isPlatformAdmin },
    update: {},
  });
}

async function addMember(userId: string, organizationId: string, roleKey: string) {
  const role = await getSystemRole(roleKey);
  await systemDb.membership.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    create: { userId, organizationId, roleId: role.id },
    update: {},
  });
}

const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 0, 0, 0);
  return date;
};
const daysAhead = (d: number, h = 10) => daysAgo(-d, h);

async function seedPousada(orgId: string, adminId: string, agentId: string) {
  const ctx = makeServiceCtx(orgId, { userId: adminId });
  const agentCtx = makeServiceCtx(orgId, { userId: agentId });

  // Chatbot configurado
  await ctx.db.chatbot.updateMany({
    data: {
      name: 'Lia',
      enabled: true,
      mode: 'COPILOT',
      tone: 'acolhedor, simpático e objetivo',
      greeting: 'Olá! Eu sou a Lia, assistente da Pousada Exemplo 🌿 Posso ajudar com reservas, valores e informações sobre a pousada.',
      instructions:
        'Sempre pergunte as datas de check-in e check-out e o número de hóspedes antes de falar de valores. Ofereça o café da manhã como diferencial. Para grupos acima de 8 pessoas, transfira para um atendente.',
      faq: [
        { q: 'Aceitam animais de estimação?', a: 'Sim, aceitamos pets de pequeno porte mediante taxa de R$ 50 por diária.' },
        { q: 'Tem estacionamento?', a: 'Sim, estacionamento gratuito e coberto para hóspedes.' },
      ],
    },
  });

  // Base de conhecimento
  const docs = [
    {
      title: 'Acomodações e tarifas',
      category: 'Quartos',
      content:
        'Suíte Standard (até 2 pessoas): diária a partir de R$ 320 na baixa temporada e R$ 420 na alta temporada.\n\nSuíte Família (até 4 pessoas): diária a partir de R$ 480 na baixa temporada e R$ 620 na alta.\n\nChalé com hidromassagem (até 2 pessoas): diária a partir de R$ 590.\n\nTodas as acomodações têm ar-condicionado, Wi-Fi, frigobar e TV.',
    },
    {
      title: 'Check-in, check-out e políticas',
      category: 'Políticas',
      content:
        'Check-in a partir das 14h e check-out até as 12h. Early check-in e late check-out sujeitos à disponibilidade.\n\nReservas são confirmadas com sinal de 30%. Cancelamento gratuito até 7 dias antes da chegada.\n\nCrianças até 5 anos não pagam quando dormem na cama dos pais.',
    },
    {
      title: 'Localização e estrutura',
      category: 'Informações',
      content:
        'A Pousada Exemplo fica a 300 metros da praia, no centro da cidade fictícia de Vila Exemplo. Possui piscina, jardim, redário e café da manhã regional incluso, servido das 7h30 às 10h30.',
    },
    {
      title: 'Promoções vigentes',
      category: 'Promoções',
      content: 'Pacote "Fim de semana romântico": 2 diárias no chalé com hidromassagem + jantar especial, com 10% de desconto. Válido de domingo a quinta na baixa temporada.',
    },
  ];
  for (const d of docs) await saveKnowledgeDocument(ctx, null, d);

  // Leads fictícios
  const leads = [
    { name: 'Mariana Souza (fictícia)', phone: '11990000001', email: 'mariana@cliente.example', source: 'whatsapp', interest: 'Fim de semana romântico', potentialValue: 1180, city: 'São Paulo', state: 'SP', customFields: { checkIn: '2026-11-14', checkOut: '2026-11-16', guests: '2', roomType: 'Chalé' } },
    { name: 'Carlos Pereira (fictício)', phone: '21990000002', email: 'carlos@cliente.example', source: 'instagram', interest: 'Férias em família', potentialValue: 3100, city: 'Rio de Janeiro', state: 'RJ', customFields: { checkIn: '2026-12-27', checkOut: '2027-01-02', guests: '4', roomType: 'Suíte Família' } },
    { name: 'Ana Lima (fictícia)', phone: '31990000003', email: 'ana@cliente.example', source: 'webchat', interest: 'Hospedagem para casamento', potentialValue: 4800, city: 'Belo Horizonte', state: 'MG' },
    { name: 'Roberto Alves (fictício)', phone: '41990000004', email: 'roberto@cliente.example', source: 'form', interest: 'Retiro corporativo', potentialValue: 9500, city: 'Curitiba', state: 'PR' },
    { name: 'Juliana Costa (fictícia)', phone: '51990000005', email: 'juliana@cliente.example', source: 'email', interest: 'Diárias no feriado', potentialValue: 960, city: 'Porto Alegre', state: 'RS' },
    { name: 'Pedro Santos (fictício)', phone: '61990000006', email: 'pedro@cliente.example', source: 'whatsapp', interest: 'Suíte Standard', potentialValue: 640, city: 'Brasília', state: 'DF' },
    { name: 'Fernanda Rocha (fictícia)', phone: '71990000007', email: 'fernanda@cliente.example', source: 'indicacao', interest: 'Lua de mel', potentialValue: 2950, city: 'Salvador', state: 'BA' },
    { name: 'Lucas Martins (fictício)', phone: '81990000008', email: 'lucas@cliente.example', source: 'instagram', interest: 'Viagem com pet', potentialValue: 840, city: 'Recife', state: 'PE' },
  ];
  const created = [];
  for (const [i, l] of leads.entries()) {
    const c = await createContact(i % 2 ? agentCtx : ctx, { ...l, ownerId: i % 2 ? agentId : adminId, consent: 'on' });
    await ctx.db.contact.update({ where: { id: c.id }, data: { createdAt: daysAgo(20 - i * 2), lastInteractionAt: daysAgo(10 - i) } });
    created.push(c);
  }

  // Movimenta o funil para ter um pipeline preenchido
  const stages = await ctx.db.pipelineStage.findMany({ orderBy: { position: 'asc' } });
  const stageBy = (key: string) => stages.find((s) => s.key === key)!.id;
  const moves: [number, string][] = [
    [0, 'proposal'],
    [1, 'negotiation'],
    [2, 'qualified'],
    [3, 'proposal'],
    [4, 'first_contact'],
    [5, 'won'],
    [6, 'in_conversation'],
    [7, 'lost'],
  ];
  for (const [idx, key] of moves) {
    const opp = await ctx.db.opportunity.findFirst({ where: { contactId: created[idx]!.id } });
    if (opp) await moveOpportunity(ctx, opp.id, stageBy(key), { lostReason: key === 'lost' ? 'Optou por outra hospedagem' : undefined });
  }

  // Conversas fictícias
  const webchat = await ctx.db.integration.findFirst({ where: { type: 'WEBCHAT' } });
  const convs: { contact: number; channel: 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'WEBCHAT'; msgs: [string, 'IN' | 'OUT' | 'AI'][]; waiting?: boolean }[] = [
    {
      contact: 0,
      channel: 'WHATSAPP',
      msgs: [
        ['Oi! Vocês têm o chalé com hidromassagem disponível de 14 a 16 de novembro?', 'IN'],
        ['Olá, Mariana! Temos sim disponibilidade nessas datas. Serão 2 hóspedes?', 'OUT'],
        ['Sim, eu e meu marido. Qual o valor com o pacote romântico?', 'IN'],
        ['O pacote fica R$ 1.180 com jantar especial incluso. Posso enviar a proposta?', 'OUT'],
        ['Pode sim! Aguardo.', 'IN'],
      ],
      waiting: true,
    },
    {
      contact: 1,
      channel: 'INSTAGRAM',
      msgs: [
        ['Olá, vi o post de vocês. Têm suíte para 4 pessoas no réveillon?', 'IN'],
        ['Oi, Carlos! Temos a Suíte Família para até 4 pessoas. De quando a quando seria?', 'OUT'],
        ['27/12 a 02/01. Aceitam pets?', 'IN'],
      ],
      waiting: true,
    },
    {
      contact: 2,
      channel: 'WEBCHAT',
      msgs: [
        ['Olá! Eu sou a Lia, assistente da Pousada Exemplo 🌿', 'AI'],
        ['Quero hospedar convidados de um casamento, uns 15 quartos.', 'IN'],
        ['Que ótimo! Para grupos, vou transferir para nossa equipe montar uma proposta especial.', 'AI'],
      ],
    },
    {
      contact: 4,
      channel: 'EMAIL',
      msgs: [
        ['Bom dia, gostaria de saber valores para o feriado de 15 de novembro, 2 adultos.', 'IN'],
        ['Bom dia, Juliana! Para o feriado a Suíte Standard sai por R$ 420 a diária, com café da manhã.', 'OUT'],
      ],
    },
  ];
  for (const cv of convs) {
    const contact = created[cv.contact]!;
    const conv = await ctx.db.conversation.create({
      data: {
        organizationId: orgId,
        contactId: contact.id,
        channel: cv.channel,
        integrationId: cv.channel === 'WEBCHAT' ? webchat?.id : null,
        assigneeId: contact.ownerId,
        subject: cv.channel === 'EMAIL' ? 'Valores para o feriado' : null,
        humanRequested: cv.channel === 'WEBCHAT',
        aiPaused: cv.channel === 'WEBCHAT',
      },
    });
    await ctx.db.contactIdentity.create({
      data: { organizationId: orgId, contactId: contact.id, channel: cv.channel, externalId: cv.channel === 'EMAIL' ? contact.email! : cv.channel === 'WHATSAPP' ? contact.whatsapp! : `demo_${contact.id}` },
    }).catch(() => undefined);
    let t = Date.now() - cv.msgs.length * 7 * 60000 - (cv.contact + 1) * 3600000;
    let lastIn: Date | null = null;
    let lastOut: Date | null = null;
    for (const [body, dir] of cv.msgs) {
      t += 7 * 60000;
      const at = new Date(t);
      if (dir === 'IN') lastIn = at;
      else lastOut = at;
      await ctx.db.message.create({
        data: {
          organizationId: orgId,
          conversationId: conv.id,
          direction: dir === 'IN' ? 'INBOUND' : 'OUTBOUND',
          senderType: dir === 'IN' ? 'CONTACT' : dir === 'AI' ? 'AI' : 'USER',
          senderUserId: dir === 'OUT' ? contact.ownerId : null,
          body,
          status: dir === 'IN' ? 'RECEIVED' : 'DELIVERED',
          createdAt: at,
        },
      });
    }
    const last = cv.msgs[cv.msgs.length - 1]!;
    await ctx.db.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: new Date(t),
        lastMessagePreview: last[0].slice(0, 120),
        lastInboundAt: lastIn,
        lastOutboundAt: lastOut,
        awaitingReply: !!cv.waiting,
        unreadCount: cv.waiting ? 1 : 0,
      },
    });
  }

  // Agenda e tarefas
  await createAppointment(ctx, { title: 'Ligação: proposta pacote romântico', type: 'CALL', startsAt: daysAhead(1, 10), endsAt: daysAhead(1, 10.5), contactId: created[0]!.id });
  await createAppointment(ctx, { title: 'Visita técnica — retiro corporativo', type: 'VISIT', startsAt: daysAhead(3, 15), endsAt: daysAhead(3, 16), contactId: created[3]!.id, location: 'Pousada Exemplo' });
  await createAppointment(agentCtx, { title: 'Retorno sobre réveillon', type: 'RETURN', startsAt: daysAhead(2, 11), endsAt: daysAhead(2, 11.5), contactId: created[1]!.id });
  await createTask(ctx, { title: 'Enviar proposta de grupo para casamento', priority: 'HIGH', dueAt: daysAhead(1, 18).toISOString(), contactId: created[2]!.id });
  await createTask(agentCtx, { title: 'Confirmar política de pets com a gerência', priority: 'MEDIUM', dueAt: daysAgo(1, 18).toISOString(), contactId: created[7]!.id });
}

async function seedHrTech(orgId: string, adminId: string) {
  const ctx = makeServiceCtx(orgId, { userId: adminId });
  await ctx.db.chatbot.updateMany({
    data: {
      name: 'Assistente HR Tech',
      instructions: 'Apresente as soluções da HR Tech (SaaS omnichannel com IA, CRM, chatbot para sites) para hotéis, pousadas e pequenos negócios. Agende uma demonstração.',
      collectFields: ['name', 'phone', 'email', 'interest', 'budget'],
    },
  });
  await saveKnowledgeDocument(ctx, null, {
    title: 'Sobre a HR Tech',
    category: 'Empresa',
    content: 'A HR Tech Sistemas desenvolve sites, sistemas web, SaaS e automações com Inteligência Artificial. A plataforma omnichannel centraliza WhatsApp, Instagram, e-mail e chat do site com CRM e IA.',
  });
  if (!DEMO) return;
  const prospects = [
    { name: 'Hotel Mar Azul (fictício)', companyName: 'Hotel Mar Azul', city: 'Florianópolis', state: 'SC', source: 'prospeccao', interest: 'Chatbot + WhatsApp', potentialValue: 397 * 12 },
    { name: 'Pousada Serra Verde (fictícia)', companyName: 'Pousada Serra Verde', city: 'Gramado', state: 'RS', source: 'indicacao', interest: 'CRM e funil de reservas', potentialValue: 197 * 12 },
    { name: 'Agência Rota Sol (fictícia)', companyName: 'Rota Sol Turismo', city: 'Natal', state: 'RN', source: 'instagram', interest: 'Atendimento omnichannel', potentialValue: 797 * 12 },
  ];
  for (const p of prospects) await createContact(ctx, { ...p, email: `contato@${p.companyName.toLowerCase().replace(/\s+/g, '')}.example` });
}

async function main() {
  console.log(`→ Seed (${LOCAL ? 'banco local' : 'banco remoto'}, demonstração ${DEMO ? 'ativada' : 'desativada'})`);
  console.log('→ Planos e papéis');
  for (const p of PLANS) {
    // Não sobrescreve preços/limites editados no painel /admin/plans.
    await systemDb.plan.upsert({ where: { key: p.key }, create: p, update: {} });
  }
  await ensureSystemRoles();

  let superAdmin = await systemDb.user.findFirst({ where: { isPlatformAdmin: true }, orderBy: { createdAt: 'asc' } });
  let createdAdmin: string | null = null;
  if (!superAdmin) {
    const email = (process.env.SEED_ADMIN_EMAIL ?? (LOCAL ? 'admin@hrtech.example' : '')).trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Banco remoto: defina SEED_ADMIN_EMAIL com o e-mail do primeiro Super Admin HR Tech.');
    console.log('→ Super Admin HR Tech');
    superAdmin = await upsertUser(email, process.env.SEED_ADMIN_NAME?.trim() || 'Administrador HR Tech', true);
    createdAdmin = email;
  }

  let hrtech = await systemDb.organization.findFirst({ where: { isPlatformOwner: true } });
  if (!hrtech) {
    console.log('→ Organização HR Tech');
    hrtech = await provisionOrganization({ name: 'HR Tech Sistemas', segment: 'servicos', planKey: 'business', isPlatformOwner: true, trialDays: 0 });
    await addMember(superAdmin.id, hrtech.id, 'org_admin');
    await seedHrTech(hrtech.id, superAdmin.id);
  }

  // Equipe IA: a própria HR Tech é a primeira empresa usuária (idempotente; não sobrescreve configurações).
  console.log('→ Equipe IA da HR Tech (CEO Agent + agentes especializados)');
  await ensureAiCompany(hrtech.id, { enable: true, platformOwner: true });

  let createdDemo = false;
  if (DEMO && !(await systemDb.organization.findFirst({ where: { slug: 'pousada-exemplo' } }))) {
    console.log('→ Pousada Exemplo (dados fictícios)');
    const pousada = await provisionOrganization({ name: 'Pousada Exemplo', segment: 'pousada', planKey: 'professional' });
    const admin = await upsertUser('admin@pousadaexemplo.example', 'Gerente da Pousada (fictício)');
    const agent = await upsertUser('atendente@pousadaexemplo.example', 'Atendente da Pousada (fictício)');
    await addMember(admin.id, pousada.id, 'org_admin');
    await addMember(agent.id, pousada.id, 'agent');
    await seedPousada(pousada.id, admin.id, agent.id);
    await ensureAiCompany(pousada.id, { enable: true });
    createdDemo = true;
  }

  const shownPassword = process.env.SEED_PASSWORD ? '[valor de SEED_PASSWORD]' : 'Demo@12345';
  console.log('\n✔ Seed concluído.');
  if (createdAdmin) console.log(`  Super Admin HR Tech: ${createdAdmin} (senha: ${shownPassword})`);
  if (createdDemo) {
    console.log(`  Demonstração (senha: ${shownPassword}):`);
    console.log('    Admin Pousada Exemplo ....... admin@pousadaexemplo.example');
    console.log('    Atendente Pousada Exemplo ... atendente@pousadaexemplo.example');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
