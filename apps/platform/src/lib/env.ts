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
  aiProvider: () => (read('AI_PROVIDER') ?? (read('OPENAI_API_KEY') ? 'openai' : 'none')).toLowerCase(),
  openaiKey: () => read('OPENAI_API_KEY'),
  openaiBaseUrl: () => read('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
  openaiModel: () => read('OPENAI_MODEL') ?? 'gpt-4o-mini',
  openaiEmbeddingModel: () => read('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small',
  // Meta (WhatsApp / Instagram)
  metaAppId: () => read('META_APP_ID'),
  metaAppSecret: () => read('META_APP_SECRET'),
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
