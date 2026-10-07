/**
 * Acesso centralizado às variáveis de ambiente.
 * Lido sob demanda (não no import) para que `next build` funcione sem segredos.
 */
const isProd = process.env.NODE_ENV === 'production';

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function required(name: string, devFallback?: string): string {
  const v = read(name);
  if (v) return v;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
}

export const env = {
  isProd,
  isTest: process.env.NODE_ENV === 'test' || !!process.env.VITEST,
  /** URL pública. Na Vercel, sem APP_URL, usa o domínio de produção do projeto. */
  appUrl: () => {
    const explicit = read('APP_URL');
    if (explicit) return explicit.replace(/\/$/, '');
    const vercel = read('VERCEL_PROJECT_PRODUCTION_URL') ?? read('VERCEL_URL');
    return vercel ? `https://${vercel}` : 'http://localhost:3000';
  },
  authSecret: () => {
    const v = required('AUTH_SECRET', 'dev-only-insecure-secret-please-set-AUTH_SECRET');
    if (isProd && v.length < 32) throw new Error('AUTH_SECRET deve ter pelo menos 32 caracteres (openssl rand -base64 48).');
    return v;
  },
  encryptionKey: () => read('ENCRYPTION_KEY'),
  cronSecret: () => read('CRON_SECRET'),
  // IA
  /** Provedor padrão (chatbot e agentes em "auto"): AI_PROVIDER ou o primeiro com chave configurada. */
  aiProvider: () =>
    (
      read('AI_PROVIDER') ??
      (read('OPENAI_API_KEY') ? 'openai' : read('ANTHROPIC_API_KEY') ? 'anthropic' : read('GEMINI_API_KEY') ?? read('GOOGLE_API_KEY') ? 'gemini' : 'none')
    ).toLowerCase(),
  openaiKey: () => read('OPENAI_API_KEY'),
  openaiBaseUrl: () => read('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
  openaiModel: () => read('OPENAI_MODEL') ?? 'gpt-4o-mini',
  openaiEmbeddingModel: () => read('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small',
  anthropicKey: () => read('ANTHROPIC_API_KEY'),
  anthropicModel: () => read('ANTHROPIC_MODEL') ?? 'claude-opus-5-5',
  anthropicBaseUrl: () => read('ANTHROPIC_BASE_URL'),
  geminiKey: () => read('GEMINI_API_KEY') ?? read('GOOGLE_API_KEY'),
  geminiModel: () => read('GEMINI_MODEL') ?? 'gemini-2.5-flash',
  geminiBaseUrl: () => (read('GEMINI_BASE_URL') ?? 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, ''),
  /** Tabela de preços (US$/1M tokens) para estimativa de custo: {"modelo":[entrada,saida]} */
  aiPricingJson: () => read('AI_PRICING_JSON'),
  // n8n (serviço externo de automação)
  n8nBaseUrl: () => read('N8N_BASE_URL')?.replace(/\/$/, ''),
  /** Segredo compartilhado para assinar (HMAC-SHA256) as chamadas nos dois sentidos. */
  n8nWebhookSecret: () => read('N8N_WEBHOOK_SECRET'),
  /** Chave da API REST do n8n (opcional: consulta de saúde/execuções). */
  n8nApiKey: () => read('N8N_API_KEY'),
  n8nTimeoutMs: () => Math.min(Math.max(Number(read('N8N_TIMEOUT_MS') ?? 15_000) || 15_000, 1_000), 60_000),
  // Meta (WhatsApp / Instagram)
  metaAppId: () => read('META_APP_ID'),
  metaAppSecret: () => read('META_APP_SECRET'),
  /** App Secret do produto "Instagram API com login do Instagram" (assina os webhooks desse produto). */
  instagramAppSecret: () => read('INSTAGRAM_APP_SECRET'),
  metaGraphVersion: () => read('META_GRAPH_VERSION') ?? 'v21.0',
  whatsappVerifyToken: () => read('WHATSAPP_VERIFY_TOKEN'),
  instagramVerifyToken: () => read('INSTAGRAM_VERIFY_TOKEN') ?? read('WHATSAPP_VERIFY_TOKEN'),
  // E-mail transacional
  smtp: () => {
    const host = read('SMTP_HOST');
    if (!host) return null;
    return {
      host,
      port: Number(read('SMTP_PORT') ?? 587),
      secure: read('SMTP_SECURE') === 'true',
      user: read('SMTP_USER'),
      pass: read('SMTP_PASSWORD'),
      from: read('EMAIL_FROM') ?? 'HR Tech <no-reply@hrtechsistemas.com.br>',
    };
  },
  // Billing
  billingProvider: () => (read('BILLING_PROVIDER') ?? 'manual').toLowerCase(),
  stripeSecretKey: () => read('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: () => read('STRIPE_WEBHOOK_SECRET'),
  asaasApiKey: () => read('ASAAS_API_KEY'),
  asaasWebhookToken: () => read('ASAAS_WEBHOOK_TOKEN'),
};
