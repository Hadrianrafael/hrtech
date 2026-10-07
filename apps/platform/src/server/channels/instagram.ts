import { graphRequest } from './meta';
import { env } from '@/lib/env';

/**
 * Instagram Messaging (API oficial da Meta para contas profissionais elegíveis).
 * Usa "Instagram API with Instagram Login" (graph.instagram.com) por padrão;
 * para contas conectadas via Página do Facebook, configure apiBase = https://graph.facebook.com.
 */

export interface IgInboundMessage {
  accountId: string;
  senderId: string;
  mid: string;
  text: string;
  timestamp: Date;
  attachments: { type: string; url?: string }[];
}

interface IgWebhook {
  object?: string;
  entry?: {
    id?: string;
    time?: number;
    messaging?: {
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: { mid?: string; text?: string; is_echo?: boolean; is_deleted?: boolean; attachments?: { type: string; payload?: { url?: string } }[] };
    }[];
  }[];
}

export function parseInstagramWebhook(payload: unknown): IgInboundMessage[] {
  const body = payload as IgWebhook;
  if (body?.object !== 'instagram') return [];
  const out: IgInboundMessage[] = [];
  for (const entry of body.entry ?? []) {
    for (const ev of entry.messaging ?? []) {
      const msg = ev.message;
      if (!msg?.mid || msg.is_echo || msg.is_deleted) continue;
      const attachments = (msg.attachments ?? []).map((a) => ({ type: a.type, url: a.payload?.url }));
      out.push({
        accountId: String(ev.recipient?.id ?? entry.id ?? ''),
        senderId: String(ev.sender?.id ?? ''),
        mid: msg.mid,
        text: msg.text ?? (attachments.length ? `[${attachments.map((a) => a.type).join(', ')}]` : ''),
        timestamp: new Date(ev.timestamp ?? Date.now()),
        attachments,
      });
    }
  }
  return out;
}

export interface IgSecrets {
  accessToken: string;
}

export interface IgConfig {
  igUserId: string;
  username?: string;
  apiBase?: string;
}

function base(cfg: IgConfig) {
  return `${(cfg.apiBase ?? 'https://graph.instagram.com').replace(/\/$/, '')}/${env.metaGraphVersion()}`;
}

export async function sendInstagramText(secrets: IgSecrets, cfg: IgConfig, recipientId: string, text: string) {
  // /me resolve para a conta profissional (token do Instagram) ou para a Página (token de Página do Facebook).
  const res = await graphRequest<{ message_id?: string }>(`${base(cfg)}/me/messages`, secrets.accessToken, {
    method: 'POST',
    body: { recipient: { id: recipientId }, message: { text } },
  });
  return res.message_id ?? null;
}

/**
 * Descobre a conta profissional à qual o token dá acesso (prova de posse).
 * - Login do Instagram (graph.instagram.com): o campo `user_id` é o ID que aparece nos webhooks (o `id` de /me é outro).
 * - Login do Facebook (graph.facebook.com, token de Página): a conta é `instagram_business_account` da Página.
 */
export async function checkInstagramAccount(secrets: IgSecrets, cfg: IgConfig): Promise<{ accountId: string; username?: string }> {
  if ((cfg.apiBase ?? 'https://graph.instagram.com').includes('graph.facebook.com')) {
    const r = await graphRequest<{ instagram_business_account?: { id: string; username?: string } }>(
      `${base(cfg)}/me?fields=instagram_business_account{id,username}`,
      secrets.accessToken,
    );
    if (!r.instagram_business_account?.id) throw new Error('A Página deste token não tem conta profissional do Instagram vinculada.');
    return { accountId: r.instagram_business_account.id, username: r.instagram_business_account.username };
  }
  const r = await graphRequest<{ user_id?: string | number; username?: string }>(`${base(cfg)}/me?fields=user_id,username`, secrets.accessToken);
  if (!r.user_id) throw new Error('Não foi possível identificar a conta profissional deste token.');
  return { accountId: String(r.user_id), username: r.username };
}

export async function fetchInstagramProfile(secrets: IgSecrets, cfg: IgConfig, igsid: string) {
  try {
    return await graphRequest<{ name?: string; username?: string }>(`${base(cfg)}/${igsid}?fields=name,username`, secrets.accessToken);
  } catch {
    return null;
  }
}
