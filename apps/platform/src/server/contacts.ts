import type { Channel, LeadStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { isUniqueViolation } from '@/lib/db';
import { assertCan, ownerScope, type ServiceCtx } from '@/lib/auth/ctx';
import { NotFoundError } from '@/lib/errors';
import { normalizeEmail, normalizePhone, parseMoney } from '@/lib/utils';
import { optionalEmail, optionalId, optionalMoney, optionalString, optionalDate, stringArray } from '@/lib/validation';
import { assertWithinLimit, checkLimit } from './billing/limits';
import { emitEvent } from './events';
import { addTimeline } from './timeline';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  IN_CONVERSATION: 'Em conversa',
  QUALIFIED: 'Qualificado',
  CUSTOMER: 'Cliente',
  UNQUALIFIED: 'Desqualificado',
  LOST: 'Perdido',
};

export const SOURCE_LABELS: Record<string, string> = {
  manual: 'Cadastro manual',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'E-mail',
  webchat: 'Chat do site',
  form: 'Formulário do site',
  import: 'Importação',
  api: 'API',
  indicacao: 'Indicação',
  prospeccao: 'Prospecção ativa',
};

/** Campos extensíveis de hotelaria/serviços guardados em `customFields`. */
export const CUSTOM_FIELD_LABELS: Record<string, string> = {
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Hóspedes',
  roomType: 'Tipo de acomodação',
  bookingInterest: 'Interesse em reserva',
  budget: 'Orçamento',
  desiredDate: 'Data desejada',
  service: 'Serviço',
};

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.').max(160),
  email: optionalEmail,
  phone: optionalString(40),
  whatsapp: optionalString(40),
  instagram: optionalString(80),
  companyName: optionalString(160),
  city: optionalString(100),
  state: optionalString(40),
  source: z.string().max(40).optional().default('manual'),
  sourceDetail: optionalString(200),
  ownerId: optionalId,
  status: z.enum(['NEW', 'CONTACTED', 'IN_CONVERSATION', 'QUALIFIED', 'CUSTOMER', 'UNQUALIFIED', 'LOST']).optional(),
  kind: z.enum(['LEAD', 'CUSTOMER']).optional(),
  potentialValue: optionalMoney,
  notes: optionalString(5000),
  interest: optionalString(500),
  nextActionAt: optionalDate,
  nextActionNote: optionalString(300),
  tagIds: stringArray,
  consent: z.union([z.literal('on'), z.boolean()]).optional(),
  customFields: z.record(z.string(), z.string().max(200)).optional(),
});

export type ContactInput = z.input<typeof contactInputSchema>;
export type ContactData = z.output<typeof contactInputSchema>;

export interface ContactFilters {
  q?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  tagId?: string;
  kind?: string;
  page?: number;
  pageSize?: number;
}

export function contactWhere(ctx: ServiceCtx, f: ContactFilters): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [{ anonymizedAt: null }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput];
  if (f.q) {
    const q = f.q.trim();
    const digits = q.replace(/\D/g, '');
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { instagram: { contains: q, mode: 'insensitive' } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }] : []),
      ],
    });
  }
  if (f.status) and.push({ status: f.status as LeadStatus });
  if (f.source) and.push({ source: f.source });
  if (f.ownerId) and.push(f.ownerId === 'none' ? { ownerId: null } : { ownerId: f.ownerId });
  if (f.tagId) and.push({ tags: { some: { tagId: f.tagId } } });
  if (f.kind === 'LEAD' || f.kind === 'CUSTOMER') and.push({ kind: f.kind });
  return { AND: and };
}

export async function listContacts(ctx: ServiceCtx, f: ContactFilters = {}) {
  assertCan(ctx, 'contacts.read');
  const pageSize = Math.min(f.pageSize ?? 25, 100);
  const page = Math.max(1, f.page ?? 1);
  const where = contactWhere(ctx, f);
  const [items, total] = await Promise.all([
    ctx.db.contact.findMany({
      where,
      orderBy: [{ lastInteractionAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { tags: { include: { tag: true } } },
    }),
    ctx.db.contact.count({ where }),
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getContact(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'contacts.read');
  const contact = await ctx.db.contact.findFirst({
    where: { AND: [{ id, anonymizedAt: null }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput] },
    include: {
      tags: { include: { tag: true } },
      opportunities: { include: { stage: true, pipeline: true }, orderBy: { createdAt: 'desc' } },
      conversations: { orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } } },
      notesList: { orderBy: { createdAt: 'desc' }, take: 50 },
      tasks: { where: { status: { in: ['TODO', 'IN_PROGRESS'] } }, orderBy: { dueAt: 'asc' } },
      appointments: { where: { startsAt: { gte: new Date(Date.now() - 86400000) } }, orderBy: { startsAt: 'asc' } },
    },
  });
  if (!contact) throw new NotFoundError('Contato não encontrado.');
  return contact;
}

async function defaultPipelineFirstStage(ctx: ServiceCtx) {
  const pipeline = await ctx.db.pipeline.findFirst({ where: { isDefault: true }, include: { stages: { orderBy: { position: 'asc' }, take: 1 } } });
  const fallback = pipeline ?? (await ctx.db.pipeline.findFirst({ include: { stages: { orderBy: { position: 'asc' }, take: 1 } } }));
  const stage = fallback?.stages[0];
  return fallback && stage ? { pipeline: fallback, stage } : null;
}

export async function createContact(
  ctx: ServiceCtx,
  input: ContactInput,
  opts: {
    createOpportunity?: boolean;
    eventKey?: string;
    /** Lead recebido por canal (WhatsApp, Instagram, e-mail, site): nunca é descartado por limite do plano. */
    inbound?: boolean;
    /** Quando false, quem chamou dispara o evento lead.created depois (ex.: após vencer uma corrida). */
    emitLeadEvent?: boolean;
    /**
     * Identidade de canal gravada no MESMO insert do contato: se outra requisição já registrou essa identidade, o
     * insert inteiro falha (P2002) antes de qualquer efeito colateral — nenhum contato "perdedor" chega a existir.
     */
    identity?: { channel: Channel; externalId: string };
  } = {},
) {
  assertCan(ctx, 'contacts.write');
  const data = contactInputSchema.parse(input);
  if (opts.inbound) {
    const limit = await checkLimit(ctx, 'contacts');
    if (!limit.allowed) {
      await audit({ organizationId: ctx.orgId, action: 'billing.contact_limit_exceeded', actorType: 'SYSTEM', severity: 'warning', metadata: { used: limit.used, limit: limit.limit, source: data.source } });
    }
  } else {
    await assertWithinLimit(ctx, 'contacts');
  }
  const ownerId = data.ownerId ?? (ctx.actorType === 'USER' ? ctx.userId : null);
  if (ownerId) await assertMember(ctx, ownerId);
  const contact = await ctx.db.contact.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      email: normalizeEmail(data.email),
      phone: normalizePhone(data.phone),
      whatsapp: normalizePhone(data.whatsapp ?? data.phone),
      instagram: data.instagram?.replace(/^@/, '') ?? null,
      companyName: data.companyName,
      city: data.city,
      state: data.state,
      source: data.source ?? 'manual',
      sourceDetail: data.sourceDetail,
      ownerId,
      status: data.status ?? 'NEW',
      kind: data.kind ?? 'LEAD',
      potentialValue: data.potentialValue,
      notes: data.notes,
      interest: data.interest,
      nextActionAt: data.nextActionAt,
      nextActionNote: data.nextActionNote,
      customFields: (data.customFields ?? {}) as Prisma.InputJsonValue,
      consentAt: data.consent ? new Date() : null,
      consentSource: data.consent ? data.source ?? 'manual' : null,
      lastInteractionAt: new Date(),
      ...(opts.identity ? { identities: { create: { organizationId: ctx.orgId, channel: opts.identity.channel, externalId: opts.identity.externalId } } } : {}),
    },
  });
  if (data.tagIds.length) await setContactTags(ctx, contact.id, data.tagIds, { silent: true });

  await addTimeline(ctx, { contactId: contact.id, type: 'lead_created', title: `Lead criado (${SOURCE_LABELS[contact.source] ?? contact.source})` });

  let opportunityId: string | null = null;
  if (opts.createOpportunity !== false) {
    const target = await defaultPipelineFirstStage(ctx);
    if (target) {
      const opp = await ctx.db.opportunity.create({
        data: {
          organizationId: ctx.orgId,
          pipelineId: target.pipeline.id,
          stageId: target.stage.id,
          contactId: contact.id,
          title: data.interest ? `${contact.name} — ${data.interest}` : contact.name,
          value: data.potentialValue,
          ownerId: ownerId ?? target.stage.defaultOwnerId,
          position: Date.now(),
        },
      });
      opportunityId = opp.id;
    }
  }
  if (opts.emitLeadEvent !== false) {
    await emitEvent(ctx, 'lead.created', { contactId: contact.id, opportunityId, source: contact.source }, { eventKey: opts.eventKey ?? `lead:${contact.id}` });
  }
  return contact;
}

export async function emitLeadCreated(ctx: ServiceCtx, contactId: string, eventKey: string) {
  const contact = await ctx.db.contact.findFirst({ where: { id: contactId }, select: { source: true } });
  const opp = await ctx.db.opportunity.findFirst({ where: { contactId }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  await emitEvent(ctx, 'lead.created', { contactId, opportunityId: opp?.id ?? null, source: contact?.source }, { eventKey });
}

/** Garante que o contato existe na empresa e está no escopo de visibilidade do usuário. */
export async function assertContactAccessible(ctx: ServiceCtx, contactId: string) {
  const c = await ctx.db.contact.findFirst({
    where: { AND: [{ id: contactId, anonymizedAt: null }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput] },
  });
  if (!c) throw new NotFoundError('Contato não encontrado.');
  return c;
}

export async function assertMember(ctx: ServiceCtx, userId: string) {
  const m = await ctx.db.membership.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (!m) throw new NotFoundError('Responsável não pertence a esta empresa.');
}

const TRACKED_FIELDS: { key: keyof ContactData; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'status', label: 'Status' },
  { key: 'kind', label: 'Tipo' },
  { key: 'ownerId', label: 'Responsável' },
  { key: 'potentialValue', label: 'Valor potencial' },
  { key: 'city', label: 'Cidade' },
  { key: 'interest', label: 'Interesse' },
];

export async function updateContact(ctx: ServiceCtx, id: string, input: Partial<ContactInput>) {
  assertCan(ctx, 'contacts.write');
  const current = await getContact(ctx, id);
  const data = contactInputSchema.partial().parse(input);
  if (data.ownerId) await assertMember(ctx, data.ownerId);

  const update: Prisma.ContactUpdateInput = {};
  const assign = <K extends keyof Prisma.ContactUpdateInput>(k: K, v: Prisma.ContactUpdateInput[K] | undefined) => {
    if (v !== undefined) update[k] = v;
  };
  assign('name', data.name);
  assign('email', data.email === undefined ? undefined : normalizeEmail(data.email));
  assign('phone', data.phone === undefined ? undefined : normalizePhone(data.phone));
  assign('whatsapp', data.whatsapp === undefined ? undefined : normalizePhone(data.whatsapp));
  assign('instagram', data.instagram === undefined ? undefined : (data.instagram?.replace(/^@/, '') ?? null));
  assign('companyName', data.companyName);
  assign('city', data.city);
  assign('state', data.state);
  if ('ownerId' in input) assign('ownerId', data.ownerId ?? null);
  assign('status', data.status);
  assign('kind', data.kind);
  if ('potentialValue' in input) assign('potentialValue', data.potentialValue);
  assign('notes', data.notes);
  assign('interest', data.interest);
  if ('nextActionAt' in input) assign('nextActionAt', data.nextActionAt);
  assign('nextActionNote', data.nextActionNote);
  if ('source' in input) assign('source', data.source);
  if (data.customFields) {
    assign('customFields', { ...(current.customFields as Record<string, unknown>), ...data.customFields } as Prisma.InputJsonValue);
  }
  if (data.consent && !current.consentAt) {
    update.consentAt = new Date();
    update.consentSource = 'manual';
  }

  const updated = await ctx.db.contact.update({ where: { id }, data: update });
  if (input.tagIds !== undefined) await setContactTags(ctx, id, data.tagIds ?? []);

  const changes: string[] = [];
  for (const f of TRACKED_FIELDS) {
    const before = current[f.key as keyof typeof current];
    const after = updated[f.key as keyof typeof updated];
    if (String(before ?? '') !== String(after ?? '')) changes.push(f.label);
  }
  if (changes.length) {
    await addTimeline(ctx, {
      contactId: id,
      type: current.ownerId !== updated.ownerId ? 'assigned' : 'field_changed',
      title: `Dados atualizados: ${changes.join(', ')}`,
      data: { changes, ownerId: updated.ownerId },
    });
  }
  return updated;
}

export async function setContactTags(ctx: ServiceCtx, contactId: string, tagIds: string[], opts: { silent?: boolean } = {}) {
  const valid = await ctx.db.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true, name: true } });
  await ctx.db.contactTag.deleteMany({ where: { contactId, tagId: { notIn: valid.map((t) => t.id) } } });
  for (const t of valid) {
    await ctx.db.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId: t.id } },
      create: { organizationId: ctx.orgId, contactId, tagId: t.id },
      update: {},
    });
  }
  if (!opts.silent) await addTimeline(ctx, { contactId, type: 'tags_changed', title: `Etiquetas: ${valid.map((t) => t.name).join(', ') || 'nenhuma'}` });
}

export async function addTagByName(ctx: ServiceCtx, contactId: string, name: string) {
  const tag = await ctx.db.tag.upsert({
    where: { organizationId_name: { organizationId: ctx.orgId, name } },
    create: { organizationId: ctx.orgId, name },
    update: {},
  });
  const exists = await ctx.db.contactTag.findFirst({ where: { contactId, tagId: tag.id } });
  if (exists) return tag;
  await ctx.db.contactTag.create({ data: { organizationId: ctx.orgId, contactId, tagId: tag.id } });
  await addTimeline(ctx, { contactId, type: 'tag_added', title: `Etiqueta aplicada: ${name}` });
  return tag;
}

export async function addNote(ctx: ServiceCtx, contactId: string, body: string) {
  assertCan(ctx, 'contacts.write');
  await getContact(ctx, contactId);
  const note = await ctx.db.note.create({ data: { organizationId: ctx.orgId, contactId, authorId: ctx.userId, body } });
  await addTimeline(ctx, { contactId, type: 'note', title: 'Observação registrada', data: { body } });
  await ctx.db.contact.update({ where: { id: contactId }, data: { lastInteractionAt: new Date() } });
  return note;
}

/** Registro manual de interação (ligação, reunião, visita...). */
export async function logInteraction(ctx: ServiceCtx, contactId: string, kind: string, body: string) {
  assertCan(ctx, 'contacts.write');
  await getContact(ctx, contactId);
  await addTimeline(ctx, { contactId, type: 'interaction', title: `Interação registrada: ${kind}`, data: { kind, body } });
  await ctx.db.contact.update({ where: { id: contactId }, data: { lastInteractionAt: new Date(), status: undefined } });
}

/**
 * Localiza (ou cria) o contato associado a uma identidade de canal.
 * Usado no recebimento de mensagens (WhatsApp, Instagram, e-mail, site).
 */
export async function findOrCreateContactByIdentity(
  ctx: ServiceCtx,
  channel: Channel,
  externalId: string,
  defaults: { name?: string | null; email?: string | null; phone?: string | null; instagram?: string | null; source: string },
) {
  const identity = await ctx.db.contactIdentity.findFirst({ where: { channel, externalId }, include: { contact: true } });
  if (identity && !identity.contact.anonymizedAt) return { contact: identity.contact, created: false };

  // Tenta casar com contato existente pelo telefone/e-mail antes de criar.
  const phone = normalizePhone(defaults.phone);
  const rawEmail = normalizeEmail(defaults.email);
  // Endereços fora do padrão (comuns em e-mails recebidos) não podem impedir o registro do lead.
  const email = rawEmail && z.string().email().max(254).safeParse(rawEmail).success ? rawEmail : null;
  // Também casa com cadastros antigos gravados sem o 9º dígito (55 + DDD + 8 dígitos).
  const legacy = phone?.replace(/^55(\d{2})9([6-9]\d{7})$/, '55$1$2');
  const phones = phone ? [...new Set([phone, legacy!])] : [];
  const existing = await ctx.db.contact.findFirst({
    where: {
      anonymizedAt: null,
      OR: [...phones.flatMap((p) => [{ whatsapp: p }, { phone: p }]), ...(email ? [{ email }] : [])],
    },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) {
    await ctx.db.contactIdentity.upsert({
      where: { organizationId_channel_externalId: { organizationId: ctx.orgId, channel, externalId } },
      create: { organizationId: ctx.orgId, contactId: existing.id, channel, externalId },
      update: { contactId: existing.id },
    });
    return { contact: existing, created: false };
  }

  // Contato e identidade nascem juntos; se duas mensagens do mesmo remetente novo chegarem ao mesmo tempo, só uma
  // cria o contato e a outra usa o vencedor (sem criar e apagar contatos que outra requisição já poderia estar usando).
  let contact;
  try {
    contact = await createContact(
      { ...ctx, permissions: new Set([...ctx.permissions, 'contacts.write']) },
      {
        name: (defaults.name?.trim() || phone || email || 'Visitante').slice(0, 160),
        email,
        // Valores normalizados já têm DDI: o "+" evita que createContact os trate de novo como número nacional.
        phone: phone ? `+${phone}` : null,
        whatsapp: channel === 'WHATSAPP' && phone ? `+${phone}` : null,
        instagram: defaults.instagram?.slice(0, 80) ?? null,
        source: defaults.source,
        consent: false,
      },
      { inbound: true, emitLeadEvent: false, identity: { channel, externalId } },
    );
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const winner = await ctx.db.contactIdentity.findFirst({ where: { channel, externalId }, include: { contact: true } });
    if (!winner) throw err;
    return { contact: winner.contact, created: false };
  }
  await emitLeadCreated(ctx, contact.id, `lead:${channel}:${externalId}`);
  return { contact, created: true };
}

/**
 * Aplica dados extraídos pela IA (qualificação automática). Só preenche campos vazios
 * para nunca sobrescrever informação confirmada por um humano.
 */
export async function applyExtractedFields(ctx: ServiceCtx, contactId: string, extracted: Record<string, unknown>) {
  const contact = await ctx.db.contact.findFirst({ where: { id: contactId } });
  if (!contact) return [];
  const update: Prisma.ContactUpdateInput = {};
  const filled: string[] = [];
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null);

  const name = str(extracted.name);
  if (name && (contact.name === 'Visitante' || /^\d+$/.test(contact.name) || contact.name.includes('@'))) {
    update.name = name;
    filled.push('nome');
  }
  const email = normalizeEmail(str(extracted.email));
  if (email && !contact.email) {
    update.email = email;
    filled.push('e-mail');
  }
  const phone = normalizePhone(str(extracted.phone));
  if (phone && !contact.phone) {
    update.phone = phone;
    if (!contact.whatsapp) update.whatsapp = phone;
    filled.push('telefone');
  }
  const interest = str(extracted.interest);
  if (interest && !contact.interest) {
    update.interest = interest;
    filled.push('interesse');
  }
  const budget = parseMoney(typeof extracted.budget === 'number' ? extracted.budget : str(extracted.budget));
  if (budget !== null && budget > 0 && !contact.potentialValue) {
    update.potentialValue = budget;
    filled.push('orçamento');
  }
  const custom = { ...(contact.customFields as Record<string, unknown>) };
  for (const key of ['checkIn', 'checkOut', 'guests', 'roomType', 'desiredDate', 'service', 'bookingInterest']) {
    const v = str(extracted[key]) ?? (typeof extracted[key] === 'number' ? String(extracted[key]) : null);
    if (v && !custom[key]) {
      custom[key] = v;
      filled.push(CUSTOM_FIELD_LABELS[key] ?? key);
    }
  }
  if (Object.keys(custom).length !== Object.keys(contact.customFields as object).length) update.customFields = custom as Prisma.InputJsonValue;
  if (!filled.length) return [];
  await ctx.db.contact.update({ where: { id: contactId }, data: update });
  await addTimeline(ctx, { contactId, type: 'ai_action', actorType: 'AI', actorId: null, title: `IA qualificou o lead: ${filled.join(', ')}`, data: { extracted } });
  return filled;
}

/**
 * Opções de contato para seletores (tarefas, agenda): os 500 primeiros visíveis ao usuário + os já vinculados aos
 * registros exibidos, para que editar um item nunca desvincule o contato por ele não estar na lista.
 */
export async function contactOptions(ctx: ServiceCtx, includeIds: (string | null | undefined)[] = []) {
  const scope = { AND: [{ anonymizedAt: null }, ownerScope(ctx, 'ownerId') as Prisma.ContactWhereInput] };
  const ids = [...new Set(includeIds.filter((v): v is string => !!v))];
  const [top, linked] = await Promise.all([
    ctx.db.contact.findMany({ where: scope, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 500 }),
    ids.length ? ctx.db.contact.findMany({ where: { AND: [scope, { id: { in: ids } }] }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const map = new Map([...top, ...linked].map((c) => [c.id, c]));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function listTags(ctx: ServiceCtx) {
  return ctx.db.tag.findMany({ orderBy: { name: 'asc' } });
}

export async function createTag(ctx: ServiceCtx, name: string, color: string) {
  assertCan(ctx, 'contacts.write');
  const tag = await ctx.db.tag.create({ data: { organizationId: ctx.orgId, name: name.trim().slice(0, 40), color } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'tag.created', entityType: 'Tag', entityId: tag.id });
  return tag;
}

export async function deleteTag(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'settings.manage');
  await ctx.db.tag.delete({ where: { id } });
}
