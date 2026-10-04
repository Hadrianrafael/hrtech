import { NextResponse } from 'next/server';
import { decryptJson } from '@/lib/crypto';
import { errorResponse, routeContext } from '@/lib/route';
import { downloadWhatsAppMedia, type WaSecrets } from '@/server/channels/whatsapp';
import { getConversation } from '@/server/conversations';

/**
 * Tipos que podem ser exibidos no navegador. Qualquer outro (inclusive text/html, SVG, XML) é servido como download
 * binário: o tipo de conteúdo vem do remetente da mensagem e não é confiável.
 */
const INLINE_TYPES = /^(image\/(jpeg|png|webp|gif)|audio\/(ogg|mpeg|mp4|aac|amr|webm)|video\/(mp4|3gpp|webm)|application\/pdf)$/i;

/** CDNs da Meta de onde vêm anexos do Instagram (redirecionamento permitido apenas para esses hosts). */
const META_CDN = /(^|\.)(cdninstagram\.com|fbcdn\.net|fbsbx\.com|facebook\.com|instagram\.com)$/i;

/** Proxy autenticado para mídias recebidas (WhatsApp exige token; Instagram usa URL temporária do CDN da Meta). */
export async function GET(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const ctx = await routeContext('inbox.use');
  if (ctx instanceof NextResponse) return ctx;
  try {
    const { messageId } = await params;
    const msg = await ctx.db.message.findFirst({ where: { id: messageId }, include: { conversation: { include: { integration: true } } } });
    if (!msg) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
    await getConversation(ctx, msg.conversationId); // aplica o escopo de visibilidade do usuário
    const media = msg.media as { id?: string; filename?: string; attachments?: { type?: string; url?: string }[] } | null;

    if (msg.conversation.channel === 'INSTAGRAM') {
      const index = Number(new URL(req.url).searchParams.get('i') ?? 0);
      const url = media?.attachments?.[index]?.url;
      if (!url) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
      const target = new URL(url);
      if (target.protocol !== 'https:' || !META_CDN.test(target.hostname)) return NextResponse.json({ error: 'Origem de mídia não permitida.' }, { status: 400 });
      return NextResponse.redirect(target, 302);
    }

    const integration = msg.conversation.integration;
    if (!media?.id || msg.conversation.channel !== 'WHATSAPP' || !integration?.secretsEnc) return NextResponse.json({ error: 'Mídia indisponível.' }, { status: 404 });
    const file = await downloadWhatsAppMedia(decryptJson<WaSecrets>(integration.secretsEnc)!, media.id);
    const mime = (file.mimeType ?? '').split(';')[0]!.trim();
    const inline = INLINE_TYPES.test(mime);
    const filename = (media.filename ?? 'arquivo').replace(/[^\w.-]/g, '_');
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        'Content-Type': inline ? mime : 'application/octet-stream',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'",
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
