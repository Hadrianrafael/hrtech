import type { Prisma } from '@prisma/client';
import type { ServiceCtx } from '@/lib/auth/ctx';

export async function addTimeline(
  ctx: ServiceCtx,
  input: { contactId: string; type: string; title: string; data?: Record<string, unknown>; actorType?: string; actorId?: string | null },
) {
  return ctx.db.timelineEvent.create({
    data: {
      organizationId: ctx.orgId,
      contactId: input.contactId,
      type: input.type,
      title: input.title,
      data: (input.data ?? {}) as Prisma.InputJsonValue,
      actorType: input.actorType ?? ctx.actorType,
      actorId: input.actorId === undefined ? ctx.userId : input.actorId,
    },
  });
}

export type TimelineItem =
  | { kind: 'event'; id: string; at: Date; type: string; title: string; actorType: string; actorId: string | null; data: unknown }
  | {
      kind: 'message';
      id: string;
      at: Date;
      channel: string;
      direction: string;
      senderType: string;
      senderUserId: string | null;
      body: string;
      conversationId: string;
    };

/** Timeline unificada: eventos de CRM + mensagens de todos os canais, em ordem cronológica. */
export async function getContactTimeline(ctx: ServiceCtx, contactId: string, limit = 200): Promise<TimelineItem[]> {
  const [events, messages] = await Promise.all([
    ctx.db.timelineEvent.findMany({ where: { contactId }, orderBy: { createdAt: 'desc' }, take: limit }),
    ctx.db.message.findMany({
      where: { conversation: { contactId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { conversation: { select: { channel: true } } },
    }),
  ]);
  const items: TimelineItem[] = [
    ...events.map((e) => ({ kind: 'event' as const, id: e.id, at: e.createdAt, type: e.type, title: e.title, actorType: e.actorType, actorId: e.actorId, data: e.data })),
    ...messages.map((m) => ({
      kind: 'message' as const,
      id: m.id,
      at: m.createdAt,
      channel: m.conversation.channel,
      direction: m.direction,
      senderType: m.senderType,
      senderUserId: m.senderUserId,
      body: m.body,
      conversationId: m.conversationId,
    })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
