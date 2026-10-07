import type { Prisma } from '@prisma/client';
import { systemDb } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface ActivityInput {
  orgId: string;
  type: string;
  message: string;
  agentId?: string | null;
  objectiveId?: string | null;
  taskId?: string | null;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

/** Registra atividade da Equipe IA (nunca derruba o fluxo principal). */
export async function logActivity(input: ActivityInput) {
  try {
    await systemDb.aiActivity.create({
      data: {
        organizationId: input.orgId,
        type: input.type,
        message: input.message.slice(0, 1000),
        agentId: input.agentId ?? null,
        objectiveId: input.objectiveId ?? null,
        taskId: input.taskId ?? null,
        level: input.level ?? 'info',
        data: (input.data ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logger.error('ai_company.activity_failed', { type: input.type, err });
  }
}
