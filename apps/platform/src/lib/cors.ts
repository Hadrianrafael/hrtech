/** CORS para as APIs públicas consumidas por sites de clientes (widget/formulário). */
export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Visitor-Token',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}
