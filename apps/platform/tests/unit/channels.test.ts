import { describe, expect, it } from 'vitest';
import { hmacSha256Hex } from '@/lib/crypto';
import { stripQuotedReply, threadKeyFromHeaders } from '@/server/channels/email';
import { parseInstagramWebhook } from '@/server/channels/instagram';
import { verifyMetaSignature } from '@/server/channels/meta';
import { isWithinServiceWindow, parseWhatsAppWebhook } from '@/server/channels/whatsapp';
import { originAllowed } from '@/server/webchat';

export const waPayload = (overrides: { id?: string; phoneNumberId?: string; from?: string; text?: string } = {}) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '5511999999999', phone_number_id: overrides.phoneNumberId ?? '1234567890' },
            contacts: [{ wa_id: overrides.from ?? '5511988887777', profile: { name: 'Cliente Teste' } }],
            messages: [{ from: overrides.from ?? '5511988887777', id: overrides.id ?? 'wamid.TEST1', timestamp: '1760000000', type: 'text', text: { body: overrides.text ?? 'Olá, tem quarto?' } }],
          },
        },
      ],
    },
  ],
});

describe('WhatsApp Cloud API', () => {
  it('interpreta mensagens de texto e mídia', () => {
    const { messages } = parseWhatsAppWebhook(waPayload());
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ phoneNumberId: '1234567890', from: '5511988887777', profileName: 'Cliente Teste', text: 'Olá, tem quarto?', id: 'wamid.TEST1' });
    const img = waPayload();
    img.entry[0]!.changes[0]!.value.messages = [{ from: '1', id: 'm2', timestamp: '1', type: 'image', image: { id: 'MEDIA1', mime_type: 'image/jpeg', caption: 'foto' } } as never];
    expect(parseWhatsAppWebhook(img).messages[0]).toMatchObject({ text: 'foto', media: { id: 'MEDIA1', mimeType: 'image/jpeg' } });
  });

  it('interpreta status de entrega', () => {
    const p = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { metadata: { phone_number_id: '1' }, statuses: [{ id: 'wamid.X', status: 'read', recipient_id: '55' }] } }] }] };
    expect(parseWhatsAppWebhook(p).statuses[0]).toMatchObject({ id: 'wamid.X', status: 'read' });
  });

  it('ignora objetos que não são do WhatsApp', () => {
    expect(parseWhatsAppWebhook({ object: 'page' }).messages).toHaveLength(0);
  });

  it('valida assinatura X-Hub-Signature-256', () => {
    const body = JSON.stringify(waPayload());
    const sig = `sha256=${hmacSha256Hex('segredo', body)}`;
    expect(verifyMetaSignature(body, sig, 'segredo')).toBe(true);
    expect(verifyMetaSignature(body + ' ', sig, 'segredo')).toBe(false);
    expect(verifyMetaSignature(body, sig, 'outro')).toBe(false);
    expect(verifyMetaSignature(body, null, 'segredo')).toBe(false);
    expect(verifyMetaSignature(body, sig, undefined)).toBe(false);
  });

  it('janela de 24h', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    expect(isWithinServiceWindow(new Date('2026-01-02T00:00:00Z'), now)).toBe(true);
    expect(isWithinServiceWindow(new Date('2026-01-01T11:00:00Z'), now)).toBe(false);
    expect(isWithinServiceWindow(null, now)).toBe(false);
  });
});

describe('Instagram', () => {
  it('interpreta mensagens e ignora ecos', () => {
    const p = {
      object: 'instagram',
      entry: [{ id: 'IG1', messaging: [
        { sender: { id: 'U1' }, recipient: { id: 'IG1' }, timestamp: 1, message: { mid: 'mid1', text: 'oi' } },
        { sender: { id: 'IG1' }, recipient: { id: 'U1' }, timestamp: 2, message: { mid: 'mid2', text: 'eco', is_echo: true } },
      ] }],
    };
    const msgs = parseInstagramWebhook(p);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ accountId: 'IG1', senderId: 'U1', mid: 'mid1', text: 'oi' });
  });
});

describe('E-mail', () => {
  it('define a chave de thread pelos cabeçalhos', () => {
    expect(threadKeyFromHeaders({ messageId: '<c@x>', inReplyTo: '<b@x>', references: ['<a@x>', '<b@x>'] })).toBe('<a@x>');
    expect(threadKeyFromHeaders({ messageId: 'c@x', inReplyTo: 'b@x' })).toBe('<b@x>');
    expect(threadKeyFromHeaders({ messageId: '<c@x>' })).toBe('<c@x>');
  });

  it('remove citação da resposta', () => {
    expect(stripQuotedReply('Perfeito, obrigado!\n\nEm seg., 1 de jan. escreveu:\n> texto antigo')).toBe('Perfeito, obrigado!');
  });
});

describe('Widget — origens autorizadas', () => {
  it('aceita qualquer origem quando a lista está vazia', () => {
    expect(originAllowed([], null)).toBe(true);
  });
  it('valida domínio exato e curinga', () => {
    expect(originAllowed(['www.pousada.com.br'], 'https://www.pousada.com.br')).toBe(true);
    expect(originAllowed(['*.pousada.com.br'], 'https://reservas.pousada.com.br')).toBe(true);
    expect(originAllowed(['www.pousada.com.br'], 'https://evil.com')).toBe(false);
    expect(originAllowed(['www.pousada.com.br'], null)).toBe(false);
  });
});
