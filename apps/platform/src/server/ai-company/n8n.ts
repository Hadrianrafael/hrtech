/**
 * Integração com o n8n (serviço externo de automação).
 *
 *  SaaS → n8n: cada ação externa vira um N8nDispatch (fila no banco) com chave de idempotência, assinatura
 *  HMAC-SHA256, tempo limite e novas tentativas com backoff. Se o n8n estiver fora do ar, o envio continua
 *  pendente e é reenviado depois; a tarefa do agente fica aguardando. Sem credenciais (N8N_BASE_URL /
 *  N8N_WEBHOOK_SECRET), o envio fica "PENDENTE DE CREDENCIAL" e sai automaticamente quando forem configuradas.
 *
 *  n8n → SaaS: o retorno chega em /api/webhooks/n8n, com a mesma assinatura (timestamp + HMAC) e um eventId
 *  único (idempotência via WebhookEvent). O resultado é tratado como dado não confiável.
 */
import type { N8nDispatch, Prisma } from '@prisma/client';
import { z } from 'zod';
import { hmacSha256Hex, safeEqual } from '@/lib/crypto';
import { isUniqueViolation, systemDb, tenantDb } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { logActivity } from './activity';
import { backoffMs } from './policy';
import { sanitizeDeep } from './security';

export const N8N_WORKFLOWS = {
  prospeccao: { label: 'Prospecção (busca de empresas)', path: '/webhook/hrtech-prospeccao' },
  comercial: { label: 'Comercial (sequências de contato)', path: '/webhook/hrtech-comercial' },
  briefing: { label: 'Envio do briefing diário', path: '/webhook/hrtech-briefing' },
  marketing: { label: 'Marketing (publicações)', path: '/webhook/hrtech-marketing' },
  desenvolvimento: { label: 'Desenvolvimento (issues)', path: '/webhook/hrtech-desenvolvimento' },
  financeiro: { label: 'Financeiro (cobranças)', path: '/webhook/hrtech-financeiro' },
} as const;

export type N8nWorkflow = keyof typeof N8N_WORKFLOWS;

/** Ponto único de entrada no n8n: o fluxo "dispatcher" roteia pelo campo `workflow`. */
export const N8N_DISPATCHER_PATH = '/webhook/hrtech-dispatcher';

export const PENDING_CREDENTIAL = 'PENDENTE DE CREDENCIAL: defina N8N_BASE_URL e N8N_WEBHOOK_SECRET.';
const CREDENTIAL_RECHECK_MS = 15 * 60_000;
const SENT_TIMEOUT_MS = 24 * 60 * 60_000;
const SENDING_STALE_MS = 5 * 60_000;
const SIGNATURE_TOLERANCE_SEC = 300;

export function n8nConfig() {
  const baseUrl = env.n8nBaseUrl();
  const secret = env.n8nWebhookSecret();
  const missing = [...(baseUrl ? [] : ['N8N_BASE_URL']), ...(secret ? [] : ['N8N_WEBHOOK_SECRET'])];
  return { configured: missing.length === 0, baseUrl: baseUrl ?? null, missing, dispatcherUrl: baseUrl ? `${baseUrl}${N8N_DISPATCHER_PATH}` : null };
}

// ─────────────── Assinatura ───────────────

/** Cabeçalho X-HRTech-Signature: "t=<unix>,v1=<hex(hmac_sha256(secret, `${t}.${body}`))>". */
export function signBody(secret: string, body: string, t = Math.floor(Date.now() / 1000)) {
  return `t=${t},v1=${hmacSha256Hex(secret, `${t}.${body}`)}`;
}

export function verifySignature(secret: string, header: string | null, body: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isFinite(t) || !v1 || !/^[a-f0-9]{64}$/.test(v1)) return false;
  if (Math.abs(nowSec - t) > SIGNATURE_TOLERANCE_SEC) return false;
  return safeEqual(hmacSha256Hex(secret, `${t}.${body}`), v1);
}

// ─────────────── Fila de envio ───────────────

export async function enqueueDispatch(
  orgId: string,
  input: { workflow: N8nWorkflow; payload: Record<string, unknown>; idempotencyKey: string; taskId?: string | null; toolCallId?: string | null },
): Promise<N8nDispatch> {
  const db = tenantDb(orgId);
  try {
    const d = await db.n8nDispatch.create({
      data: {
        organizationId: orgId,
        workflow: input.workflow,
        payload: input.payload as Prisma.InputJsonValue,
        idempotencyKey: input.idempotencyKey,
        taskId: input.taskId ?? null,
        toolCallId: input.toolCallId ?? null,
      },
    });
    await logActivity({ orgId, taskId: input.taskId, type: 'n8n.queued', message: `Envio ao n8n enfileirado: ${N8N_WORKFLOWS[input.workflow].label}.`, data: { dispatchId: d.id } });
    return d;
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    // Mesma chave de idempotência = mesmo envio (nunca duplica ações externas).
    const existing = await db.n8nDispatch.findFirst({ where: { idempotencyKey: input.idempotencyKey } });
    if (!existing) throw err;
    return existing;
  }
}

async function workflowUrl(d: N8nDispatch, baseUrl: string) {
  const company = await systemDb.aiCompany.findUnique({ where: { organizationId: d.organizationId }, select: { n8nWorkflows: true } });
  const overrides = (company?.n8nWorkflows ?? {}) as Record<string, unknown>;
  const custom = overrides[d.workflow];
  const path = typeof custom === 'string' && /^\/[\w\-/.]{1,200}$/.test(custom) ? custom : N8N_DISPATCHER_PATH;
  return `${baseUrl}${path}`;
}

export type SendOutcome = 'sent' | 'completed' | 'pending_credential' | 'retry' | 'failed' | 'dead' | 'skipped';

/** Envia um dispatch (com reivindicação atômica: dois workers nunca enviam o mesmo registro ao mesmo tempo). */
export async function sendDispatch(id: string, now = new Date()): Promise<SendOutcome> {
  const claimed = await systemDb.n8nDispatch.updateMany({ where: { id, status: 'PENDING', nextAttemptAt: { lte: now } }, data: { status: 'SENDING' } });
  if (claimed.count !== 1) return 'skipped';
  const d = await systemDb.n8nDispatch.findUniqueOrThrow({ where: { id } });
  const cfg = n8nConfig();
  if (!cfg.configured) {
    await systemDb.n8nDispatch.update({
      where: { id },
      data: { status: 'PENDING', lastError: PENDING_CREDENTIAL, nextAttemptAt: new Date(now.getTime() + CREDENTIAL_RECHECK_MS) },
    });
    return 'pending_credential';
  }
  const body = JSON.stringify({
    id: d.id,
    idempotencyKey: d.idempotencyKey,
    workflow: d.workflow,
    organizationId: d.organizationId,
    taskId: d.taskId,
    callbackUrl: `${env.appUrl()}/api/webhooks/n8n`,
    sentAt: now.toISOString(),
    attempt: d.attempts + 1,
    data: d.payload,
  });
  const url = await workflowUrl(d, cfg.baseUrl!);
  let status = 0;
  let responseJson: Record<string, unknown> | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HRTech-Signature': signBody(env.n8nWebhookSecret()!, body),
        'X-HRTech-Idempotency-Key': d.idempotencyKey,
        'X-HRTech-Workflow': d.workflow,
      },
      body,
      signal: AbortSignal.timeout(env.n8nTimeoutMs()),
      redirect: 'error',
    });
    status = res.status;
    const text = await res.text().catch(() => '');
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) responseJson = parsed as Record<string, unknown>;
      } catch {
        /* resposta não-JSON: tudo bem, o retorno virá pelo callback */
      }
    }
    if (!res.ok) error = `n8n respondeu ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`;
  } catch (err) {
    error = err instanceof Error && err.name === 'TimeoutError' ? 'Tempo limite ao chamar o n8n.' : 'Falha de conexão com o n8n.';
  }

  const attempts = d.attempts + 1;
  if (status >= 200 && status < 300) {
    const externalId = typeof responseJson?.executionId === 'string' || typeof responseJson?.executionId === 'number' ? String(responseJson.executionId) : null;
    await systemDb.n8nDispatch.update({ where: { id }, data: { status: 'SENT', attempts, sentAt: now, responseStatus: status, lastError: null, externalId } });
    // Fluxos síncronos podem devolver o resultado na própria resposta.
    if (responseJson?.status === 'completed' || responseJson?.status === 'failed') {
      await applyDispatchResult(id, {
        status: responseJson.status as 'completed' | 'failed',
        result: responseJson.result,
        error: typeof responseJson.error === 'string' ? responseJson.error : undefined,
      });
      return 'completed';
    }
    await logActivity({ orgId: d.organizationId, taskId: d.taskId, type: 'n8n.sent', message: `Enviado ao n8n (${N8N_WORKFLOWS[d.workflow as N8nWorkflow]?.label ?? d.workflow}).`, data: { dispatchId: id } });
    return 'sent';
  }
  // 4xx (exceto timeout/conflito/limite) = erro permanente de contrato: não adianta repetir.
  const permanent = status >= 400 && status < 500 && ![408, 409, 425, 429].includes(status);
  if (permanent || attempts >= d.maxAttempts) {
    const finalStatus = permanent ? 'FAILED' : 'DEAD';
    await systemDb.n8nDispatch.update({ where: { id }, data: { status: finalStatus, attempts, responseStatus: status || null, lastError: error } });
    await logActivity({ orgId: d.organizationId, taskId: d.taskId, type: 'n8n.failed', level: 'error', message: `Envio ao n8n falhou${permanent ? '' : ` após ${attempts} tentativas`}: ${error}`, data: { dispatchId: id } });
    await resumeAfterDispatch(id);
    return permanent ? 'failed' : 'dead';
  }
  await systemDb.n8nDispatch.update({
    where: { id },
    data: { status: 'PENDING', attempts, responseStatus: status || null, lastError: error, nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)) },
  });
  logger.warn('n8n.dispatch_retry', { id, attempts, error });
  return 'retry';
}

/** Processa a fila: envios vencidos, recuperação de envios presos e envios sem retorno. */
export async function processDueDispatches(limit = 20, now = new Date(), orgId?: string) {
  const scope = orgId ? { organizationId: orgId } : {};
  await systemDb.n8nDispatch.updateMany({ where: { ...scope, status: 'SENDING', updatedAt: { lt: new Date(now.getTime() - SENDING_STALE_MS) } }, data: { status: 'PENDING' } });
  const stuck = await systemDb.n8nDispatch.findMany({ where: { ...scope, status: 'SENT', sentAt: { lt: new Date(now.getTime() - SENT_TIMEOUT_MS) } }, select: { id: true }, take: 50 });
  for (const s of stuck) await applyDispatchResult(s.id, { status: 'failed', error: 'O n8n não enviou o retorno em 24 horas.' });

  const due = await systemDb.n8nDispatch.findMany({ where: { ...scope, status: 'PENDING', nextAttemptAt: { lte: now } }, orderBy: { nextAttemptAt: 'asc' }, take: limit, select: { id: true } });
  const outcomes: Record<string, number> = {};
  for (const d of due) {
    const r = await sendDispatch(d.id, now);
    outcomes[r] = (outcomes[r] ?? 0) + 1;
  }
  return { processed: due.length, outcomes };
}

/** Reenvio manual (tela de configuração): recoloca um envio falho na fila, zerando as tentativas. */
export async function retryDispatch(orgId: string, id: string) {
  const r = await tenantDb(orgId).n8nDispatch.updateMany({
    where: { id, status: { in: ['FAILED', 'DEAD'] } },
    data: { status: 'PENDING', attempts: 0, nextAttemptAt: new Date(), lastError: null },
  });
  return r.count === 1;
}

// ─────────────── Retorno do n8n ───────────────

/** Aplica o resultado (completed/failed) uma única vez e retoma a tarefa do agente. */
export async function applyDispatchResult(id: string, outcome: { status: 'completed' | 'failed'; result?: unknown; error?: string }) {
  const finalStatus = outcome.status === 'completed' ? 'COMPLETED' : 'FAILED';
  const updated = await systemDb.n8nDispatch.updateMany({
    where: { id, status: { in: ['PENDING', 'SENDING', 'SENT'] } },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      // Até 200 itens por lista (ex.: prospects); o que vai para o prompt é recortado de novo em wrapUntrusted.
      result: outcome.result === undefined ? undefined : (sanitizeDeep(outcome.result, 0, 2000, 200) as Prisma.InputJsonValue),
      lastError: outcome.status === 'failed' ? (outcome.error ?? 'O fluxo do n8n retornou falha.').slice(0, 1000) : null,
    },
  });
  if (updated.count !== 1) return false; // já finalizado (retorno repetido)
  const d = await systemDb.n8nDispatch.findUniqueOrThrow({ where: { id } });
  await logActivity({
    orgId: d.organizationId,
    taskId: d.taskId,
    type: outcome.status === 'completed' ? 'n8n.completed' : 'n8n.failed',
    level: outcome.status === 'completed' ? 'info' : 'error',
    message: outcome.status === 'completed' ? `Retorno do n8n recebido (${d.workflow}).` : `O n8n retornou falha (${d.workflow}): ${d.lastError}`,
    data: { dispatchId: id },
  });
  await resumeAfterDispatch(id);
  return true;
}

/** Atualiza a chamada de ferramenta que aguardava o n8n e recoloca a tarefa na fila. */
export async function resumeAfterDispatch(id: string) {
  const d = await systemDb.n8nDispatch.findUniqueOrThrow({ where: { id } });
  const db = tenantDb(d.organizationId);
  if (d.toolCallId) {
    const ok = d.status === 'COMPLETED';
    await db.aiToolCall.updateMany({
      where: { id: d.toolCallId, status: 'WAITING_EXTERNAL' },
      data: {
        status: ok ? 'EXECUTED' : 'FAILED',
        output: { dispatchId: d.id, status: d.status, result: d.result ?? null } as Prisma.InputJsonValue,
        error: ok ? null : d.lastError,
        executedAt: new Date(),
      },
    });
  }
  if (d.taskId) {
    await db.aiTask.updateMany({ where: { id: d.taskId, status: 'RUNNING', waitingFor: `n8n:${d.id}` }, data: { status: 'QUEUED', waitingFor: null, nextRunAt: new Date(), lockedUntil: null } });
  }
}

export const callbackSchema = z.object({
  eventId: z.string().trim().min(8).max(200),
  dispatchId: z.string().trim().min(10).max(60),
  idempotencyKey: z.string().max(200).optional(),
  status: z.enum(['completed', 'failed', 'progress']),
  result: z.unknown().optional(),
  error: z.string().max(2000).optional(),
  message: z.string().max(2000).optional(),
});

export type CallbackOutcome = { ok: true; duplicate?: boolean; applied?: boolean } | { ok: false; status: number; error: string };

/** Processa o retorno assinado do n8n (idempotente pelo eventId). */
export async function handleN8nCallback(rawBody: string, signature: string | null): Promise<CallbackOutcome> {
  const secret = env.n8nWebhookSecret();
  if (!secret) return { ok: false, status: 503, error: PENDING_CREDENTIAL };
  if (!verifySignature(secret, signature, rawBody)) return { ok: false, status: 401, error: 'Assinatura inválida.' };
  let parsed: z.infer<typeof callbackSchema>;
  try {
    parsed = callbackSchema.parse(JSON.parse(rawBody));
  } catch {
    return { ok: false, status: 400, error: 'Payload inválido.' };
  }
  const dispatch = await systemDb.n8nDispatch.findUnique({ where: { id: parsed.dispatchId } });
  if (!dispatch || (parsed.idempotencyKey && parsed.idempotencyKey !== dispatch.idempotencyKey)) return { ok: false, status: 404, error: 'Envio não encontrado.' };
  // Idempotência pelo eventId. O evento só fica PROCESSED depois de aplicado; uma reentrega de evento ainda não
  // processado é reaplicada com segurança (applyDispatchResult só altera envios que ainda não terminaram).
  let duplicate = false;
  try {
    await systemDb.webhookEvent.create({
      data: { provider: 'n8n', eventKey: parsed.eventId, organizationId: dispatch.organizationId, payload: { dispatchId: dispatch.id, status: parsed.status }, status: 'RECEIVED' },
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    duplicate = true;
  }
  const markProcessed = () =>
    systemDb.webhookEvent.updateMany({ where: { provider: 'n8n', eventKey: parsed.eventId }, data: { status: 'PROCESSED', processedAt: new Date(), attempts: { increment: 1 } } });
  if (parsed.status === 'progress') {
    if (!duplicate) {
      await logActivity({ orgId: dispatch.organizationId, taskId: dispatch.taskId, type: 'n8n.progress', message: `n8n: ${(parsed.message ?? 'em andamento').slice(0, 300)}`, data: { dispatchId: dispatch.id } });
    }
    await markProcessed();
    return { ok: true, duplicate, applied: false };
  }
  const applied = await applyDispatchResult(dispatch.id, { status: parsed.status, result: parsed.result, error: parsed.error });
  await markProcessed();
  return { ok: true, duplicate, applied };
}
