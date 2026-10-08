/**
 * Execução de ferramentas pelos agentes — o ponto único por onde toda ação passa:
 *   1. existência + allowlist do agente + teto do cargo (senão: BLOQUEADA e registrada);
 *   2. validação dos argumentos (Zod);
 *   3. avaliação de risco e categorias sensíveis (inclui varredura do texto que sairia da empresa);
 *   4. idempotência (mesma ação na mesma tarefa nunca executa duas vezes);
 *   5. política de aprovação (payload exato + hash; o que for aprovado é exatamente o que executa);
 *   6. execução no contexto da própria empresa, com registro do resultado e detecção de injeção.
 */
import type { AiAgent, AiCompany, AiTask, AiToolCall, Prisma } from '@prisma/client';
import { randomToken, sha256 } from '@/lib/crypto';
import { isUniqueViolation } from '@/lib/db';
import type { ServiceCtx } from '@/lib/auth/ctx';
import { logActivity } from './activity';
import { resolveLimits, decideApproval, maxRisk, type Risk } from './policy';
import { detectInjection, sanitizeDeep, stableStringify } from './security';
import { FORBIDDEN_PATTERNS, getTool, isToolAllowed, toolUnavailableReason, type ToolDef } from './tools';
import type { SensitiveCategory } from './constants';

export interface InvokeContext {
  orgId: string;
  ctx: ServiceCtx;
  agent: AiAgent;
  task: AiTask;
  company: AiCompany;
  runId: string | null;
}

export type InvokeStatus = 'executed' | 'failed' | 'blocked' | 'invalid' | 'approval' | 'waiting' | 'rejected' | 'interrupted';

export interface InvokeResult {
  status: InvokeStatus;
  tool: string;
  summary: string;
  data?: unknown;
  toolCallId?: string;
  approvalId?: string;
  dispatchId?: string;
  suspicious?: boolean;
  cached?: boolean;
}

export function payloadHash(tool: string, args: unknown) {
  return sha256(stableStringify({ tool, args }));
}

function companySettings(company: AiCompany) {
  const limits = (company.limits ?? {}) as Record<string, unknown>;
  return { allowAutonomousExternal: limits.allowAutonomousExternal === true };
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message.slice(0, 500) : 'Erro desconhecido.';
}

/** Executa de fato (registro RUNNING já criado/reivindicado) e grava o resultado. */
async function executeRecorded(ic: InvokeContext, def: ToolDef, args: unknown, call: Pick<AiToolCall, 'id' | 'idempotencyKey'>): Promise<InvokeResult> {
  const db = ic.ctx.db;
  try {
    const result = await def.run({ ctx: ic.ctx, orgId: ic.orgId, agent: ic.agent, task: ic.task, company: ic.company, runId: ic.runId, toolCallId: call.id, idempotencyKey: call.idempotencyKey }, args);
    const output = { data: sanitizeDeep(result.data, 0, 1500), summary: result.summary } as Prisma.InputJsonValue;
    if (result.waitingExternal) {
      await db.aiToolCall.update({ where: { id: call.id }, data: { status: 'WAITING_EXTERNAL', output } });
      return { status: 'waiting', tool: def.key, summary: result.summary, data: result.data, toolCallId: call.id, dispatchId: result.waitingExternal.dispatchId };
    }
    const flags = detectInjection(JSON.stringify(result.data ?? ''));
    await db.aiToolCall.update({ where: { id: call.id }, data: { status: 'EXECUTED', output, suspicious: flags.length > 0, executedAt: new Date() } });
    if (flags.length) {
      await logActivity({
        orgId: ic.orgId,
        agentId: ic.agent.id,
        objectiveId: ic.task.objectiveId,
        taskId: ic.task.id,
        type: 'security.injection_suspected',
        level: 'warning',
        message: `Possível tentativa de manipulação detectada nos dados retornados por ${def.label}. O conteúdo foi tratado apenas como dado.`,
        data: { tool: def.key, patterns: flags },
      });
    }
    return { status: 'executed', tool: def.key, summary: result.summary, data: result.data, toolCallId: call.id, suspicious: flags.length > 0 };
  } catch (err) {
    const message = errorMessage(err);
    await db.aiToolCall.update({ where: { id: call.id }, data: { status: 'FAILED', error: message, executedAt: new Date() } });
    return { status: 'failed', tool: def.key, summary: `${def.label} falhou: ${message}`, toolCallId: call.id };
  }
}

async function blocked(ic: InvokeContext, tool: string, args: unknown, reason: string): Promise<InvokeResult> {
  const call = await ic.ctx.db.aiToolCall.create({
    data: {
      organizationId: ic.orgId,
      taskId: ic.task.id,
      runId: ic.runId,
      agentId: ic.agent.id,
      tool: tool.slice(0, 80),
      risk: 'critical',
      input: (sanitizeDeep(args ?? {}) ?? {}) as Prisma.InputJsonValue,
      status: 'BLOCKED',
      idempotencyKey: `blocked:${randomToken(12)}`,
      error: reason,
    },
  });
  await logActivity({
    orgId: ic.orgId,
    agentId: ic.agent.id,
    objectiveId: ic.task.objectiveId,
    taskId: ic.task.id,
    type: 'tool.blocked',
    level: 'warning',
    message: `${ic.agent.name}: ação bloqueada (${tool.slice(0, 80)}) — ${reason}`,
  });
  return { status: 'blocked', tool, summary: `Ação "${tool}" bloqueada: ${reason}`, toolCallId: call.id };
}

/** Cria o pedido de aprovação com o payload exato (e seu hash) de uma chamada já registrada. */
async function createApprovalRequest(ic: InvokeContext, def: ToolDef, args: unknown, toolCallId: string, risk: Risk, categories: SensitiveCategory[], reason: string) {
  const limits = resolveLimits(ic.company.limits, ic.agent.limits);
  const approval = await ic.ctx.db.aiApproval.create({
    data: {
      organizationId: ic.orgId,
      taskId: ic.task.id,
      toolCallId,
      agentId: ic.agent.id,
      tool: def.key,
      risk,
      categories,
      summary: def.describe(args as never).slice(0, 1000),
      reason,
      payload: { tool: def.key, args: args as Prisma.InputJsonValue } as Prisma.InputJsonValue,
      payloadHash: payloadHash(def.key, args),
      expiresAt: new Date(Date.now() + limits.approvalTtlHours * 3_600_000),
    },
  });
  await logActivity({
    orgId: ic.orgId,
    agentId: ic.agent.id,
    objectiveId: ic.task.objectiveId,
    taskId: ic.task.id,
    type: 'approval.requested',
    level: 'warning',
    message: `${ic.agent.name} pediu aprovação: ${approval.summary}`,
    data: { approvalId: approval.id, risk, categories },
  });
  return approval;
}

/** Pede uma ação ao sistema de ferramentas, aplicando allowlist, validação, idempotência e aprovação. */
export async function invokeTool(ic: InvokeContext, tool: string, rawArgs: unknown): Promise<InvokeResult> {
  const def = getTool(tool);
  if (!def) {
    const forbidden = FORBIDDEN_PATTERNS.some((re) => re.test(tool));
    return blocked(ic, tool, rawArgs, forbidden ? 'ação proibida para agentes (exige uma pessoa).' : 'ferramenta inexistente.');
  }
  if (!isToolAllowed(ic.agent, def.key)) return blocked(ic, def.key, rawArgs, `não está na lista de ferramentas permitidas para ${ic.agent.name}.`);
  const unavailable = toolUnavailableReason(def.key, ic.company);
  if (unavailable) return blocked(ic, def.key, rawArgs, unavailable);

  const parsed = def.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.') || 'args'}: ${i.message}`).join('; ');
    return { status: 'invalid', tool: def.key, summary: `Argumentos inválidos para ${def.key}: ${issues}` };
  }
  const args = parsed.data as unknown;
  const assessment = def.assess ? await def.assess({ ctx: ic.ctx, orgId: ic.orgId, agent: ic.agent, task: ic.task, company: ic.company }, args as never) : {};
  const risk: Risk = maxRisk(def.risk, assessment.risk ?? def.risk);
  const categories = [...new Set<SensitiveCategory>([...(def.categories ?? []), ...(assessment.categories ?? [])])];
  const idempotencyKey = sha256(`${ic.task.id}|${def.key}|${stableStringify(args)}`);
  const db = ic.ctx.db;
  const decision = decideApproval({ autonomy: ic.agent.autonomy, risk, categories, ...companySettings(ic.company) });

  const existing = await db.aiToolCall.findFirst({ where: { idempotencyKey } });
  if (existing) {
    const out = (existing.output ?? {}) as { data?: unknown; summary?: string };
    switch (existing.status) {
      case 'EXECUTED':
        return { status: 'executed', tool: def.key, summary: out.summary ?? 'Já executada.', data: out.data, toolCallId: existing.id, cached: true };
      case 'PENDING_APPROVAL': {
        const approval = await db.aiApproval.findFirst({ where: { toolCallId: existing.id } });
        return { status: 'approval', tool: def.key, summary: 'Aguardando aprovação humana.', toolCallId: existing.id, approvalId: approval?.id };
      }
      case 'APPROVED':
        return executeApprovedCall(ic, existing);
      case 'REJECTED':
        return { status: 'rejected', tool: def.key, summary: `Ação não aprovada${existing.error ? `: ${existing.error}` : '.'}`, toolCallId: existing.id };
      case 'WAITING_EXTERNAL':
        return { status: 'waiting', tool: def.key, summary: out.summary ?? 'Aguardando retorno externo.', data: out.data, toolCallId: existing.id, dispatchId: (out.data as { dispatchId?: string } | undefined)?.dispatchId };
      case 'RUNNING':
        return { status: 'interrupted', tool: def.key, summary: 'Uma execução anterior desta mesma ação foi interrompida; verifique o resultado antes de repetir.', toolCallId: existing.id };
      case 'FAILED': {
        // Nova tentativa da mesma ação (ex.: falha temporária). A política vale de novo: se hoje a ação exige
        // aprovação (autonomia reduzida, ações externas desligadas...), só repete com uma aprovação do mesmo payload.
        if (decision.required) {
          const approved = await db.aiApproval.findFirst({ where: { toolCallId: existing.id, status: 'APPROVED', payloadHash: payloadHash(def.key, args) } });
          if (!approved) {
            const prior = await db.aiApproval.findFirst({ where: { toolCallId: existing.id }, select: { id: true } });
            if (prior) return { status: 'failed', tool: def.key, summary: `${def.label} falhou anteriormente e exige nova aprovação: peça novamente com outro conteúdo.`, toolCallId: existing.id };
            const moved = await db.aiToolCall.updateMany({ where: { id: existing.id, status: 'FAILED' }, data: { status: 'PENDING_APPROVAL', error: null, runId: ic.runId } });
            if (moved.count !== 1) return { status: 'interrupted', tool: def.key, summary: 'Ação em execução por outro processo.', toolCallId: existing.id };
            const approval = await createApprovalRequest(ic, def, args, existing.id, risk, categories, decision.reason);
            return { status: 'approval', tool: def.key, summary: `Aguardando aprovação humana: ${approval.summary}`, toolCallId: existing.id, approvalId: approval.id };
          }
        }
        const claimed = await db.aiToolCall.updateMany({ where: { id: existing.id, status: 'FAILED' }, data: { status: 'RUNNING', error: null, runId: ic.runId } });
        if (claimed.count !== 1) return { status: 'interrupted', tool: def.key, summary: 'Ação em execução por outro processo.', toolCallId: existing.id };
        return executeRecorded(ic, def, args, existing);
      }
      default:
        return { status: 'failed', tool: def.key, summary: `Estado inesperado da ação (${existing.status}).`, toolCallId: existing.id };
    }
  }

  const input = args as Prisma.InputJsonValue;
  if (decision.required) {
    try {
      const call = await db.aiToolCall.create({
        data: { organizationId: ic.orgId, taskId: ic.task.id, runId: ic.runId, agentId: ic.agent.id, tool: def.key, risk, input, status: 'PENDING_APPROVAL', idempotencyKey },
      });
      const approval = await createApprovalRequest(ic, def, args, call.id, risk, categories, decision.reason);
      return { status: 'approval', tool: def.key, summary: `Aguardando aprovação humana: ${approval.summary}`, toolCallId: call.id, approvalId: approval.id };
    } catch (err) {
      if (isUniqueViolation(err)) return invokeTool(ic, tool, rawArgs); // corrida: outra execução registrou a mesma ação
      throw err;
    }
  }

  let call: AiToolCall;
  try {
    call = await db.aiToolCall.create({
      data: { organizationId: ic.orgId, taskId: ic.task.id, runId: ic.runId, agentId: ic.agent.id, tool: def.key, risk, input, status: 'RUNNING', idempotencyKey },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return invokeTool(ic, tool, rawArgs);
    throw err;
  }
  return executeRecorded(ic, def, args, call);
}

/** Executa uma ação aprovada por uma pessoa — exatamente o payload aprovado (verificado por hash). */
export async function executeApprovedCall(ic: InvokeContext, call: AiToolCall): Promise<InvokeResult> {
  const db = ic.ctx.db;
  const def = getTool(call.tool);
  const approval = await db.aiApproval.findFirst({ where: { toolCallId: call.id, status: 'APPROVED' } });
  // Falhas de integridade são terminais (BLOCKED): a ação nunca é repetida pelo caminho de nova tentativa.
  const fail = async (reason: string, status: 'FAILED' | 'BLOCKED' = 'BLOCKED') => {
    await db.aiToolCall.updateMany({ where: { id: call.id, status: 'APPROVED' }, data: { status, error: reason, executedAt: new Date() } });
    return { status: 'failed' as const, tool: call.tool, summary: reason, toolCallId: call.id };
  };
  if (!def || !approval) return fail('Aprovação não encontrada para esta ação.');
  if (approval.payloadHash !== payloadHash(call.tool, call.input)) return fail('O conteúdo da ação mudou depois da aprovação; execução cancelada por segurança.');
  const unavailable = toolUnavailableReason(def.key, ic.company);
  if (unavailable) return fail(`Ação aprovada não executada: ${unavailable}`, 'FAILED');
  if (!isToolAllowed(ic.agent, def.key)) return fail(`A ferramenta deixou de ser permitida para ${ic.agent.name}.`);
  const parsed = def.schema.safeParse(call.input);
  if (!parsed.success) return fail('Os argumentos aprovados não são mais válidos.');
  const claimed = await db.aiToolCall.updateMany({ where: { id: call.id, status: 'APPROVED' }, data: { status: 'RUNNING', runId: ic.runId } });
  if (claimed.count !== 1) return { status: 'interrupted', tool: call.tool, summary: 'Ação aprovada já está sendo executada.', toolCallId: call.id };
  return executeRecorded(ic, def, parsed.data, call);
}
