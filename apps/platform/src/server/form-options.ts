import type { ServiceCtx } from '@/lib/auth/ctx';
import { HOSPITALITY_SEGMENTS } from './defaults';
import { LEAD_STATUS_LABELS, listTags, SOURCE_LABELS } from './contacts';
import { getMembers } from './team';

export async function getContactFormOptions(ctx: ServiceCtx & { org?: { segment: string | null } }) {
  const [members, tags, org] = await Promise.all([getMembers(ctx), listTags(ctx), ctx.db.organization.findFirst({ select: { segment: true } })]);
  return {
    members: members.map((m) => ({ id: m.id, name: m.name })),
    tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    statuses: LEAD_STATUS_LABELS,
    sources: SOURCE_LABELS,
    hospitality: !!org?.segment && HOSPITALITY_SEGMENTS.includes(org.segment),
  };
}
