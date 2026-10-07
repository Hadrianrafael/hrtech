import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { assertCan, type ServiceCtx } from '@/lib/auth/ctx';
import { decryptJson, encrypt, encryptJson } from '@/lib/crypto';
import { isUniqueViolation, systemDb } from '@/lib/db';
import { env } from '@/lib/env';
import { AppError, NotFoundError } from '@/lib/errors';
import { assertWithinLimit } from './billing/limits';
import { fetchNewEmails, verifyImap, verifySmtp, type EmailAccountConfig } from './channels/email';
import { checkInstagramAccount, type IgConfig, type IgSecrets } from './channels/instagram';
import { checkWhatsAppNumber, type WaSecrets } from './channels/whatsapp';
import { receiveInbound } from './conversations';
import { logger } from '@/lib/logger';

export async function listIntegrations(ctx: ServiceCtx) {
  assertCan(ctx, 'integrations.manage');
  const items = await ctx.db.integration.findMany({ orderBy: { createdAt: 'asc' }, include: { emailAccount: { select: { address: true, lastSyncAt: true, syncError: true, imapHost: true } } } });
  // Nunca devolve segredos para a interface.
  return items.map(({ secretsEnc, ...rest }) => ({ ...rest, hasSecrets: !!secretsEnc }));
}

/** Diagnóstico das variáveis globais necessárias aos webhooks da Meta. */
export function platformIntegrationStatus() {
  return {
    appUrl: env.appUrl(),
    metaAppSecret: !!env.metaAppSecret(),
    whatsappVerifyToken: !!env.whatsappVerifyToken(),
    instagramVerifyToken: !!env.instagramVerifyToken(),
    ai: env.aiProvider() !== 'none' && !!env.openaiKey(),
    smtp: !!env.smtp(),
    billing: env.billingProvider(),
  };
}

/**
 * Reserva o identificador externo (phone_number_id / conta do Instagram) para esta integração — somente depois que
 * o token comprovou acesso a ele. Webhooks só são roteados para integrações verificadas (CONNECTED + externalId),
 * então ninguém consegue "reivindicar" o número de outra empresa apenas digitando o ID.
 */
async function claimVerifiedExternalId(integrationId: string, type: string, externalId: string) {
  const other = await systemDb.integration.findFirst({ where: { type, externalId, NOT: { id: integrationId } } });
  if (other?.status === 'CONNECTED') throw new AppError('Este número/conta já está conectado e verificado em outra empresa da plataforma.');
  if (other) await systemDb.integration.update({ where: { id: other.id }, data: { externalId: null, status: 'PENDING' } });
  try {
    await systemDb.integration.update({ where: { id: integrationId }, data: { externalId, status: 'CONNECTED', lastError: null } });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError('Este número/conta acabou de ser conectado em outra empresa.');
    throw err;
  }
}

export const whatsappSchema = z.object({
  name: z.string().trim().min(1).max(80).default('WhatsApp'),
  phoneNumberId: z.string().trim().regex(/^\d{5,30}$/, 'Phone Number ID inválido (apenas números).'),
  wabaId: z.string().trim().regex(/^\d{5,30}$/, 'WABA ID inválido.').optional().or(z.literal('')),
  accessToken: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function saveWhatsApp(ctx: ServiceCtx, id: string | null, input: z.input<typeof whatsappSchema>) {
  assertCan(ctx, 'integrations.manage');
  const data = whatsappSchema.parse(input);
  const existing = id ? await ctx.db.integration.findFirst({ where: { id, type: 'WHATSAPP' } }) : null;
  if (id && !existing) throw new NotFoundError('Integração não encontrada.');
  if (!existing) await assertWithinLimit(ctx, 'channels');
  if (!existing && !data.accessToken) throw new AppError('Informe o token de acesso (System User Token).');
  const values = {
    name: data.name,
    externalId: null, // definido somente após a verificação (testIntegration)
    config: { phoneNumberId: data.phoneNumberId, wabaId: data.wabaId || null } as Prisma.InputJsonValue,
    ...(data.accessToken ? { secretsEnc: encryptJson({ accessToken: data.accessToken } satisfies WaSecrets) } : {}),
    status: 'PENDING' as const,
    lastError: null,
  };
  const integration = existing
    ? await ctx.db.integration.update({ where: { id: existing.id }, data: values })
    : await ctx.db.integration.create({ data: { ...values, organizationId: ctx.orgId, type: 'WHATSAPP' } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.saved', entityType: 'Integration', entityId: integration.id, metadata: { type: 'WHATSAPP' } });
  return integration;
}

export const instagramSchema = z.object({
  name: z.string().trim().min(1).max(80).default('Instagram'),
  igUserId: z.string().trim().regex(/^\d{5,30}$/, 'ID da conta inválido (apenas números).'),
  username: z.string().trim().max(80).optional().or(z.literal('')),
  apiBase: z.enum(['https://graph.instagram.com', 'https://graph.facebook.com']).default('https://graph.instagram.com'),
  accessToken: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function saveInstagram(ctx: ServiceCtx, id: string | null, input: z.input<typeof instagramSchema>) {
  assertCan(ctx, 'integrations.manage');
  const data = instagramSchema.parse(input);
  const existing = id ? await ctx.db.integration.findFirst({ where: { id, type: 'INSTAGRAM' } }) : null;
  if (id && !existing) throw new NotFoundError('Integração não encontrada.');
  if (!existing) await assertWithinLimit(ctx, 'channels');
  if (!existing && !data.accessToken) throw new AppError('Informe o token de acesso.');
  const values = {
    name: data.name,
    externalId: null, // definido somente após a verificação (testIntegration)
    config: { igUserId: data.igUserId, username: data.username || null, apiBase: data.apiBase } as Prisma.InputJsonValue,
    ...(data.accessToken ? { secretsEnc: encryptJson({ accessToken: data.accessToken } satisfies IgSecrets) } : {}),
    status: 'PENDING' as const,
    lastError: null,
  };
  const integration = existing
    ? await ctx.db.integration.update({ where: { id: existing.id }, data: values })
    : await ctx.db.integration.create({ data: { ...values, organizationId: ctx.orgId, type: 'INSTAGRAM' } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.saved', entityType: 'Integration', entityId: integration.id, metadata: { type: 'INSTAGRAM' } });
  return integration;
}

export const emailSchema = z.object({
  name: z.string().trim().min(1).max(80).default('E-mail'),
  address: z.string().trim().toLowerCase().email('E-mail inválido.'),
  displayName: z.string().trim().max(80).optional().or(z.literal('')),
  smtpHost: z.string().trim().min(3, 'Servidor SMTP obrigatório.'),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.union([z.literal('on'), z.boolean()]).optional(),
  imapHost: z.string().trim().optional().or(z.literal('')),
  imapPort: z.coerce.number().int().min(1).max(65535).default(993),
  username: z.string().trim().min(1, 'Usuário obrigatório.'),
  password: z.string().max(500).optional().or(z.literal('')),
});

export async function saveEmail(ctx: ServiceCtx, id: string | null, input: z.input<typeof emailSchema>) {
  assertCan(ctx, 'integrations.manage');
  const data = emailSchema.parse(input);
  const existing = id ? await ctx.db.integration.findFirst({ where: { id, type: 'EMAIL' }, include: { emailAccount: true } }) : null;
  if (id && !existing) throw new NotFoundError('Integração não encontrada.');
  if (!existing) await assertWithinLimit(ctx, 'channels');
  if (!existing?.emailAccount && !data.password) throw new AppError('Informe a senha (ou senha de app) da conta.');
  const integration = existing
    ? await ctx.db.integration.update({ where: { id: existing.id }, data: { name: data.name, externalId: null, status: 'PENDING', lastError: null } })
    : await ctx.db.integration.create({ data: { organizationId: ctx.orgId, type: 'EMAIL', name: data.name, status: 'PENDING' } });
  const account = {
    address: data.address,
    displayName: data.displayName || null,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    smtpSecure: !!data.smtpSecure,
    imapHost: data.imapHost || null,
    imapPort: data.imapPort,
    username: data.username,
  };
  if (existing?.emailAccount) {
    await ctx.db.emailAccount.update({ where: { id: existing.emailAccount.id }, data: { ...account, ...(data.password ? { passwordEnc: encryptJson(data.password) } : {}) } });
  } else {
    await ctx.db.emailAccount.create({ data: { ...account, organizationId: ctx.orgId, integrationId: integration.id, passwordEnc: encryptJson(data.password!) } });
  }
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.saved', entityType: 'Integration', entityId: integration.id, metadata: { type: 'EMAIL' } });
  return integration;
}

function emailConfig(account: { passwordEnc: string } & Omit<EmailAccountConfig, 'password'>): EmailAccountConfig {
  return { ...account, password: decryptJson<string>(account.passwordEnc) ?? '' };
}

/** Testa a conexão com o provedor externo e atualiza o status (CONNECTED / ERROR). */
export async function testIntegration(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'integrations.manage');
  const integration = await ctx.db.integration.findFirst({ where: { id }, include: { emailAccount: true } });
  if (!integration) throw new NotFoundError('Integração não encontrada.');
  let detail = '';
  try {
    switch (integration.type) {
      case 'WHATSAPP': {
        const secrets = decryptJson<WaSecrets>(integration.secretsEnc);
        if (!secrets) throw new AppError('Credenciais ausentes.');
        const cfg = integration.config as { phoneNumberId?: string; wabaId?: string | null };
        if (!cfg.phoneNumberId) throw new AppError('Phone Number ID ausente.');
        // O token precisa ter acesso ao número (e ao WABA informado): isso comprova a posse.
        const r = await checkWhatsAppNumber(secrets, cfg.phoneNumberId, cfg.wabaId ?? null);
        detail = `${r.verified_name ?? ''} ${r.display_phone_number ?? ''}`.trim();
        await claimVerifiedExternalId(integration.id, 'WHATSAPP', cfg.phoneNumberId);
        break;
      }
      case 'INSTAGRAM': {
        const secrets = decryptJson<IgSecrets>(integration.secretsEnc);
        if (!secrets) throw new AppError('Credenciais ausentes.');
        const cfg = integration.config as unknown as IgConfig;
        const r = await checkInstagramAccount(secrets, cfg);
        if (r.accountId !== cfg.igUserId) {
          throw new AppError(`O token pertence à conta ${r.username ? `@${r.username}` : r.accountId}, diferente do ID informado (${cfg.igUserId}).`);
        }
        detail = r.username ? `@${r.username}` : r.accountId;
        await claimVerifiedExternalId(integration.id, 'INSTAGRAM', cfg.igUserId);
        break;
      }
      case 'EMAIL': {
        if (!integration.emailAccount) throw new AppError('Conta não configurada.');
        const cfg = emailConfig(integration.emailAccount);
        await verifySmtp(cfg);
        await verifyImap(cfg);
        detail = cfg.address;
        break;
      }
      case 'WEBCHAT':
        detail = 'Widget ativo';
        break;
    }
    if (integration.type === 'EMAIL' || integration.type === 'WEBCHAT') {
      await ctx.db.integration.update({ where: { id }, data: { status: 'CONNECTED', lastError: null } });
    }
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.connected', entityType: 'Integration', entityId: id, metadata: { type: integration.type } });
    return { ok: true, detail };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha desconhecida';
    await ctx.db.integration.update({ where: { id }, data: { status: 'ERROR', lastError: message.slice(0, 500), lastErrorAt: new Date() } });
    await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.test_failed', entityType: 'Integration', entityId: id, severity: 'error', metadata: { type: integration.type, error: message } });
    return { ok: false, detail: message };
  }
}

export async function setIntegrationEnabled(ctx: ServiceCtx, id: string, enabled: boolean) {
  assertCan(ctx, 'integrations.manage');
  const i = await ctx.db.integration.findFirst({ where: { id } });
  if (!i) throw new NotFoundError('Integração não encontrada.');
  if (enabled) await assertWithinLimit(ctx, 'channels');
  // Reativar exige novo teste de conexão (que revalida a posse do número/conta).
  await ctx.db.integration.update({ where: { id }, data: { status: enabled ? 'PENDING' : 'DISABLED' } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: enabled ? 'integration.enabled' : 'integration.disabled', entityType: 'Integration', entityId: id, severity: 'warning' });
}

export async function deleteIntegration(ctx: ServiceCtx, id: string) {
  assertCan(ctx, 'integrations.manage');
  const i = await ctx.db.integration.findFirst({ where: { id } });
  if (!i) throw new NotFoundError('Integração não encontrada.');
  if (i.type === 'WEBCHAT') throw new AppError('O chat do site não pode ser removido; desative o chatbot se necessário.');
  await ctx.db.integration.delete({ where: { id } });
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'integration.deleted', entityType: 'Integration', entityId: id, severity: 'warning', metadata: { type: i.type } });
}

/** Sincroniza caixas de e-mail via IMAP (chamado pelo cron ou manualmente). */
export async function syncEmailAccount(ctx: ServiceCtx, integrationId: string) {
  const integration = await ctx.db.integration.findFirst({ where: { id: integrationId, type: 'EMAIL' }, include: { emailAccount: true } });
  const account = integration?.emailAccount;
  if (!integration || !account || integration.status !== 'CONNECTED' || !account.imapHost) return { imported: 0 };
  try {
    const emails = await fetchNewEmails(emailConfig(account), account.lastUid);
    let imported = 0;
    let failed = 0;
    let maxUid = account.lastUid;
    for (const e of emails) {
      maxUid = Math.max(maxUid, e.uid);
      if (!e.fromAddress || e.fromAddress === account.address) continue;
      // Uma mensagem problemática não pode travar a caixa inteira: registra a falha e segue para a próxima.
      try {
        const r = await receiveInbound(ctx, {
          channel: 'EMAIL',
          integrationId: integration.id,
          identityExternalId: e.fromAddress,
          contactDefaults: { name: e.fromName, email: e.fromAddress },
          externalThreadId: e.threadKey,
          subject: e.subject,
          body: e.text || '(mensagem sem texto)',
          contentType: 'email',
          externalId: e.messageId ?? `imap:${account.id}:${e.uid}`,
          receivedAt: e.date,
          metadata: { subject: e.subject },
        });
        if (!r.duplicate) imported++;
      } catch (err) {
        failed++;
        logger.error('email.message_import_failed', { orgId: ctx.orgId, uid: e.uid, err });
        await audit({ organizationId: ctx.orgId, action: 'integration.email_message_failed', entityType: 'Integration', entityId: integration.id, severity: 'error', metadata: { uid: e.uid, error: err instanceof Error ? err.message : String(err) } });
      }
    }
    await ctx.db.emailAccount.update({
      where: { id: account.id },
      data: { lastUid: maxUid, lastSyncAt: new Date(), syncError: failed ? `${failed} mensagem(ns) não importada(s) — ver logs.` : null },
    });
    await ctx.db.integration.update({ where: { id: integration.id }, data: { lastEventAt: imported ? new Date() : undefined } });
    return { imported };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha na sincronização';
    logger.error('email.sync_failed', { orgId: ctx.orgId, err });
    await ctx.db.emailAccount.update({ where: { id: account.id }, data: { syncError: message.slice(0, 500), lastSyncAt: new Date() } });
    await audit({ organizationId: ctx.orgId, action: 'integration.email_sync_failed', entityType: 'Integration', entityId: integration.id, severity: 'error', metadata: { error: message } });
    return { imported: 0, error: message };
  }
}

export function encryptSecretValue(v: string) {
  return encrypt(v);
}
