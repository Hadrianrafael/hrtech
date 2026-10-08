/** Ferramentas de leitura (risco "read"): nunca alteram dados e nunca pedem aprovação. */
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { formatMoney, toNumber } from '@/lib/utils';
import { getDashboard, resolveRange } from '../../analytics';
import { getOrgPlan, getUsageCount, USAGE_METRICS } from '../../billing/limits';
import { contactWhere, LEAD_STATUS_LABELS } from '../../contacts';
import { searchMemories } from '../memory';
import { defineTool } from './types';

const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => Math.max(0, Math.floor((b.getTime() - a.getTime()) / DAY));
const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);

export const companyOverview = defineTool({
  key: 'company.overview',
  label: 'Visão geral da empresa',
  description: 'Indicadores dos últimos 30 dias: leads, oportunidades, vendas, conversas, tarefas e agenda.',
  argsHint: '{}',
  risk: 'read',
  schema: z.object({}).passthrough(),
  describe: () => 'Ler indicadores gerais da empresa',
  async run({ ctx }) {
    const d = await getDashboard(ctx, resolveRange('30d'));
    const data = {
      periodo: 'últimos 30 dias',
      novosLeads: d.newLeads,
      leadsEmAndamento: d.leadsInProgress,
      oportunidadesAbertas: d.openOpportunities,
      propostasEmAberto: d.proposals,
      vendasGanhas: d.won,
      oportunidadesPerdidas: d.lost,
      taxaDeGanho: d.winRate,
      conversaoDeLeads: d.leadConversion,
      conversasAbertas: d.conversationsOpen,
      conversasAguardandoResposta: d.conversationsWaiting,
      compromissosProximos7Dias: d.upcomingAppointments,
      tarefasPendentes: d.tasksPending,
      tarefasAtrasadas: d.tasksOverdue,
      origensDeLeads: d.bySource.slice(0, 6),
    };
    return {
      data,
      summary:
        `Últimos 30 dias: ${d.newLeads} novos leads, ${d.won.count} venda(s) ganha(s) (${formatMoney(d.won.value)}), ` +
        `${d.openOpportunities.count} oportunidade(s) aberta(s) (${formatMoney(d.openOpportunities.value)}), taxa de ganho ${pct(d.winRate)}, ` +
        `${d.conversationsWaiting} conversa(s) aguardando resposta, ${d.tasksOverdue} tarefa(s) atrasada(s).`,
    };
  },
});

export const pipelineSummary = defineTool({
  key: 'pipeline.summary',
  label: 'Resumo do funil',
  description: 'Etapas do funil principal com quantidade e valor, oportunidades paradas há mais de 14 dias e taxa de ganho em 90 dias.',
  argsHint: '{"staleDays": 14}',
  risk: 'read',
  schema: z.object({ staleDays: z.coerce.number().int().min(3).max(120).default(14) }),
  describe: () => 'Ler o funil de vendas',
  async run({ ctx }, args) {
    const pipeline = await ctx.db.pipeline.findFirst({ where: { isDefault: true }, include: { stages: { orderBy: { position: 'asc' } } } });
    if (!pipeline) return { data: { stages: [] }, summary: 'Nenhum funil configurado.' };
    const groups = await ctx.db.opportunity.groupBy({ by: ['stageId'], where: { pipelineId: pipeline.id, status: 'OPEN' }, _count: { _all: true }, _sum: { value: true } });
    const byStage = new Map(groups.map((g) => [g.stageId, g]));
    const stages = pipeline.stages
      .filter((s) => s.kind === 'OPEN')
      .map((s) => ({ etapa: s.name, chave: s.key, quantidade: byStage.get(s.id)?._count._all ?? 0, valor: toNumber(byStage.get(s.id)?._sum.value) }));
    const now = new Date();
    const stale = await ctx.db.opportunity.findMany({
      where: { pipelineId: pipeline.id, status: 'OPEN', stageChangedAt: { lt: new Date(now.getTime() - args.staleDays * DAY) } },
      orderBy: [{ value: 'desc' }, { stageChangedAt: 'asc' }],
      take: 10,
      include: { stage: { select: { name: true } }, contact: { select: { id: true, name: true } } },
    });
    const since = new Date(now.getTime() - 90 * DAY);
    const [won, lost] = await Promise.all([
      ctx.db.opportunity.count({ where: { status: 'WON', closedAt: { gte: since } } }),
      ctx.db.opportunity.count({ where: { status: 'LOST', closedAt: { gte: since } } }),
    ]);
    const winRate = won + lost ? won / (won + lost) : null;
    const total = stages.reduce((s, x) => s + x.quantidade, 0);
    const totalValue = stages.reduce((s, x) => s + x.valor, 0);
    const bottleneck = [...stages].sort((a, b) => b.quantidade - a.quantidade)[0];
    return {
      data: {
        funil: pipeline.name,
        etapas: stages,
        totalAberto: { quantidade: total, valor: totalValue },
        paradas: stale.map((o) => ({
          opportunityId: o.id,
          titulo: o.title,
          contactId: o.contact.id,
          contato: o.contact.name,
          etapa: o.stage.name,
          valor: toNumber(o.value),
          diasNaEtapa: daysBetween(o.stageChangedAt, now),
        })),
        ganhas90d: won,
        perdidas90d: lost,
        taxaDeGanho90d: winRate,
      },
      summary:
        `${total} oportunidade(s) abertas (${formatMoney(totalValue)}); ` +
        `${stale.length} parada(s) há mais de ${args.staleDays} dias; taxa de ganho (90 dias) ${pct(winRate)}` +
        (bottleneck && bottleneck.quantidade ? `; maior concentração em "${bottleneck.etapa}" (${bottleneck.quantidade}).` : '.'),
    };
  },
});

/** Consulta compartilhada: leads em aberto sem contato recente (usada também por followups.schedule). */
export async function findLeadsNeedingFollowup(ctx: import('@/lib/auth/ctx').ServiceCtx, days: number, limit: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * DAY);
  return ctx.db.contact.findMany({
    where: {
      anonymizedAt: null,
      kind: 'LEAD',
      status: { in: ['NEW', 'CONTACTED', 'IN_CONVERSATION', 'QUALIFIED'] },
      OR: [{ lastInteractionAt: { lt: cutoff } }, { lastInteractionAt: null }],
    },
    orderBy: [{ lastInteractionAt: { sort: 'asc', nulls: 'first' } }],
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      source: true,
      ownerId: true,
      lastInteractionAt: true,
      createdAt: true,
      opportunities: { where: { status: 'OPEN' }, select: { id: true, title: true, value: true, stage: { select: { name: true } } }, take: 1 },
    },
  });
}

export const leadsNeedingFollowup = defineTool({
  key: 'leads.needing_followup',
  label: 'Leads que precisam de follow-up',
  description: 'Leads em aberto sem interação há N dias, conversas aguardando resposta e follow-ups atrasados.',
  argsHint: '{"days": 3, "limit": 15}',
  risk: 'read',
  schema: z.object({ days: z.coerce.number().int().min(1).max(60).default(3), limit: z.coerce.number().int().min(1).max(30).default(15) }),
  describe: (a) => `Listar leads sem contato há ${a.days} dias`,
  async run({ ctx }, args) {
    const now = new Date();
    const [leads, waiting, overdueFollowups] = await Promise.all([
      findLeadsNeedingFollowup(ctx, args.days, args.limit),
      ctx.db.conversation.findMany({
        where: { status: { in: ['OPEN', 'PENDING'] }, awaitingReply: true },
        orderBy: { lastInboundAt: 'asc' },
        take: 8,
        select: { id: true, channel: true, lastInboundAt: true, contact: { select: { id: true, name: true } } },
      }),
      ctx.db.task.count({ where: { type: 'FOLLOW_UP', status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lt: now } } }),
    ]);
    const list = leads.map((l) => {
      const ref = l.lastInteractionAt ?? l.createdAt;
      const opp = l.opportunities[0];
      return {
        contactId: l.id,
        nome: l.name,
        status: LEAD_STATUS_LABELS[l.status],
        origem: l.source,
        diasSemContato: daysBetween(ref, now),
        oportunidade: opp ? { titulo: opp.title, valor: toNumber(opp.value), etapa: opp.stage.name } : null,
      };
    });
    return {
      data: {
        leads: list,
        conversasAguardandoResposta: waiting.map((c) => ({
          conversationId: c.id,
          contactId: c.contact.id,
          contato: c.contact.name,
          canal: c.channel,
          horasAguardando: c.lastInboundAt ? Math.round((now.getTime() - c.lastInboundAt.getTime()) / 3_600_000) : null,
        })),
        followupsAtrasados: overdueFollowups,
      },
      summary: `${list.length} lead(s) sem contato há ${args.days}+ dias, ${waiting.length} conversa(s) aguardando resposta, ${overdueFollowups} follow-up(s) atrasado(s).`,
    };
  },
});

export const leadsSearch = defineTool({
  key: 'leads.search',
  label: 'Buscar leads',
  description: 'Busca contatos por texto (nome, empresa, cidade), status ou origem. Retorna dados resumidos (sem telefone/e-mail).',
  argsHint: '{"query": "pousada", "status": "QUALIFIED", "limit": 10}',
  risk: 'read',
  schema: z.object({
    query: z.string().trim().max(100).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'IN_CONVERSATION', 'QUALIFIED', 'CUSTOMER', 'UNQUALIFIED', 'LOST']).optional(),
    source: z.string().trim().max(40).optional(),
    limit: z.coerce.number().int().min(1).max(25).default(10),
  }),
  describe: (a) => `Buscar leads${a.query ? ` por "${a.query}"` : ''}`,
  async run({ ctx }, args) {
    const where = contactWhere(ctx, { q: args.query, status: args.status, source: args.source });
    const rows = await ctx.db.contact.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: args.limit,
      select: { id: true, name: true, status: true, kind: true, source: true, city: true, companyName: true, lastInteractionAt: true, phone: true, email: true, whatsapp: true },
    });
    // Minimização de dados (LGPD): o agente recebe apenas indicadores de canal, não os contatos em si.
    const data = rows.map((r) => ({
      contactId: r.id,
      nome: r.name,
      empresa: r.companyName,
      cidade: r.city,
      status: LEAD_STATUS_LABELS[r.status],
      tipo: r.kind,
      origem: r.source,
      ultimaInteracao: r.lastInteractionAt,
      temWhatsapp: !!(r.whatsapp ?? r.phone),
      temEmail: !!r.email,
    }));
    return { data, summary: `${data.length} contato(s) encontrado(s).` };
  },
});

export const conversationsWaiting = defineTool({
  key: 'conversations.waiting',
  label: 'Conversas aguardando resposta',
  description: 'Conversas em aberto em que o cliente está esperando retorno, das mais antigas para as mais recentes, com trecho da última mensagem.',
  argsHint: '{"limit": 10}',
  risk: 'read',
  schema: z.object({ limit: z.coerce.number().int().min(1).max(20).default(10) }),
  describe: () => 'Listar conversas aguardando resposta',
  async run({ ctx }, args) {
    const now = new Date();
    const rows = await ctx.db.conversation.findMany({
      where: { status: { in: ['OPEN', 'PENDING'] }, awaitingReply: true },
      orderBy: { lastInboundAt: 'asc' },
      take: args.limit,
      select: {
        id: true,
        channel: true,
        lastInboundAt: true,
        assigneeId: true,
        contact: { select: { id: true, name: true } },
        messages: { where: { direction: 'INBOUND' }, orderBy: { createdAt: 'desc' }, take: 1, select: { body: true } },
      },
    });
    const data = rows.map((c) => ({
      conversationId: c.id,
      contactId: c.contact.id,
      contato: c.contact.name,
      canal: c.channel,
      atribuida: !!c.assigneeId,
      horasAguardando: c.lastInboundAt ? Math.round((now.getTime() - c.lastInboundAt.getTime()) / 3_600_000) : null,
      // Texto do cliente: dado não confiável (entra no prompt envelopado e higienizado).
      ultimaMensagem: (c.messages[0]?.body ?? '').slice(0, 200),
    }));
    return { data, summary: `${data.length} conversa(s) aguardando resposta.` };
  },
});

export const tasksList = defineTool({
  key: 'tasks.list',
  label: 'Tarefas da equipe',
  description: 'Tarefas da equipe humana: atrasadas, de hoje ou todas em aberto.',
  argsHint: '{"scope": "overdue", "limit": 20}',
  risk: 'read',
  schema: z.object({ scope: z.enum(['overdue', 'today', 'open']).default('overdue'), limit: z.coerce.number().int().min(1).max(30).default(20) }),
  describe: (a) => `Listar tarefas (${a.scope})`,
  async run({ ctx }, args) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const where: Prisma.TaskWhereInput = {
      status: { in: ['TODO', 'IN_PROGRESS'] },
      ...(args.scope === 'overdue' ? { dueAt: { lt: now } } : args.scope === 'today' ? { dueAt: { gte: now, lte: endOfDay } } : {}),
    };
    const rows = await ctx.db.task.findMany({
      where,
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { priority: 'desc' }],
      take: args.limit,
      select: { id: true, title: true, type: true, priority: true, dueAt: true, assigneeId: true, contact: { select: { id: true, name: true } } },
    });
    const data = rows.map((t) => ({ taskId: t.id, titulo: t.title, tipo: t.type, prioridade: t.priority, prazo: t.dueAt, responsavel: t.assigneeId, contato: t.contact?.name ?? null }));
    const label = args.scope === 'overdue' ? 'atrasada(s)' : args.scope === 'today' ? 'para hoje' : 'em aberto';
    return { data, summary: `${data.length} tarefa(s) ${label}.` };
  },
});

export const calendarUpcoming = defineTool({
  key: 'calendar.upcoming',
  label: 'Próximos compromissos',
  description: 'Compromissos agendados nos próximos dias.',
  argsHint: '{"days": 7}',
  risk: 'read',
  schema: z.object({ days: z.coerce.number().int().min(1).max(30).default(7) }),
  describe: (a) => `Ler agenda dos próximos ${a.days} dias`,
  async run({ ctx }, args) {
    const now = new Date();
    const rows = await ctx.db.appointment.findMany({
      where: { status: 'SCHEDULED', startsAt: { gte: now, lte: new Date(now.getTime() + args.days * DAY) } },
      orderBy: { startsAt: 'asc' },
      take: 30,
      select: { id: true, title: true, type: true, startsAt: true, contact: { select: { name: true } } },
    });
    return {
      data: rows.map((a) => ({ appointmentId: a.id, titulo: a.title, tipo: a.type, inicio: a.startsAt, contato: a.contact?.name ?? null })),
      summary: `${rows.length} compromisso(s) nos próximos ${args.days} dias.`,
    };
  },
});

export const analyticsConversion = defineTool({
  key: 'analytics.conversion',
  label: 'Conversão e ciclo de vendas',
  description: 'Últimos 90 dias: leads gerados, vendas ganhas e perdidas, taxa de ganho, ticket médio, ciclo médio e resultado do mês atual.',
  argsHint: '{}',
  risk: 'read',
  schema: z.object({}).passthrough(),
  describe: () => 'Ler métricas de conversão',
  async run({ ctx }) {
    const now = new Date();
    const since = new Date(now.getTime() - 90 * DAY);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [leads, wonRows, lost, monthWon, bySource] = await Promise.all([
      ctx.db.contact.count({ where: { createdAt: { gte: since }, anonymizedAt: null } }),
      ctx.db.opportunity.findMany({ where: { status: 'WON', closedAt: { gte: since } }, select: { value: true, createdAt: true, closedAt: true } }),
      ctx.db.opportunity.count({ where: { status: 'LOST', closedAt: { gte: since } } }),
      ctx.db.opportunity.aggregate({ where: { status: 'WON', closedAt: { gte: monthStart } }, _count: true, _sum: { value: true } }),
      ctx.db.contact.groupBy({ by: ['source'], where: { createdAt: { gte: since }, anonymizedAt: null }, _count: { _all: true } }),
    ]);
    const won = wonRows.length;
    const wonValue = wonRows.reduce((s, o) => s + toNumber(o.value), 0);
    const cycles = wonRows.filter((o) => o.closedAt).map((o) => daysBetween(o.createdAt, o.closedAt!));
    const data = {
      periodo: 'últimos 90 dias',
      leadsGerados: leads,
      vendasGanhas: won,
      vendasPerdidas: lost,
      taxaDeGanho: won + lost ? won / (won + lost) : null,
      conversaoLeadParaVenda: leads ? won / leads : null,
      ticketMedio: won ? wonValue / won : null,
      cicloMedioDias: cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : null,
      mesAtual: { vendas: monthWon._count, valor: toNumber(monthWon._sum.value) },
      leadsPorOrigem: bySource.map((s) => ({ origem: s.source, leads: s._count._all })).sort((a, b) => b.leads - a.leads),
    };
    return {
      data,
      summary:
        `90 dias: ${leads} leads, ${won} venda(s), conversão lead→venda ${pct(data.conversaoLeadParaVenda)}, ` +
        `ticket médio ${data.ticketMedio === null ? '—' : formatMoney(data.ticketMedio)}; mês atual: ${monthWon._count} venda(s).`,
    };
  },
});

export const memorySearch = defineTool({
  key: 'memory.search',
  label: 'Consultar memória',
  description: 'Busca fatos, preferências e aprendizados registrados sobre a empresa e sobre este agente.',
  argsHint: '{"query": "perfil de cliente ideal", "limit": 8}',
  risk: 'read',
  schema: z.object({ query: z.string().trim().max(200).default(''), limit: z.coerce.number().int().min(1).max(15).default(8) }),
  describe: (a) => `Consultar memória: ${a.query || 'geral'}`,
  async run({ ctx, agent }, args) {
    const rows = await searchMemories(ctx, { agentId: agent.id, query: args.query, limit: args.limit });
    return {
      data: rows.map((m) => ({ tipo: m.kind, titulo: m.title, conteudo: m.content, origem: m.source === 'AGENT' ? 'agente' : 'empresa' })),
      summary: `${rows.length} memória(s) relevante(s).`,
    };
  },
});

export const approvalsPending = defineTool({
  key: 'approvals.pending',
  label: 'Aprovações pendentes',
  description: 'Ações dos agentes aguardando decisão humana.',
  argsHint: '{}',
  risk: 'read',
  schema: z.object({}).passthrough(),
  describe: () => 'Listar aprovações pendentes',
  async run({ ctx }) {
    const rows = await ctx.db.aiApproval.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: 15 });
    return {
      data: rows.map((a) => ({ approvalId: a.id, ferramenta: a.tool, resumo: a.summary, risco: a.risk, desde: a.createdAt })),
      summary: `${rows.length} aprovação(ões) pendente(s).`,
    };
  },
});

export const teamStatus = defineTool({
  key: 'team.status',
  label: 'Situação da Equipe IA',
  description: 'Agentes, status, tarefas em andamento e consumo do dia.',
  argsHint: '{}',
  risk: 'read',
  schema: z.object({}).passthrough(),
  describe: () => 'Ler situação da Equipe IA',
  async run({ ctx }) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [agents, tasks, cost] = await Promise.all([
      ctx.db.aiAgent.findMany({ orderBy: { createdAt: 'asc' } }),
      ctx.db.aiTask.groupBy({ by: ['agentId', 'status'], where: { status: { in: ['QUEUED', 'RUNNING', 'WAITING_APPROVAL'] } }, _count: { _all: true } }),
      ctx.db.aiTaskRun.aggregate({ where: { startedAt: { gte: startOfDay } }, _sum: { costMicroUsd: true } }),
    ]);
    const data = agents.map((a) => ({
      agente: a.key,
      nome: a.name,
      status: a.status,
      autonomia: a.autonomy,
      emAndamento: tasks.filter((t) => t.agentId === a.id).reduce((s, t) => s + t._count._all, 0),
    }));
    return { data: { agentes: data, custoHojeUsd: (cost._sum.costMicroUsd ?? 0) / 1_000_000 }, summary: `${agents.length} agente(s); custo estimado hoje US$ ${((cost._sum.costMicroUsd ?? 0) / 1_000_000).toFixed(2)}.` };
  },
});

export const financeOverview = defineTool({
  key: 'finance.overview',
  label: 'Visão financeira e operacional',
  description: 'Plano e assinatura, uso do plano no mês, receita ganha no mês, valor do funil e custo estimado da Equipe IA.',
  argsHint: '{}',
  risk: 'read',
  schema: z.object({}).passthrough(),
  describe: () => 'Ler indicadores financeiros e de operação',
  async run({ ctx, orgId }) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [plan, aiMessages, conversations, wonMonth, openPipeline, aiCost] = await Promise.all([
      getOrgPlan(orgId),
      getUsageCount(orgId, USAGE_METRICS.aiMessages),
      getUsageCount(orgId, USAGE_METRICS.conversations),
      ctx.db.opportunity.aggregate({ where: { status: 'WON', closedAt: { gte: monthStart } }, _count: true, _sum: { value: true } }),
      ctx.db.opportunity.aggregate({ where: { status: 'OPEN' }, _count: true, _sum: { value: true } }),
      ctx.db.aiTaskRun.aggregate({ where: { startedAt: { gte: monthStart } }, _sum: { costMicroUsd: true } }),
    ]);
    const data = {
      plano: plan?.plan.name ?? null,
      assinatura: plan?.subscription.status ?? null,
      fimDoPeriodo: plan?.subscription.currentPeriodEnd ?? null,
      usoNoMes: {
        mensagensDeIa: { usado: aiMessages, limite: plan?.limits.aiMessagesPerMonth ?? null },
        conversas: { usado: conversations, limite: plan?.limits.conversationsPerMonth ?? null },
      },
      receitaGanhaNoMes: { vendas: wonMonth._count, valor: toNumber(wonMonth._sum.value) },
      funilEmAberto: { oportunidades: openPipeline._count, valor: toNumber(openPipeline._sum.value) },
      custoEquipeIaNoMesUsd: (aiCost._sum.costMicroUsd ?? 0) / 1_000_000,
    };
    return {
      data,
      summary:
        `Receita ganha no mês: ${formatMoney(data.receitaGanhaNoMes.valor)} (${wonMonth._count} venda(s)); funil em aberto ${formatMoney(data.funilEmAberto.valor)}; ` +
        `custo estimado da Equipe IA no mês: US$ ${data.custoEquipeIaNoMesUsd.toFixed(2)}.`,
    };
  },
});
