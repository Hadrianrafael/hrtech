import type { Prisma } from '@prisma/client';
import { ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { withTenant } from '@/lib/db';
import { toNumber } from '@/lib/utils';

export type PeriodKey = 'today' | '7d' | '30d' | 'month' | 'custom';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
  month: 'Este mês',
  custom: 'Personalizado',
};

export function resolveRange(period?: string | null, from?: string | null, to?: string | null, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  let key = (period && period in PERIOD_LABELS ? period : '30d') as PeriodKey;
  switch (key) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom': {
      const f = from ? new Date(`${from}T00:00:00`) : null;
      const t = to ? new Date(`${to}T23:59:59.999`) : null;
      if (f && t && !Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime()) && f <= t) return { key, start: f, end: t };
      key = '30d';
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    }
    default:
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
  }
  return { key, start, end };
}

type Range = { start: Date; end: Date };

function dayKeys(range: Range) {
  const keys: string[] = [];
  const d = new Date(range.start);
  d.setHours(0, 0, 0, 0);
  while (d <= range.end && keys.length < 400) {
    keys.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

export async function getDashboard(ctx: ServiceCtx, range: Range) {
  const inRange = { gte: range.start, lte: range.end };
  const contactScope = ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput;
  const oppScope = ownerScope(ctx, 'ownerId') as Prisma.OpportunityWhereInput;
  const convScope = ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput;
  const taskScope = ownerScope(ctx, 'assigneeId') as Prisma.TaskWhereInput;
  const apptScope = ownerScope(ctx, 'ownerId') as Prisma.AppointmentWhereInput;
  const now = new Date();

  const [
    newLeads,
    leadsInProgress,
    openOpps,
    proposals,
    won,
    lost,
    convOpen,
    convWaiting,
    appointments,
    tasksPending,
    tasksOverdue,
    customersFromRange,
    bySource,
    byChannel,
    recent,
    leadsSeriesRaw,
  ] = await Promise.all([
    ctx.db.contact.count({ where: { AND: [contactScope, { createdAt: inRange, anonymizedAt: null }] } }),
    ctx.db.contact.count({ where: { AND: [contactScope, { status: { in: ['CONTACTED', 'IN_CONVERSATION', 'QUALIFIED'] }, anonymizedAt: null }] } }),
    ctx.db.opportunity.aggregate({ where: { AND: [oppScope, { status: 'OPEN' }] }, _count: true, _sum: { value: true } }),
    ctx.db.opportunity.aggregate({ where: { AND: [oppScope, { status: 'OPEN', stage: { key: 'proposal' } }] }, _count: true, _sum: { value: true } }),
    ctx.db.opportunity.aggregate({ where: { AND: [oppScope, { status: 'WON', closedAt: inRange }] }, _count: true, _sum: { value: true } }),
    ctx.db.opportunity.count({ where: { AND: [oppScope, { status: 'LOST', closedAt: inRange }] } }),
    ctx.db.conversation.count({ where: { AND: [convScope, { status: { in: ['OPEN', 'PENDING'] } }] } }),
    ctx.db.conversation.count({ where: { AND: [convScope, { status: { in: ['OPEN', 'PENDING'] }, awaitingReply: true }] } }),
    ctx.db.appointment.count({ where: { AND: [apptScope, { startsAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) }, status: 'SCHEDULED' }] } }),
    ctx.db.task.count({ where: { AND: [taskScope, { status: { in: ['TODO', 'IN_PROGRESS'] } }] } }),
    ctx.db.task.count({ where: { AND: [taskScope, { status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lt: now } }] } }),
    ctx.db.contact.count({ where: { AND: [contactScope, { createdAt: inRange, kind: 'CUSTOMER' }] } }),
    ctx.db.contact.groupBy({ by: ['source'], where: { AND: [contactScope, { createdAt: inRange, anonymizedAt: null }] }, _count: { _all: true } }),
    ctx.db.conversation.groupBy({ by: ['channel'], where: { AND: [convScope, { lastMessageAt: inRange }] }, _count: { _all: true } }),
    ctx.db.timelineEvent.findMany({
      where: { createdAt: inRange, contact: contactScope },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { contact: { select: { id: true, name: true } } },
    }),
    ctx.db.contact.findMany({ where: { AND: [contactScope, { createdAt: inRange }] }, select: { createdAt: true }, take: 10000 }),
  ]);

  const series = Object.fromEntries(dayKeys(range).map((k) => [k, 0]));
  for (const c of leadsSeriesRaw) {
    const k = c.createdAt.toISOString().slice(0, 10);
    if (k in series) series[k]! += 1;
  }

  const closed = won._count + lost;
  return {
    newLeads,
    leadsInProgress,
    openOpportunities: { count: openOpps._count, value: toNumber(openOpps._sum.value) },
    proposals: { count: proposals._count, value: toNumber(proposals._sum.value) },
    won: { count: won._count, value: toNumber(won._sum.value) },
    lost,
    winRate: closed > 0 ? won._count / closed : null,
    leadConversion: newLeads > 0 ? customersFromRange / newLeads : null,
    conversationsOpen: convOpen,
    conversationsWaiting: convWaiting,
    upcomingAppointments: appointments,
    tasksPending,
    tasksOverdue,
    bySource: bySource.map((s) => ({ key: s.source, count: s._count._all })).sort((a, b) => b.count - a.count),
    byChannel: byChannel.map((s) => ({ key: s.channel, count: s._count._all })).sort((a, b) => b.count - a.count),
    leadsSeries: Object.entries(series).map(([date, count]) => ({ date, count })),
    recent,
  };
}

export async function getAnalytics(ctx: ServiceCtx, range: Range) {
  const inRange = { gte: range.start, lte: range.end };
  const [dashboard, pipeline, owners, aiRuns, aiAccepted, handoffs, appointmentsByType, messagesByAgent, responseTime, wonByOwner] = await Promise.all([
    getDashboard(ctx, range),
    ctx.db.pipelineStage.findMany({
      where: { pipeline: { isDefault: true } },
      orderBy: { position: 'asc' },
      include: { opportunities: { where: { OR: [{ status: 'OPEN' }, { closedAt: inRange }] }, select: { value: true } } },
    }),
    ctx.db.membership.findMany({ where: { status: 'ACTIVE' }, include: { user: { select: { id: true, name: true } } } }),
    ctx.db.aiRun.groupBy({ by: ['kind', 'status'], where: { createdAt: inRange }, _count: { _all: true }, _avg: { latencyMs: true }, _sum: { tokensIn: true, tokensOut: true } }),
    ctx.db.aiRun.groupBy({ by: ['accepted'], where: { createdAt: inRange, kind: 'suggest', accepted: { not: null } }, _count: { _all: true } }),
    ctx.db.timelineEvent.count({ where: { createdAt: inRange, type: 'handoff' } }),
    ctx.db.appointment.groupBy({ by: ['type', 'status'], where: { startsAt: inRange }, _count: { _all: true } }),
    ctx.db.message.groupBy({ by: ['senderUserId'], where: { createdAt: inRange, direction: 'OUTBOUND', senderType: 'USER' }, _count: { _all: true } }),
    // Tempo médio até a primeira resposta (humana ou IA) para cada mensagem do cliente.
    withTenant(ctx.orgId, (tx) =>
      tx.$queryRaw<{ sender: string; avg_seconds: number | null; samples: bigint }[]>`
        WITH inbound AS (
          SELECT m."conversationId", m."createdAt",
                 lag(m."direction") OVER (PARTITION BY m."conversationId" ORDER BY m."createdAt") AS prev_dir
          FROM "Message" m
          WHERE m."organizationId" = ${ctx.orgId} AND m."createdAt" BETWEEN ${range.start} AND ${range.end}
            AND m."direction" = 'INBOUND'
        ), firsts AS (
          SELECT i."conversationId", i."createdAt" AS in_at,
                 (SELECT o."createdAt" FROM "Message" o WHERE o."conversationId" = i."conversationId" AND o."direction" = 'OUTBOUND'
                    AND o."senderType" IN ('USER','AI') AND o."createdAt" > i."createdAt" ORDER BY o."createdAt" LIMIT 1) AS out_at,
                 (SELECT o."senderType"::text FROM "Message" o WHERE o."conversationId" = i."conversationId" AND o."direction" = 'OUTBOUND'
                    AND o."senderType" IN ('USER','AI') AND o."createdAt" > i."createdAt" ORDER BY o."createdAt" LIMIT 1) AS sender
          FROM inbound i WHERE i.prev_dir IS DISTINCT FROM 'INBOUND'
        )
        SELECT sender, avg(extract(epoch FROM (out_at - in_at)))::float AS avg_seconds, count(*) AS samples
        FROM firsts WHERE out_at IS NOT NULL GROUP BY sender`,
    ),
    ctx.db.opportunity.groupBy({ by: ['ownerId'], where: { status: 'WON', closedAt: inRange }, _count: { _all: true }, _sum: { value: true } }),
  ]);

  const names = new Map(owners.map((o) => [o.user.id, o.user.name]));
  const accepted = aiAccepted.find((a) => a.accepted === true)?._count._all ?? 0;
  const rejected = aiAccepted.find((a) => a.accepted === false)?._count._all ?? 0;
  const aiTotal = aiRuns.reduce((s, r) => s + r._count._all, 0);
  const aiFailed = aiRuns.filter((r) => r.status === 'FAILED').reduce((s, r) => s + r._count._all, 0);
  const respAll = responseTime.reduce((acc, r) => ({ sum: acc.sum + (r.avg_seconds ?? 0) * Number(r.samples), n: acc.n + Number(r.samples) }), { sum: 0, n: 0 });

  return {
    ...dashboard,
    pipeline: pipeline.map((s) => ({ id: s.id, name: s.name, color: s.color, kind: s.kind, count: s.opportunities.length, value: s.opportunities.reduce((sum, o) => sum + toNumber(o.value), 0) })),
    agents: owners.map((o) => ({
      userId: o.user.id,
      name: o.user.name,
      messages: messagesByAgent.find((m) => m.senderUserId === o.user.id)?._count._all ?? 0,
      won: wonByOwner.find((w) => w.ownerId === o.user.id)?._count._all ?? 0,
      wonValue: toNumber(wonByOwner.find((w) => w.ownerId === o.user.id)?._sum.value),
    })),
    unassignedWon: wonByOwner.filter((w) => !w.ownerId || !names.has(w.ownerId)).reduce((s, w) => s + w._count._all, 0),
    ai: {
      total: aiTotal,
      failed: aiFailed,
      autoReplies: aiRuns.filter((r) => r.kind === 'auto_reply' && r.status === 'SUCCESS').reduce((s, r) => s + r._count._all, 0),
      suggestions: aiRuns.filter((r) => r.kind === 'suggest').reduce((s, r) => s + r._count._all, 0),
      acceptanceRate: accepted + rejected > 0 ? accepted / (accepted + rejected) : null,
      tokens: aiRuns.reduce((s, r) => s + (r._sum.tokensIn ?? 0) + (r._sum.tokensOut ?? 0), 0),
      avgLatencyMs: aiTotal ? Math.round(aiRuns.reduce((s, r) => s + (r._avg.latencyMs ?? 0) * r._count._all, 0) / aiTotal) : null,
      handoffs,
    },
    responseTime: {
      overallSeconds: respAll.n ? respAll.sum / respAll.n : null,
      samples: respAll.n,
      bySender: responseTime.map((r) => ({ sender: r.sender, seconds: r.avg_seconds, samples: Number(r.samples) })),
    },
    appointments: appointmentsByType.map((a) => ({ type: a.type, status: a.status, count: a._count._all })),
  };
}
