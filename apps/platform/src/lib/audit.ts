import type { Prisma } from '@prisma/client';
import { systemDb } from './db';
import { logger } from './logger';

export interface AuditInput {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorType?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  severity?: 'info' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Registra ação de auditoria. Nunca lança exceção (auditoria não deve derrubar o fluxo),
 * mas registra falhas no log estruturado.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await systemDb.auditLog.create({
      data: {
        organizationId: input.organizationId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? (input.actorUserId ? 'USER' : 'SYSTEM'),
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        severity: input.severity ?? 'info',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    logger.error('audit.write_failed', { action: input.action, err });
  }
  if (input.severity === 'error') logger.error(input.action, { orgId: input.organizationId, ...input.metadata });
}
