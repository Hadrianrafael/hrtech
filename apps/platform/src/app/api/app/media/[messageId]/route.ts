import { NextResponse } from 'next/server';
import { decryptJson } from '@/lib/crypto';
import { errorResponse, routeContext } from '@/lib/route';
import { downloadWhatsAppMedia, type WaSecrets } from '@/server/channels/whatsapp';

/** Proxy autenticado para mídias recebidas no WhatsApp (as URLs da Meta exigem token). */
export async function GET(_req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const ctx = await routeContext('inbox.use');
  if (ctx instanceof NextResponse) return ctx;
  try {
    const { messageId } = await params;
    const msg = await ctx.db.message.findFirst({ where: { id: messageId }, include: { conversation: { include: { integration: true } } } });
    const media = msg?.media as { id?: string; filename?: string } | null;
    if (!msg || !media?.id) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
    const integration = msg.conversation.integration;
    if (msg.conversation.channel !== 'WHATSAPP' || !integration?.secretsEnc) return NextResponse.json({ error: 'Mídia indisponível.' }, { status: 404 });
    const file = await downloadWhatsAppMedia(decryptJson<WaSecrets>(integration.secretsEnc)!, media.id);
    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${(media.filename ?? 'arquivo').replace(/[^\w.-]/g, '_')}"`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
