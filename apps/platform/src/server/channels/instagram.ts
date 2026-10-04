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
  const res = await graphRequest<{ message_id?: string }>(`${base(cfg)}/${cfg.igUserId}/messages`, secrets.accessToken, {
    method: 'POST',
    body: { recipient: { id: recipientId }, message: { text } },
  });
  return res.message_id ?? null;
}

export async function checkInstagramAccount(secrets: IgSecrets, cfg: IgConfig) {
  return graphRequest<{ id: string; username?: string }>(`${base(cfg)}/me?fields=id,username`, secrets.accessToken);
}

export async function fetchInstagramProfile(secrets: IgSecrets, cfg: IgConfig, igsid: string) {
  try {
    return await graphRequest<{ name?: string; username?: string }>(`${base(cfg)}/${igsid}?fields=name,username`, secrets.accessToken);
  } catch {
    return null;
  }
}
