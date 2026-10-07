import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { AppError, NotFoundError } from '@/lib/errors';
import { logActivity } from './activity';
import { payloadHash } from './invoke';
import { syncObjective } from './objectives';

export const decisionSchema = z.object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(1000).optional() });

/**
 * Decisão humana sobre uma ação sensível. Atômica (duas pessoas não decidem a mesma aprovação) e com checagem de
 * integridade: o que foi apresentado (hash do payload) é exatamente o que será executado.
 */
export async function decideApproval(ctx: ServiceCtx, id: string, input: z.input<typeof decisionSchema>) {
  assertCan(ctx, 'ai_team.approve');
  const { decision, note } = decisionSchema.parse(input);
  const approval = await ctx.db.aiApproval.findFirst({ where: { id } });
  if (!approval) throw new NotFoundError('Aprovação não encontrada.');
  if (approval.status !== 'PENDING') throw new AppError('Esta aprovação já foi decidida.');
  const now = new Date();
  if (approval.expiresAt < now) throw new AppError('O prazo desta aprovação expirou.');
  const call = await ctx.db.aiToolCall.findFirst({ where: { id: approval.toolCallId } });
  if (!call || payloadHash(call.tool, call.input) !== approval.payloadHash) {
    throw new AppError('A ação foi alterada depois do pedido de aprovação e não pode ser executada.');
  }
  const approve = decision === 'approve';
  const updated = await ctx.db.aiApproval.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: approve ? 'APPROVED' : 'REJECTED', decidedById: ctx.userId, decidedAt: now, decisionNote: note ?? null },
  });
  if (updated.count !== 1) throw new AppError('Esta aprovação já foi decidida.');
  await ctx.db.aiToolCall.updateMany({
    where: { id: call.id, status: 'PENDING_APPROVAL' },
    data: approve ? { status: 'APPROVED' } : { status: 'REJECTED', error: note ? `Rejeitada: ${note}` : 'Rejeitada pela equipe.' },
  });
  const task = await ctx.db.aiTask.findFirst({ where: { id: approval.taskId } });
  await ctx.db.aiTask.updateMany({ where: { id: approval.taskId, status: 'WAITING_APPROVAL' }, data: { status: 'QUEUED', waitingFor: null, nextRunAt: now } });
  await logActivity({
    orgId: ctx.orgId,
    agentId: approval.agentId,
    objectiveId: task?.objectiveId,
    taskId: approval.taskId,
    type: approve ? 'approval.approved' : 'approval.rejected',
    level: approve ? 'info' : 'warning',
    message: `${approve ? 'Aprovado' : 'Rejeitado'}: ${approval.summary}${note ? ` — "${note}"` : ''}`,
  });
  await audit({
    organizationId: ctx.orgId,
    actorUserId: ctx.userId,
    action: approve ? 'ai_team.approval_approved' : 'ai_team.approval_rejected',
    entityType: 'AiApproval',
    entityId: id,
    severity: approval.risk === 'critical' || approval.categories.length ? 'warning' : 'info',
    metadata: { tool: approval.tool, risk: approval.risk, categories: approval.categories },
  });
  if (task?.objectiveId) await syncObjective(ctx.orgId, task.objectiveId);
  return { approved: approve, taskId: approval.taskId };
}

export async function listApprovals(ctx: ServiceCtx, opts: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'; take?: number } = {}) {
  assertCan(ctx, 'ai_team.view');
  const rows = await ctx.db.aiApproval.findMany({ where: opts.status ? { status: opts.status } : {}, orderBy: { createdAt: 'desc' }, take: opts.take ?? 50 });
  const [agents, tasks] = await Promise.all([
    ctx.db.aiAgent.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.agentId))] } }, select: { id: true, name: true } }),
    ctx.db.aiTask.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.taskId))] } }, select: { id: true, title: true, objectiveId: true } }),
  ]);
  return rows.map((r) => ({ ...r, agentName: agents.find((a) => a.id === r.agentId)?.name ?? '—', task: tasks.find((t) => t.id === r.taskId) ?? null }));
}
