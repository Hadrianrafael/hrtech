/**
 * Comandos vindos do n8n (ex.: o dono manda "Quero 5 clientes este mês" pelo WhatsApp e o n8n repassa).
 * Exige assinatura HMAC válida, eventId único (idempotência) e que a empresa tenha a Equipe IA e o n8n ativados.
 */
import { z } from 'zod';
import { systemCtx } from '@/lib/auth/ctx';
import { isUniqueViolation, systemDb } from '@/lib/db';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { PENDING_CREDENTIAL, verifySignature } from './n8n';
import { createObjective } from './objectives';

export const commandSchema = z.object({
  eventId: z.string().trim().min(8).max(200),
  organizationId: z.string().trim().min(10).max(60),
  command: z.string().trim().min(3).max(2000),
  requestedByEmail: z.string().trim().email().max(200).optional(),
});

export async function handleN8nCommand(rawBody: string, signature: string | null): Promise<{ status: number; body: Record<string, unknown> }> {
  const secret = env.n8nWebhookSecret();
  if (!secret) return { status: 503, body: { error: PENDING_CREDENTIAL } };
  if (!verifySignature(secret, signature, rawBody)) return { status: 401, body: { error: 'Assinatura inválida.' } };
  let d: z.infer<typeof commandSchema>;
  try {
    d = commandSchema.parse(JSON.parse(rawBody));
  } catch {
    return { status: 400, body: { error: 'Payload inválido.' } };
  }
  const company = await systemDb.aiCompany.findUnique({ where: { organizationId: d.organizationId }, include: { organization: { select: { status: true } } } });
  if (!company?.enabled || !company.n8nEnabled || company.organization.status !== 'ACTIVE') {
    return { status: 403, body: { error: 'Equipe IA ou integração com o n8n desativada para esta empresa.' } };
  }
  try {
    await systemDb.webhookEvent.create({ data: { provider: 'n8n-command', eventKey: d.eventId, organizationId: d.organizationId, payload: { command: d.command.slice(0, 200) }, status: 'RECEIVED' } });
  } catch (err) {
    if (isUniqueViolation(err)) return { status: 200, body: { duplicate: true } };
    throw err;
  }
  // Quem pediu: só é registrado se for membro ativo com permissão de comandar a Equipe IA.
  let createdById: string | null = null;
  if (d.requestedByEmail) {
    const m = await systemDb.membership.findFirst({
      where: { organizationId: d.organizationId, status: 'ACTIVE', user: { email: d.requestedByEmail.toLowerCase(), disabled: false } },
      include: { role: true },
    });
    if (m?.role.permissions.includes('ai_team.command')) createdById = m.userId;
  }
  try {
    const objective = await createObjective(systemCtx(d.organizationId), { command: d.command }, { source: 'N8N', createdById });
    await systemDb.webhookEvent.updateMany({ where: { provider: 'n8n-command', eventKey: d.eventId }, data: { status: 'PROCESSED', processedAt: new Date() } });
    return { status: 202, body: { objectiveId: objective.id } };
  } catch (err) {
    await systemDb.webhookEvent.updateMany({ where: { provider: 'n8n-command', eventKey: d.eventId }, data: { status: 'FAILED', error: err instanceof Error ? err.message.slice(0, 500) : 'erro' } });
    if (err instanceof AppError) return { status: err.status, body: { error: err.message } };
    throw err;
  }
}
