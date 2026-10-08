/**
 * Briefing diário do CEO Agent: gerado no horário configurado (fuso da empresa), salvo na SaaS e, se ativado,
 * entregue pelo n8n (WhatsApp/e-mail). Sem IA, o conteúdo é montado com os dados reais; com IA, o CEO abre o
 * briefing com uma mensagem curta destacando o que mais importa.
 */
import type { AiCompany, Prisma } from '@prisma/client';
import { z } from 'zod';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { safeTimeZone } from '@/lib/utils';
import { formatMoney, toNumber } from '@/lib/utils';
import { systemDb, tenantDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logActivity } from './activity';
import type { Outcome, RunContext } from './engine';
import { invokeTool } from './invoke';
import { enqueueDispatch, sendDispatch } from './n8n';
import { extractJsonObject, sanitizeText, wrapUntrusted } from './security';
import { createAiTask } from './tasks';

export const briefingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  hour: z.coerce.number().int().min(0).max(23).default(8),
  /** 0 = domingo … 6 = sábado */
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7).default([1, 2, 3, 4, 5]),
  recipients: z.array(z.string().min(5).max(60)).max(20).default([]),
  deliverViaN8n: z.boolean().default(false),
});

export type BriefingConfig = z.infer<typeof briefingConfigSchema>;

export function readBriefingConfig(company: Pick<AiCompany, 'briefing'>): BriefingConfig {
  const r = briefingConfigSchema.safeParse(company.briefing ?? {});
  return r.success ? r.data : briefingConfigSchema.parse({});
}

/** Data/hora local da empresa. */
export function localClock(timeZone: string, now = new Date()) {
  const tz = safeTimeZone(timeZone);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday ?? 'Mon');
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), weekday };
}

/** Cria a tarefa de briefing das empresas cujo horário chegou (idempotente por dia). */
export async function scheduleDueBriefings(now = new Date()) {
  const companies = await systemDb.aiCompany.findMany({ where: { enabled: true, paused: false, organization: { status: 'ACTIVE' } }, include: { organization: { select: { timezone: true } } } });
  let created = 0;
  for (const c of companies) {
    const cfg = readBriefingConfig(c);
    if (!cfg.enabled) continue;
    const clock = localClock(c.organization.timezone, now);
    if (!cfg.weekdays.includes(clock.weekday) || clock.hour < cfg.hour) continue;
    try {
      if (await queueBriefing(c.organizationId, clock.day)) created++;
    } catch (err) {
      // Ex.: limite diário de tarefas do CEO de uma empresa — não impede as outras.
      logger.warn('ai_briefing.schedule_failed', { orgId: c.organizationId, err });
    }
  }
  return created;
}

async function queueBriefing(orgId: string, day: string, createdByUserId: string | null = null) {
  const db = tenantDb(orgId);
  const [exists, pending, ceo] = await Promise.all([
    db.aiBriefing.findFirst({ where: { day }, select: { id: true } }),
    db.aiTask.findFirst({ where: { kind: 'briefing', input: { path: ['day'], equals: day }, status: { notIn: ['FAILED', 'CANCELLED'] } }, select: { id: true } }),
    db.aiAgent.findFirst({ where: { isCeo: true, status: { not: 'DISABLED' } } }),
  ]);
  if ((exists && !createdByUserId) || pending || !ceo) return null;
  return createAiTask({ orgId, agentId: ceo.id, title: `Briefing diário ${day}`, instructions: 'Gerar o briefing diário da empresa.', kind: 'briefing', priority: 9, input: { mode: 'briefing', day }, createdByUserId });
}

/** "Gerar briefing agora" (tela da Central do CEO). */
export async function requestBriefingNow(ctx: ServiceCtx) {
  assertCan(ctx, 'ai_team.command');
  const org = await ctx.db.organization.findFirstOrThrow({ select: { timezone: true } });
  const { day } = localClock(org.timezone);
  return queueBriefing(ctx.orgId, day, ctx.userId);
}

type Data = Record<string, unknown>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const bullet = (items: string[], empty: string) => (items.length ? items.map((i) => `- ${i}`).join('\n') : `- ${empty}`);

/** Execução da tarefa de briefing (chamada pelo executor). */
export async function runBriefingTask(rc: RunContext): Promise<Outcome> {
  const day = rc.input.day && /^\d{4}-\d{2}-\d{2}$/.test(rc.input.day) ? rc.input.day : localClock(rc.org.timezone).day;
  const reads: [string, string, Record<string, unknown>][] = [
    ['overview', 'company.overview', {}],
    ['follow', 'leads.needing_followup', { days: 3, limit: 10 }],
    ['pipe', 'pipeline.summary', { staleDays: 14 }],
    ['overdue', 'tasks.list', { scope: 'overdue', limit: 10 }],
    ['today', 'tasks.list', { scope: 'today', limit: 10 }],
    ['waiting', 'conversations.waiting', { limit: 8 }],
    ['approvals', 'approvals.pending', {}],
    ['agenda', 'calendar.upcoming', { days: 1 }],
  ];
  const data: Record<string, unknown> = {};
  for (const [key, tool, args] of reads) {
    const r = await invokeTool(rc, tool, args);
    if (r.status === 'executed') data[key] = r.data;
  }
  const db = rc.ctx.db;
  const since24h = new Date(Date.now() - 86_400_000);
  const [newLeads, proposals, failedTasks, integrationErrors, webhookFailures, hot] = await Promise.all([
    db.contact.count({ where: { createdAt: { gte: since24h }, anonymizedAt: null } }),
    db.opportunity.findMany({ where: { status: 'OPEN', stage: { key: 'proposal' } }, orderBy: { value: 'desc' }, take: 8, select: { title: true, value: true, stageChangedAt: true, contact: { select: { name: true } } } }),
    db.aiTask.count({ where: { status: 'FAILED', completedAt: { gte: since24h } } }),
    db.integration.findMany({ where: { lastErrorAt: { gte: since24h } }, select: { name: true, type: true, lastError: true } }),
    // WebhookEvent não é escopado automaticamente (organizationId opcional): filtro explícito.
    db.webhookEvent.count({ where: { organizationId: rc.orgId, status: 'FAILED', receivedAt: { gte: since24h } } }),
    db.opportunity.findMany({ where: { status: 'OPEN', updatedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }, orderBy: { value: 'desc' }, take: 5, select: { title: true, value: true, contact: { select: { name: true } }, stage: { select: { name: true } } } }),
  ]);

  const overview = (data.overview ?? {}) as Data;
  const follow = (data.follow ?? {}) as Data;
  const pipe = (data.pipe ?? {}) as Data;
  const overdue = (data.overdue ?? []) as Data[];
  const today = (data.today ?? []) as Data[];
  const waiting = (data.waiting ?? []) as Data[];
  const approvals = (data.approvals ?? []) as Data[];
  const agenda = (data.agenda ?? []) as Data[];
  const leadsFollow = (follow.leads as Data[] | undefined) ?? [];
  const stale = (pipe.paradas as Data[] | undefined) ?? [];

  const priorities: string[] = [];
  if (approvals.length) priorities.push(`Decidir ${approvals.length} aprovação(ões) pendente(s) da Equipe IA`);
  if (waiting.length) priorities.push(`Responder ${waiting.length} cliente(s) aguardando`);
  if (overdue.length) priorities.push(`Resolver ${overdue.length} tarefa(s) atrasada(s)`);
  if (proposals.length) priorities.push(`Acompanhar ${proposals.length} proposta(s) em aberto`);
  if (leadsFollow.length) priorities.push(`Fazer follow-up com ${leadsFollow.length} lead(s) parados`);
  const problems: string[] = [
    ...(failedTasks ? [`${failedTasks} tarefa(s) da Equipe IA falharam nas últimas 24 h`] : []),
    ...integrationErrors.map((i) => `Integração ${i.name} (${i.type}) com erro: ${sanitizeText(i.lastError ?? '', 120)}`),
    ...(webhookFailures ? [`${webhookFailures} evento(s) de canal com falha de processamento`] : []),
    ...waiting.filter((w) => num(w.horasAguardando) >= 24).slice(0, 3).map((w) => `${w.contato} aguardando resposta há ${w.horasAguardando} h`),
  ];

  let content = [
    `# Briefing do CEO — ${day}`,
    `## Resumo\n${bullet(
      [
        `${newLeads} novo(s) lead(s) nas últimas 24 h; ${num(overview.novosLeads)} em 30 dias`,
        `${num((overview.vendasGanhas as Data | undefined)?.count)} venda(s) ganha(s) em 30 dias (${formatMoney(num((overview.vendasGanhas as Data | undefined)?.value))})`,
        `${num((overview.oportunidadesAbertas as Data | undefined)?.count)} oportunidade(s) abertas (${formatMoney(num((overview.oportunidadesAbertas as Data | undefined)?.value))})`,
        `${agenda.length} compromisso(s) hoje`,
      ],
      '',
    )}`,
    `## Leads e follow-ups\n${bullet(leadsFollow.slice(0, 8).map((l) => `${l.nome} — ${num(l.diasSemContato)} dia(s) sem contato (${l.status})`), 'Nenhum lead parado.')}\n${num(follow.followupsAtrasados)} follow-up(s) atrasado(s).`,
    `## Propostas em aberto\n${bullet(proposals.map((p) => `${p.title} — ${p.contact.name} (${formatMoney(toNumber(p.value))})`), 'Nenhuma proposta em aberto.')}`,
    `## Tarefas\n${bullet([...overdue.slice(0, 5).map((t) => `Atrasada: ${t.titulo}`), ...today.slice(0, 5).map((t) => `Hoje: ${t.titulo}`)], 'Sem tarefas para hoje.')}`,
    `## Prioridades do dia\n${priorities.length ? priorities.map((p, i) => `${i + 1}. ${p}`).join('\n') : '1. Sem pendências críticas: foco em prospecção e relacionamento.'}`,
    `## Problemas\n${bullet(problems, 'Nenhum problema detectado.')}`,
    `## Oportunidades\n${bullet([...hot.map((o) => `${o.title} — ${o.contact.name} (${o.stage.name}, ${formatMoney(toNumber(o.value))})`), ...stale.slice(0, 3).map((o) => `Reativar: ${o.titulo} (${num(o.diasNaEtapa)} dias parada)`)], 'Sem oportunidades em destaque.')}`,
    `## Aprovações pendentes\n${bullet(approvals.slice(0, 8).map((a) => String(a.resumo)), 'Nenhuma aprovação pendente.')}`,
  ].join('\n\n');

  if (rc.provider) {
    try {
      const { trackedChat } = await import('../ai/agent');
      const { estimateCostMicroUsd } = await import('../ai/pricing');
      const res = await trackedChat(
        rc.ctx,
        'agent:ceo:briefing',
        [
          { role: 'system', content: 'Você é o CEO Agent. Escreva uma abertura de briefing diário (3 a 5 frases, português do Brasil) destacando o mais importante e a principal recomendação do dia. Use apenas os dados fornecidos. Responda em JSON: {"final": {"summary": "texto"}}.' },
          { role: 'user', content: wrapUntrusted('briefing', content, 8000) },
        ],
        { provider: rc.provider, json: true, maxTokens: 2000, effort: 'low' },
      );
      rc.usage.tokensIn += res.tokensIn;
      rc.usage.tokensOut += res.tokensOut;
      rc.usage.costMicroUsd += estimateCostMicroUsd(res.model, res.tokensIn, res.tokensOut);
      const intro = (extractJsonObject(res.text)?.final as { summary?: unknown } | undefined)?.summary;
      if (typeof intro === 'string' && intro.trim()) content = content.replace('## Resumo', `## Mensagem do CEO\n${sanitizeText(intro, 1500)}\n\n## Resumo`);
    } catch {
      // A abertura com IA é opcional: o briefing com os dados reais segue normalmente.
    }
  }

  const cfg = readBriefingConfig(rc.company);
  const briefing = await db.aiBriefing.upsert({
    where: { organizationId_day: { organizationId: rc.orgId, day } },
    create: { organizationId: rc.orgId, day, content, data: { newLeads, priorities, problems } as Prisma.InputJsonValue },
    update: { content, data: { newLeads, priorities, problems } as Prisma.InputJsonValue },
  });
  let delivery = 'disponível na Central do CEO';
  if (cfg.deliverViaN8n && cfg.recipients.length && !rc.company.n8nEnabled) {
    delivery = 'envio pelo n8n não realizado: integração desativada nesta empresa';
  } else if (cfg.deliverViaN8n && cfg.recipients.length) {
    const users = await systemDb.user.findMany({ where: { id: { in: cfg.recipients }, memberships: { some: { organizationId: rc.orgId, status: 'ACTIVE' } } }, select: { name: true, email: true } });
    if (users.length) {
      const d = await enqueueDispatch(rc.orgId, { workflow: 'briefing', payload: { day, content, recipients: users }, idempotencyKey: `briefing:${rc.orgId}:${day}:${briefing.id}`, taskId: null });
      const outcome = d.status === 'PENDING' ? await sendDispatch(d.id) : 'skipped';
      delivery =
        outcome === 'pending_credential'
          ? 'envio pelo n8n PENDENTE DE CREDENCIAL'
          : outcome === 'held'
            ? 'envio pelo n8n retido (Equipe IA pausada ou integração desativada)'
            : `enviado ao n8n para ${users.length} destinatário(s)`;
      await db.aiBriefing.update({ where: { id: briefing.id }, data: { delivery: { n8nDispatchId: d.id, status: outcome } as Prisma.InputJsonValue } });
    }
  }
  await logActivity({ orgId: rc.orgId, agentId: rc.agent.id, taskId: rc.task.id, type: 'briefing.generated', message: `Briefing de ${day} gerado (${delivery}).` });
  return { type: 'completed', summary: content, data: { briefingId: briefing.id, day } };
}

export async function listBriefings(ctx: ServiceCtx, take = 14) {
  assertCan(ctx, 'ai_team.view');
  return ctx.db.aiBriefing.findMany({ orderBy: { day: 'desc' }, take });
}
