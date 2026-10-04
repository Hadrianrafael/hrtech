import { graphRequest, graphUrl } from './meta';

/**
 * WhatsApp Business Platform — Cloud API oficial da Meta.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

export interface WaInboundMessage {
  phoneNumberId: string;
  from: string;
  profileName: string | null;
  id: string;
  timestamp: Date;
  type: string;
  text: string;
  media: { id: string; mimeType?: string; filename?: string; caption?: string } | null;
}

export interface WaStatusUpdate {
  phoneNumberId: string;
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | string;
  recipient: string;
  error: string | null;
}

interface WaWebhook {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: Record<string, unknown>[];
        statuses?: { id: string; status: string; recipient_id: string; errors?: { title?: string; message?: string }[] }[];
      };
    }[];
  }[];
}

function describe(msg: Record<string, unknown>): { text: string; media: WaInboundMessage['media'] } {
  const type = String(msg.type ?? 'unknown');
  const m = msg[type] as Record<string, unknown> | undefined;
  switch (type) {
    case 'text':
      return { text: String((m as { body?: string })?.body ?? ''), media: null };
    case 'image':
    case 'audio':
    case 'video':
    case 'document':
    case 'sticker': {
      const caption = typeof m?.caption === 'string' ? m.caption : undefined;
      const labels: Record<string, string> = { image: 'Imagem', audio: 'Áudio', video: 'Vídeo', document: 'Documento', sticker: 'Figurinha' };
      return {
        text: caption ?? `[${labels[type]}${m?.filename ? `: ${m.filename}` : ''}]`,
        media: { id: String(m?.id ?? ''), mimeType: m?.mime_type as string | undefined, filename: m?.filename as string | undefined, caption },
      };
    }
    case 'button':
      return { text: String((m as { text?: string })?.text ?? ''), media: null };
    case 'interactive': {
      const reply = (m?.button_reply ?? m?.list_reply) as { title?: string } | undefined;
      return { text: reply?.title ?? '[Resposta interativa]', media: null };
    }
    case 'location': {
      const loc = m as { latitude?: number; longitude?: number; name?: string };
      return { text: `[Localização${loc?.name ? `: ${loc.name}` : ''}] ${loc?.latitude ?? ''},${loc?.longitude ?? ''}`, media: null };
    }
    default:
      return { text: `[Mensagem do tipo ${type} não suportada]`, media: null };
  }
}

export function parseWhatsAppWebhook(payload: unknown): { messages: WaInboundMessage[]; statuses: WaStatusUpdate[] } {
  const body = payload as WaWebhook;
  const messages: WaInboundMessage[] = [];
  const statuses: WaStatusUpdate[] = [];
  if (body?.object !== 'whatsapp_business_account') return { messages, statuses };
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value;
      const phoneNumberId = v?.metadata?.phone_number_id;
      if (!v || !phoneNumberId) continue;
      for (const msg of v.messages ?? []) {
        const from = String(msg.from ?? '');
        const profile = v.contacts?.find((c) => c.wa_id === from)?.profile?.name ?? null;
        const { text, media } = describe(msg);
        messages.push({
          phoneNumberId,
          from,
          profileName: profile,
          id: String(msg.id),
          timestamp: new Date(Number(msg.timestamp ?? Date.now() / 1000) * 1000),
          type: String(msg.type),
          text,
          media,
        });
      }
      for (const s of v.statuses ?? []) {
        statuses.push({
          phoneNumberId,
          id: s.id,
          status: s.status,
          recipient: s.recipient_id,
          error: s.errors?.[0] ? `${s.errors[0].title ?? ''} ${s.errors[0].message ?? ''}`.trim() : null,
        });
      }
    }
  }
  return { messages, statuses };
}

export interface WaSecrets {
  accessToken: string;
}

export async function sendWhatsAppText(secrets: WaSecrets, phoneNumberId: string, to: string, body: string) {
  const res = await graphRequest<{ messages?: { id: string }[] }>(graphUrl(`${phoneNumberId}/messages`), secrets.accessToken, {
    method: 'POST',
    body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } },
  });
  return res.messages?.[0]?.id ?? null;
}

export async function sendWhatsAppTemplate(
  secrets: WaSecrets,
  phoneNumberId: string,
  to: string,
  template: { name: string; language: string; params?: string[] },
) {
  const res = await graphRequest<{ messages?: { id: string }[] }>(graphUrl(`${phoneNumberId}/messages`), secrets.accessToken, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.params?.length ? { components: [{ type: 'body', parameters: template.params.map((text) => ({ type: 'text', text })) }] } : {}),
      },
    },
  });
  return res.messages?.[0]?.id ?? null;
}

/** Teste de conexão: consulta o número configurado. */
export async function checkWhatsAppNumber(secrets: WaSecrets, phoneNumberId: string) {
  return graphRequest<{ display_phone_number?: string; verified_name?: string }>(
    graphUrl(`${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`),
    secrets.accessToken,
  );
}

/** Baixa mídia recebida (URL temporária da Meta exige o token). */
export async function downloadWhatsAppMedia(secrets: WaSecrets, mediaId: string) {
  const meta = await graphRequest<{ url: string; mime_type: string }>(graphUrl(mediaId), secrets.accessToken);
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${secrets.accessToken}` }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error('Falha ao baixar mídia do WhatsApp.');
  return { mimeType: meta.mime_type, data: Buffer.from(await res.arrayBuffer()) };
}

/** Janela de atendimento de 24h: fora dela, apenas templates aprovados podem ser enviados. */
export function isWithinServiceWindow(lastInboundAt: Date | null | undefined, now = new Date()): boolean {
  return !!lastInboundAt && now.getTime() - lastInboundAt.getTime() < 24 * 60 * 60 * 1000;
}
