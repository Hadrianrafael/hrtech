/**
 * Lê o corpo da requisição como texto com limite de tamanho, sem carregar tudo antes de verificar (corpos sem
 * Content-Length, ou com valor falso, são cortados durante a leitura). Retorna null quando passa do limite.
 */
export async function readTextLimited(req: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > maxBytes) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
