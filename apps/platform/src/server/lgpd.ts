import { audit } from '@/lib/audit';
import type { Prisma } from '@prisma/client';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { assertContactAccessible } from './contacts';
import { systemDb } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { systemCtx } from '@/lib/auth/ctx';

/**
 * Recursos técnicos de apoio à LGPD (portabilidade, eliminação, retenção, consentimento).
 * Não substituem a avaliação jurídica do controlador dos dados.
 */

export async function exportContactData(ctx: ServiceCtx, contactId: string) {
  assertCan(ctx, 'contacts.export');
  const contact = await ctx.db.contact.findFirst({
    where: { AND: [{ id: contactId }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput] },
    include: {
      identities: true,
      tags: { include: { tag: { select: { name: true } } } },
      notesList: true,
      opportunities: { include: { stage: { select: { name: true } } } },
      tasks: true,
      appointments: true,
      timelineEvents: true,
      conversations: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
    },
  });
  if (!contact) throw new NotFoundError('Contato não encontrado.');
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'lgpd.contact_exported', entityType: 'Contact', entityId: contactId, severity: 'warning' });
  return {
    exportedAt: new Date().toISOString(),
    notice: 'Exportação de dados pessoais do titular (LGPD art. 18, V).',
    contact,
  };
}

/** Anonimiza o contato: remove dados pessoais e conteúdo de conversas, preservando métricas agregadas. */
export async function anonymizeContact(ctx: ServiceCtx, contactId: string) {
  assertCan(ctx, 'contacts.delete');
  const contact = await ctx.db.contact.findFirst({ where: { id: contactId } });
  if (!contact) throw new NotFoundError('Contato não encontrado.');
  await ctx.db.conversation.deleteMany({ where: { contactId } });
  await ctx.db.note.deleteMany({ where: { contactId } });
  await ctx.db.timelineEvent.deleteMany({ where: { contactId } });
  await ctx.db.contactIdentity.deleteMany({ where: { contactId } });
  await ctx.db.contactTag.deleteMany({ where: { contactId } });
  await ctx.db.opportunity.updateMany({ where: { contactId }, data: { title: 'Oportunidade (contato anonimizado)' } });
  await ctx.db.task.updateMany({ where: { contactId }, data: { contactId: null } });
  await ctx.db.appointment.updateMany({ where: { contactId }, data: { contactId: null } });
  await ctx.db.contact.update({
    where: { id: contactId },
    data: {
      name: 'Contato anonimizado',
      email: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      companyName: null,
      city: null,
      state: null,
      notes: null,
      interest: null,
      sourceDetail: null,
      nextActionNote: null,
      customFields: {},
      anonymizedAt: new Date(),
    },
  });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'lgpd.contact_anonymized', entityType: 'Contact', entityId: contactId, severity: 'warning' });
}

/** Exclusão definitiva (cascata em conversas, mensagens, notas e oportunidades). */
export async function deleteContactPermanently(ctx: ServiceCtx, contactId: string) {
  assertCan(ctx, 'contacts.delete');
  const contact = await ctx.db.contact.findFirst({ where: { id: contactId } });
  if (!contact) throw new NotFoundError('Contato não encontrado.');
  await ctx.db.contact.delete({ where: { id: contactId } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'lgpd.contact_deleted', entityType: 'Contact', entityId: contactId, severity: 'warning' });
}

export async function recordConsent(ctx: ServiceCtx, contactId: string, source: string, marketingOptIn: boolean) {
  assertCan(ctx, 'contacts.write');
  await assertContactAccessible(ctx, contactId);
  await ctx.db.contact.update({ where: { id: contactId }, data: { consentAt: new Date(), consentSource: source, marketingOptIn } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'lgpd.consent_recorded', entityType: 'Contact', entityId: contactId, metadata: { source, marketingOptIn } });
}

/** Aplica a política de retenção: remove mensagens mais antigas que `retentionDays`. */
export async function applyRetentionPolicies() {
  const orgs = await systemDb.organization.findMany({ where: { retentionDays: { not: null } }, select: { id: true, retentionDays: true } });
  let removed = 0;
  for (const org of orgs) {
    if (!org.retentionDays || org.retentionDays < 30) continue;
    const ctx = systemCtx(org.id);
    const cutoff = new Date(Date.now() - org.retentionDays * 86400000);
    const r = await ctx.db.message.deleteMany({ where: { createdAt: { lt: cutoff } } });
    removed += r.count;
    if (r.count) await audit({ organizationId: org.id, action: 'lgpd.retention_applied', actorType: 'SYSTEM', metadata: { removed: r.count, retentionDays: org.retentionDays } });
  }
  return removed;
}
