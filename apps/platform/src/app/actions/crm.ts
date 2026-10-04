'use server';

import { z } from 'zod';
import { formToObject, type ActionResult } from '@/lib/action';
import { withOrg, withOrgSchema } from '@/lib/action-ctx';
import { recommendNextAction } from '@/server/ai/agent';
import {
  addNote, assertContactAccessible, contactInputSchema, createContact, createTag, deleteTag, logInteraction, setContactTags, updateContact,
} from '@/server/contacts';
import { anonymizeContact, deleteContactPermanently, recordConsent } from '@/server/lgpd';
import {
  createOpportunity, createPipeline, createStage, deleteStage, moveOpportunity, reorderStages, updateOpportunity, updateStage,
} from '@/server/pipeline';

/** Extrai campos personalizados (prefixo cf_) do formulário. */
function withCustomFields(form: FormData) {
  const obj = formToObject(form);
  const customFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('cf_') && typeof v === 'string') {
      customFields[k.slice(3)] = v;
      delete obj[k];
    }
  }
  return { ...obj, customFields };
}

export async function createContactAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  return withOrgSchema('contacts.write', contactInputSchema, withCustomFields(form), async (ctx) => {
    const c = await createContact(ctx, withCustomFields(form) as never);
    return { id: c.id };
  }, 'Lead cadastrado.');
}

export async function updateContactAction(id: string, form: FormData): Promise<ActionResult> {
  return withOrgSchema('contacts.write', contactInputSchema.partial(), withCustomFields(form), async (ctx) => {
    const raw = withCustomFields(form) as Record<string, unknown>;
    if (!form.has('tagIds') && form.has('__tags')) raw.tagIds = [];
    await updateContact(ctx, id, raw as never);
  }, 'Dados salvos.');
}

/** Atualização parcial (ex.: painel lateral da conversa). */
export async function patchContactAction(id: string, patch: Record<string, unknown>): Promise<ActionResult> {
  return withOrg('contacts.write', async (ctx) => {
    await updateContact(ctx, id, patch as never);
  }, 'Contato atualizado.');
}

export async function addNoteAction(contactId: string, form: FormData): Promise<ActionResult> {
  return withOrgSchema('contacts.write', z.object({ body: z.string().trim().min(1, 'Escreva a observação.').max(5000) }), form, async (ctx, d) => {
    await addNote(ctx, contactId, d.body);
  }, 'Observação registrada.');
}

export async function logInteractionAction(contactId: string, form: FormData): Promise<ActionResult> {
  return withOrgSchema(
    'contacts.write',
    z.object({ kind: z.string().min(1).max(40), body: z.string().trim().min(1, 'Descreva a interação.').max(5000) }),
    form,
    async (ctx, d) => logInteraction(ctx, contactId, d.kind, d.body),
    'Interação registrada.',
  );
}

export async function setTagsAction(contactId: string, tagIds: string[]): Promise<ActionResult> {
  return withOrg('contacts.write', async (ctx) => {
    await assertContactAccessible(ctx, contactId);
    await setContactTags(ctx, contactId, tagIds);
  }, 'Etiquetas atualizadas.');
}

export async function createTagAction(form: FormData): Promise<ActionResult> {
  return withOrgSchema(
    'contacts.write',
    z.object({ name: z.string().trim().min(1, 'Nome obrigatório.').max(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#64748b') }),
    form,
    async (ctx, d) => {
      await createTag(ctx, d.name, d.color);
    },
    'Etiqueta criada.',
  );
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  return withOrg('settings.manage', (ctx) => deleteTag(ctx, id), 'Etiqueta removida.');
}

export async function moveOpportunityAction(opportunityId: string, stageId: string, lostReason?: string): Promise<ActionResult> {
  return withOrg('opportunities.write', async (ctx) => {
    await moveOpportunity(ctx, opportunityId, stageId, { lostReason });
  });
}

export async function createOpportunityAction(form: FormData): Promise<ActionResult> {
  return withOrg('opportunities.write', async (ctx) => {
    await createOpportunity(ctx, formToObject(form) as never);
  }, 'Oportunidade criada.');
}

export async function updateOpportunityAction(id: string, form: FormData): Promise<ActionResult> {
  return withOrg('opportunities.write', async (ctx) => {
    await updateOpportunity(ctx, id, formToObject(form) as never);
  }, 'Oportunidade atualizada.');
}

export async function saveStageAction(pipelineId: string, stageId: string | null, form: FormData): Promise<ActionResult> {
  return withOrg('pipeline.manage', async (ctx) => {
    const data = formToObject(form) as never;
    if (stageId) await updateStage(ctx, stageId, data);
    else await createStage(ctx, pipelineId, data);
  }, 'Etapa salva.');
}

export async function reorderStagesAction(pipelineId: string, ids: string[]): Promise<ActionResult> {
  return withOrg('pipeline.manage', (ctx) => reorderStages(ctx, pipelineId, ids), 'Ordem atualizada.');
}

export async function deleteStageAction(stageId: string, moveTo: string): Promise<ActionResult> {
  return withOrg('pipeline.manage', (ctx) => deleteStage(ctx, stageId, moveTo), 'Etapa removida.');
}

export async function createPipelineAction(name: string): Promise<ActionResult<{ id: string }>> {
  return withOrg('pipeline.manage', async (ctx) => ({ id: (await createPipeline(ctx, name)).id }), 'Funil criado.');
}

export async function anonymizeContactAction(id: string): Promise<ActionResult> {
  return withOrg('contacts.delete', (ctx) => anonymizeContact(ctx, id), 'Contato anonimizado.');
}

export async function deleteContactAction(id: string): Promise<ActionResult> {
  return withOrg('contacts.delete', (ctx) => deleteContactPermanently(ctx, id), 'Contato excluído definitivamente.');
}

export async function recordConsentAction(id: string, marketingOptIn: boolean): Promise<ActionResult> {
  return withOrg('contacts.write', (ctx) => recordConsent(ctx, id, 'manual', marketingOptIn), 'Consentimento registrado.');
}

export async function recommendNextActionAction(contactId: string) {
  return withOrg('ai.use', (ctx) => recommendNextAction(ctx, contactId));
}
