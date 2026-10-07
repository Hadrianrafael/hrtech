import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { tenantDb, withSystem } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/errors';
import { isProviderName } from '../ai/provider';
import { logActivity } from './activity';
import { briefingConfigSchema } from './briefing';
import { AGENT_DEFINITIONS, ROLE_TOOLS, isAgentKey } from './constants';
import { N8N_WORKFLOWS } from './n8n';

/** Memórias iniciais (orientações da empresa). A HR Tech, primeira empresa usuária, recebe o contexto do próprio negócio. */
function defaultMemories(platformOwner: boolean) {
  const base = [
    { kind: 'PREFERENCE', title: 'Aprovações', content: 'Preço, desconto, contrato, pagamento, gastos, exclusões e qualquer ação irreversível sempre passam por aprovação humana.' },
    { kind: 'PREFERENCE', title: 'Tom de voz', content: 'Comunicação consultiva, próxima e objetiva, em português do Brasil. Nunca prometer prazos, descontos ou condições sem aprovação.' },
  ];
  if (!platformOwner) return base;
  return [
    ...base,
    { kind: 'FACT', title: 'O que a HR Tech vende', content: 'A HR Tech Sistemas desenvolve a HR Tech Omni: SaaS omnichannel (WhatsApp, Instagram, e-mail e chat do site) com CRM, funil, IA e automações para hotéis, pousadas, turismo e serviços.' },
    { kind: 'FACT', title: 'Perfil de cliente ideal', content: 'Pousadas e hotéis independentes no Brasil (cerca de 10 a 80 quartos) que atendem reservas por WhatsApp e Instagram e perdem oportunidades por demora no retorno.' },
    { kind: 'GOAL', title: 'Objetivo comercial', content: 'Converter leads em assinantes dos planos Starter, Professional e Business, com demonstração de 15 minutos como principal chamada.' },
    { kind: 'FACT', title: 'Equipe de desenvolvimento', content: 'Mudanças no produto passam por Pull Request revisado por uma pessoa; agentes nunca fazem merge na main nem deploy em produção.' },
  ];
}

/** Provisiona (idempotente) a Equipe IA de uma empresa: configuração, 7 agentes, prompts v1 e memórias iniciais. */
export async function ensureAiCompany(orgId: string, opts: { enable?: boolean; platformOwner?: boolean } = {}) {
  const db = tenantDb(orgId);
  let company = await db.aiCompany.findFirst({});
  if (!company) {
    company = await db.aiCompany.create({
      data: {
        organizationId: orgId,
        enabled: opts.enable ?? false,
        briefing: briefingConfigSchema.parse({ enabled: true }) as Prisma.InputJsonValue,
      },
    });
  } else if (opts.enable && !company.enabled) {
    company = await db.aiCompany.update({ where: { id: company.id }, data: { enabled: true } });
  }
  for (const def of AGENT_DEFINITIONS) {
    const existing = await db.aiAgent.findFirst({ where: { key: def.key } });
    if (existing) continue;
    await withSystem(async (tx) => {
      const agent = await tx.aiAgent.create({
        data: {
          organizationId: orgId,
          key: def.key,
          name: def.name,
          title: def.title,
          department: def.department,
          description: def.description,
          isCeo: def.isCeo,
          autonomy: 'SUPERVISED',
          tools: ROLE_TOOLS[def.key],
        },
      });
      const prompt = await tx.aiPromptVersion.create({ data: { organizationId: orgId, agentId: agent.id, version: 1, systemPrompt: def.prompt, notes: 'Versão inicial.' } });
      await tx.aiAgent.update({ where: { id: agent.id }, data: { currentPromptId: prompt.id } });
    });
  }
  if (!(await db.aiMemory.count({ where: { source: { not: 'AGENT' } } }))) {
    await db.aiMemory.createMany({
      data: defaultMemories(!!opts.platformOwner).map((m) => ({ organizationId: orgId, scope: 'COMPANY', source: 'SYSTEM', importance: 4, pinned: true, ...m })),
    });
  }
  return company;
}

export async function activateAiCompany(ctx: ServiceCtx) {
  assertCan(ctx, 'ai_team.manage');
  const org = await ctx.db.organization.findFirstOrThrow({ select: { isPlatformOwner: true } });
  const company = await ensureAiCompany(ctx.orgId, { enable: true, platformOwner: org.isPlatformOwner });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.activated', entityType: 'AiCompany', entityId: company.id });
  return company;
}

const modelId = z.string().trim().regex(/^[\w.:/-]{2,80}$/, 'Modelo inválido.');

export const agentConfigSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']),
  autonomy: z.enum(['MANUAL', 'SUPERVISED', 'AUTONOMOUS']),
  provider: z.string().refine((v) => v === 'auto' || isProviderName(v), 'Provedor inválido.'),
  model: modelId.optional().nullable().or(z.literal('')),
  tools: z.array(z.string().max(80)).max(40),
  limits: z
    .object({
      maxStepsPerRun: z.coerce.number().int().min(1).max(20).optional(),
      maxTokensPerTask: z.coerce.number().int().min(2_000).max(1_000_000).optional(),
      dailyBudgetCents: z.coerce.number().int().min(0).max(1_000_000).optional(),
      maxTasksPerAgentPerDay: z.coerce.number().int().min(1).max(1000).optional(),
    })
    .default({}),
});

export async function updateAgent(ctx: ServiceCtx, id: string, input: z.input<typeof agentConfigSchema>) {
  assertCan(ctx, 'ai_team.manage');
  const agent = await ctx.db.aiAgent.findFirst({ where: { id } });
  if (!agent) throw new NotFoundError('Agente não encontrado.');
  const d = agentConfigSchema.parse(input);
  const ceiling = isAgentKey(agent.key) ? new Set(ROLE_TOOLS[agent.key]) : new Set<string>();
  const outside = d.tools.filter((t) => !ceiling.has(t));
  if (outside.length) throw new AppError(`Ferramentas fora do escopo do cargo: ${outside.join(', ')}.`);
  const updated = await ctx.db.aiAgent.update({
    where: { id },
    data: { status: d.status, autonomy: d.autonomy, provider: d.provider, model: d.model || null, tools: [...new Set(d.tools)], limits: d.limits as Prisma.InputJsonValue },
  });
  const changes: Record<string, unknown> = {};
  if (agent.status !== updated.status) changes.status = [agent.status, updated.status];
  if (agent.autonomy !== updated.autonomy) changes.autonomy = [agent.autonomy, updated.autonomy];
  if (agent.provider !== updated.provider || agent.model !== updated.model) changes.model = [`${agent.provider}/${agent.model ?? ''}`, `${updated.provider}/${updated.model ?? ''}`];
  const added = updated.tools.filter((t) => !agent.tools.includes(t));
  const removed = agent.tools.filter((t) => !updated.tools.includes(t));
  if (added.length || removed.length) changes.tools = { added, removed };
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.agent_updated', entityType: 'AiAgent', entityId: id, severity: changes.autonomy || added.length ? 'warning' : 'info', metadata: changes });
  await logActivity({ orgId: ctx.orgId, agentId: id, type: 'agent.updated', message: `Configuração de ${agent.name} atualizada.`, data: changes });
  return updated;
}

export const promptSchema = z.object({
  systemPrompt: z.string().trim().min(50, 'O prompt deve ter pelo menos 50 caracteres.').max(12_000),
  notes: z.string().trim().max(500).optional(),
  activate: z.boolean().default(true),
});

/** Nova versão do prompt (o histórico é preservado; rollback = ativar uma versão anterior). */
export async function createPromptVersion(ctx: ServiceCtx, agentId: string, input: z.input<typeof promptSchema>) {
  assertCan(ctx, 'ai_team.manage');
  const agent = await ctx.db.aiAgent.findFirst({ where: { id: agentId } });
  if (!agent) throw new NotFoundError('Agente não encontrado.');
  const d = promptSchema.parse(input);
  const last = await ctx.db.aiPromptVersion.findFirst({ where: { agentId }, orderBy: { version: 'desc' } });
  const version = await ctx.db.aiPromptVersion.create({
    data: { organizationId: ctx.orgId, agentId, version: (last?.version ?? 0) + 1, systemPrompt: d.systemPrompt, notes: d.notes ?? null, createdById: ctx.userId },
  });
  if (d.activate) await ctx.db.aiAgent.update({ where: { id: agentId }, data: { currentPromptId: version.id } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.prompt_version_created', entityType: 'AiAgent', entityId: agentId, metadata: { version: version.version, activated: d.activate } });
  return version;
}

export async function activatePromptVersion(ctx: ServiceCtx, agentId: string, versionId: string) {
  assertCan(ctx, 'ai_team.manage');
  const version = await ctx.db.aiPromptVersion.findFirst({ where: { id: versionId, agentId } });
  if (!version) throw new NotFoundError('Versão não encontrada.');
  await ctx.db.aiAgent.update({ where: { id: agentId }, data: { currentPromptId: version.id } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'ai_team.prompt_version_activated', entityType: 'AiAgent', entityId: agentId, metadata: { version: version.version } });
}

export async function setCompanyPaused(ctx: ServiceCtx, paused: boolean, reason?: string) {
  assertCan(ctx, 'ai_team.manage');
  const company = await ctx.db.aiCompany.findFirst({});
  if (!company) throw new NotFoundError('Equipe IA não configurada.');
  await ctx.db.aiCompany.update({ where: { id: company.id }, data: { paused, pausedReason: paused ? (reason?.slice(0, 300) ?? 'Pausada manualmente.') : null } });
  await logActivity({ orgId: ctx.orgId, type: paused ? 'company.paused' : 'company.resumed', level: paused ? 'warning' : 'info', message: paused ? 'Equipe IA pausada: nenhuma tarefa será executada.' : 'Equipe IA retomada.' });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: paused ? 'ai_team.paused' : 'ai_team.resumed', entityType: 'AiCompany', entityId: company.id, severity: 'warning' });
}

const workflowPath = z.string().trim().regex(/^\/[\w\-/.]{1,200}$/, 'Caminho de webhook inválido (ex.: /webhook/hrtech-prospeccao).');

export const companySettingsSchema = z.object({
  enabled: z.boolean(),
  dailyBudgetCents: z.coerce.number().int().min(0).max(10_000_000),
  monthlyBudgetCents: z.coerce.number().int().min(0).max(100_000_000),
  limits: z.object({
    maxStepsPerRun: z.coerce.number().int().min(1).max(20),
    maxTokensPerTask: z.coerce.number().int().min(2_000).max(1_000_000),
    maxDelegationDepth: z.coerce.number().int().min(1).max(3),
    maxTasksPerObjective: z.coerce.number().int().min(1).max(60),
    maxSubtasksPerTask: z.coerce.number().int().min(1).max(15),
    maxAttempts: z.coerce.number().int().min(1).max(6),
    approvalTtlHours: z.coerce.number().int().min(1).max(336),
    allowAutonomousExternal: z.boolean().default(false),
  }),
  briefing: briefingConfigSchema,
  n8nEnabled: z.boolean(),
  n8nWorkflows: z.record(z.enum(Object.keys(N8N_WORKFLOWS) as [keyof typeof N8N_WORKFLOWS]), workflowPath.or(z.literal(''))).default({}),
});

export async function updateCompanySettings(ctx: ServiceCtx, input: z.input<typeof companySettingsSchema>) {
  assertCan(ctx, 'ai_team.manage');
  const company = await ctx.db.aiCompany.findFirst({});
  if (!company) throw new NotFoundError('Equipe IA não configurada.');
  const d = companySettingsSchema.parse(input);
  if (d.briefing.recipients.length) {
    const members = await ctx.db.membership.count({ where: { userId: { in: d.briefing.recipients }, status: 'ACTIVE' } });
    if (members !== new Set(d.briefing.recipients).size) throw new AppError('Os destinatários do briefing devem ser membros ativos da empresa.');
  }
  const workflows = Object.fromEntries(Object.entries(d.n8nWorkflows).filter(([, v]) => v));
  const updated = await ctx.db.aiCompany.update({
    where: { id: company.id },
    data: {
      enabled: d.enabled,
      dailyBudgetCents: d.dailyBudgetCents,
      monthlyBudgetCents: d.monthlyBudgetCents,
      limits: d.limits as Prisma.InputJsonValue,
      briefing: d.briefing as Prisma.InputJsonValue,
      n8nEnabled: d.n8nEnabled,
      n8nWorkflows: workflows as Prisma.InputJsonValue,
    },
  });
  await audit({
    organizationId: ctx.orgId,
    actorUserId: ctx.userId,
    action: 'ai_team.settings_updated',
    entityType: 'AiCompany',
    entityId: company.id,
    severity: d.limits.allowAutonomousExternal ? 'warning' : 'info',
    metadata: { enabled: d.enabled, dailyBudgetCents: d.dailyBudgetCents, monthlyBudgetCents: d.monthlyBudgetCents, allowAutonomousExternal: d.limits.allowAutonomousExternal, n8nEnabled: d.n8nEnabled },
  });
  return updated;
}
