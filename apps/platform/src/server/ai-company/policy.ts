import type { AiAutonomy } from '@prisma/client';
import { DEFAULT_LIMITS, type Limits, type SensitiveCategory } from './constants';

export type Risk = 'read' | 'low' | 'medium' | 'high' | 'critical';

const RISK_ORDER: Record<Risk, number> = { read: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function maxRisk(a: Risk, b: Risk): Risk {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

export interface ApprovalDecision {
  required: boolean;
  reason: string;
}

/**
 * Política de aprovação:
 *  - leitura: nunca pede aprovação;
 *  - categoria sensível ou risco crítico: SEMPRE pede aprovação (qualquer autonomia);
 *  - risco alto (efeito externo: mensagens a clientes, publicações, chamadas externas pagas): pede aprovação,
 *    exceto em modo autônomo com "ações externas autônomas" liberadas pela empresa;
 *  - MANUAL: qualquer ação com efeito pede aprovação; SUPERVISED: baixo automático; AUTONOMOUS: baixo e médio automáticos.
 */
export function decideApproval(input: {
  autonomy: AiAutonomy;
  risk: Risk;
  categories: SensitiveCategory[];
  allowAutonomousExternal?: boolean;
}): ApprovalDecision {
  const { autonomy, risk, categories } = input;
  if (risk === 'read') return { required: false, reason: 'Somente leitura.' };
  if (categories.length) return { required: true, reason: 'Envolve tema sensível que sempre exige aprovação humana.' };
  if (risk === 'critical') return { required: true, reason: 'Ação crítica: sempre exige aprovação humana.' };
  if (autonomy === 'MANUAL') return { required: true, reason: 'Agente em modo manual: toda ação com efeito exige aprovação.' };
  if (risk === 'high') {
    return autonomy === 'AUTONOMOUS' && input.allowAutonomousExternal
      ? { required: false, reason: 'Ação externa liberada para agentes autônomos.' }
      : { required: true, reason: 'Ação com efeito externo (clientes, publicações ou serviços pagos) exige aprovação.' };
  }
  if (risk === 'medium' && autonomy === 'SUPERVISED') return { required: true, reason: 'Alteração em dados de clientes exige aprovação no modo supervisionado.' };
  return { required: false, reason: 'Ação interna de baixo risco permitida pela autonomia do agente.' };
}

function numberIn(raw: unknown, min: number, max: number): number | undefined {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), min), max) : undefined;
}

/** Limites efetivos: padrão ← empresa ← agente (cada valor com teto de segurança). */
export function resolveLimits(companyLimits: unknown, agentLimits?: unknown): Limits & { agentDailyBudgetCents?: number } {
  const merged: Record<string, unknown> = {
    ...(companyLimits && typeof companyLimits === 'object' ? companyLimits : {}),
    ...(agentLimits && typeof agentLimits === 'object' ? agentLimits : {}),
  };
  const out: Limits & { agentDailyBudgetCents?: number } = {
    maxStepsPerRun: numberIn(merged.maxStepsPerRun, 1, 20) ?? DEFAULT_LIMITS.maxStepsPerRun,
    maxTokensPerTask: numberIn(merged.maxTokensPerTask, 2_000, 1_000_000) ?? DEFAULT_LIMITS.maxTokensPerTask,
    maxDelegationDepth: numberIn(merged.maxDelegationDepth, 1, 3) ?? DEFAULT_LIMITS.maxDelegationDepth,
    maxTasksPerObjective: numberIn(merged.maxTasksPerObjective, 1, 60) ?? DEFAULT_LIMITS.maxTasksPerObjective,
    maxSubtasksPerTask: numberIn(merged.maxSubtasksPerTask, 1, 15) ?? DEFAULT_LIMITS.maxSubtasksPerTask,
    maxAttempts: numberIn(merged.maxAttempts, 1, 6) ?? DEFAULT_LIMITS.maxAttempts,
    maxTasksPerAgentPerDay: numberIn(merged.maxTasksPerAgentPerDay, 1, 1000) ?? DEFAULT_LIMITS.maxTasksPerAgentPerDay,
    approvalTtlHours: numberIn(merged.approvalTtlHours, 1, 24 * 14) ?? DEFAULT_LIMITS.approvalTtlHours,
  };
  const agentBudget = agentLimits && typeof agentLimits === 'object' ? numberIn((agentLimits as Record<string, unknown>).dailyBudgetCents, 0, 1_000_000) : undefined;
  if (agentBudget !== undefined) out.agentDailyBudgetCents = agentBudget;
  return out;
}

/** Atraso das novas tentativas (tarefas e envios ao n8n): 1 min, 5 min, 15 min, 1 h, 3 h, 6 h... */
export function backoffMs(attempt: number): number {
  const steps = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 3 * 60 * 60_000, 6 * 60 * 60_000];
  return steps[Math.min(Math.max(attempt - 1, 0), steps.length - 1)]!;
}
