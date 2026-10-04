import { AppShell } from '@/components/layout/app-shell';
import { NAV } from '@/components/layout/nav';
import { requirePageContext } from '@/lib/auth/context';
import { ownerScope } from '@/lib/auth/ctx';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePageContext();
  const nav = NAV.filter((n) => !n.permission || ctx.permissions.has(n.permission));
  const waiting = ctx.permissions.has('inbox.use')
    ? await ctx.db.conversation.count({ where: { AND: [{ status: { in: ['OPEN', 'PENDING'] }, awaitingReply: true }, ownerScope(ctx, 'assigneeId') as Prisma.ConversationWhereInput] } })
    : 0;
  return (
    <AppShell
      nav={nav}
      user={ctx.user}
      org={{ id: ctx.org.id, name: ctx.org.name }}
      roleName={ctx.role?.name ?? null}
      memberships={ctx.memberships}
      isSupportMode={ctx.isSupportMode}
      badges={{ '/inbox': waiting }}
    >
      {children}
    </AppShell>
  );
}
