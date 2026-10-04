import type { ServiceCtx } from '@/lib/auth/ctx';

/** Membros ativos da organização (para seletores de responsável). */
export async function getMembers(ctx: ServiceCtx) {
  const rows = await ctx.db.membership.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { id: true, name: true, email: true } }, role: { select: { name: true, key: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role.name }));
}

export type Member = Awaited<ReturnType<typeof getMembers>>[number];
