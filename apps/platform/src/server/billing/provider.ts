import { createHmac } from 'node:crypto';
import { env } from '@/lib/env';
import { NotConfiguredError } from '@/lib/errors';
import { safeEqual } from '@/lib/crypto';

/**
 * Camada de billing desacoplada. O restante da aplicação conversa apenas com esta interface;
 * a troca de gateway (Stripe, Asaas, outro) não afeta CRM, inbox etc.
 */
export interface CheckoutRequest {
  organizationId: string;
  planKey: string;
  priceCents: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingProvider {
  readonly key: string;
  readonly configured: boolean;
  /** Retorna URL de checkout hospedado pelo gateway (quando suportado). */
  createCheckout(req: CheckoutRequest): Promise<{ url: string | null; message?: string }>;
  cancelSubscription(externalSubscriptionId: string): Promise<void>;
  /** Valida e normaliza o webhook do gateway em um evento interno. */
  parseWebhook(rawBody: string, headers: Headers): Promise<BillingWebhookEvent | null>;
}

export interface BillingWebhookEvent {
  id: string;
  type: 'subscription.activated' | 'subscription.past_due' | 'subscription.canceled' | 'subscription.renewed' | 'other';
  organizationId?: string;
  externalSubscriptionId?: string;
  externalCustomerId?: string;
  periodEnd?: Date;
  /** Quando o evento aconteceu no provedor (os provedores não garantem a ordem de entrega). */
  occurredAt?: Date;
}

/** Billing manual: o super admin HR Tech controla plano/status pelo painel. */
export class ManualBillingProvider implements BillingProvider {
  readonly key = 'manual';
  readonly configured = true;
  async createCheckout() {
    return { url: null, message: 'Cobrança manual: a equipe HR Tech entrará em contato para concluir a contratação.' };
  }
  async cancelSubscription() {}
  async parseWebhook() {
    return null;
  }
}

/**
 * Stripe — PENDENTE DE CREDENCIAIS (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).
 * Implementa checkout via Checkout Sessions (price_data dinâmico, sem preços fixos no código)
 * e verificação de assinatura de webhook (esquema v1 da Stripe).
 */
export class StripeBillingProvider implements BillingProvider {
  readonly key = 'stripe';
  get configured() {
    return !!env.stripeSecretKey();
  }
  private secret() {
    const k = env.stripeSecretKey();
    if (!k) throw new NotConfiguredError('Stripe não configurado (STRIPE_SECRET_KEY).');
    return k;
  }
  async createCheckout(req: CheckoutRequest) {
    const body = new URLSearchParams({
      mode: 'subscription',
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      customer_email: req.customerEmail,
      client_reference_id: req.organizationId,
      'metadata[organizationId]': req.organizationId,
      'subscription_data[metadata][organizationId]': req.organizationId,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': req.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(req.priceCents),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': `HR Tech — ${req.planKey}`,
    });
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.secret()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message ?? 'Falha ao criar checkout na Stripe.');
    return { url: json.url ?? null };
  }
  async cancelSubscription(id: string) {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.secret()}` },
    });
    if (!res.ok) throw new Error('Falha ao cancelar assinatura na Stripe.');
  }
  async parseWebhook(rawBody: string, headers: Headers) {
    const secret = env.stripeWebhookSecret();
    if (!secret) throw new NotConfiguredError('STRIPE_WEBHOOK_SECRET ausente.');
    const sig = headers.get('stripe-signature') ?? '';
    const parts = Object.fromEntries(sig.split(',').map((p) => p.split('=') as [string, string]));
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) return null;
    if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return null;
    const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    if (!safeEqual(expected, v1)) return null;
    const event = JSON.parse(rawBody) as { id: string; type: string; created?: number; data: { object: Record<string, unknown> } };
    const obj = event.data.object;
    type SubDetails = { subscription?: string; metadata?: Record<string, string> } | undefined;
    // Faturas trazem os metadados da assinatura em subscription_details (ou parent.subscription_details nas
    // versões mais novas da API), não em metadata. Sem isso a renovação/inadimplência não chegaria à empresa.
    const details = (obj.subscription_details ?? (obj.parent as { subscription_details?: SubDetails } | undefined)?.subscription_details) as SubDetails;
    const meta = { ...(details?.metadata ?? {}), ...((obj.metadata ?? {}) as Record<string, string>) };
    const map: Record<string, BillingWebhookEvent['type']> = {
      'checkout.session.completed': 'subscription.activated',
      'invoice.paid': 'subscription.renewed',
      'invoice.payment_failed': 'subscription.past_due',
      'customer.subscription.deleted': 'subscription.canceled',
    };
    const isSubscription = event.type.startsWith('customer.subscription.');
    const subscriptionId = isSubscription ? (obj.id as string) : ((obj.subscription as string | undefined) ?? details?.subscription);
    // Itens avulsos/proporcionais podem vir antes da linha da assinatura: usa o maior fim de período entre as linhas.
    const ends = ((obj.lines as { data?: { period?: { end?: number } }[] } | undefined)?.data ?? []).map((l) => l.period?.end ?? 0);
    const periodEnd = Math.max(0, ...ends) || (obj.current_period_end as number | undefined);
    return {
      id: event.id,
      type: map[event.type] ?? 'other',
      organizationId: meta.organizationId ?? (obj.client_reference_id as string | undefined),
      externalSubscriptionId: subscriptionId,
      externalCustomerId: obj.customer as string | undefined,
      periodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      occurredAt: event.created ? new Date(event.created * 1000) : undefined,
    } satisfies BillingWebhookEvent;
  }
}

/**
 * Asaas — PENDENTE DE CREDENCIAIS (ASAAS_API_KEY / ASAAS_WEBHOOK_TOKEN).
 * Estrutura pronta: o webhook é autenticado por token no header `asaas-access-token`.
 * A criação de assinaturas (POST /v3/subscriptions) deve ser concluída ao obter a conta.
 */
export class AsaasBillingProvider implements BillingProvider {
  readonly key = 'asaas';
  get configured() {
    return !!env.asaasApiKey();
  }
  async createCheckout(): Promise<{ url: string | null; message?: string }> {
    throw new NotConfiguredError('Integração Asaas pendente de credenciais e implementação do checkout.');
  }
  async cancelSubscription() {
    throw new NotConfiguredError('Integração Asaas pendente de credenciais.');
  }
  async parseWebhook(rawBody: string, headers: Headers) {
    const token = env.asaasWebhookToken();
    if (!token || !safeEqual(headers.get('asaas-access-token') ?? '', token)) return null;
    const event = JSON.parse(rawBody) as { id?: string; event: string; payment?: { subscription?: string; externalReference?: string } };
    const map: Record<string, BillingWebhookEvent['type']> = {
      PAYMENT_CONFIRMED: 'subscription.renewed',
      PAYMENT_RECEIVED: 'subscription.renewed',
      PAYMENT_OVERDUE: 'subscription.past_due',
      SUBSCRIPTION_DELETED: 'subscription.canceled',
    };
    return {
      id: event.id ?? `${event.event}:${event.payment?.subscription ?? ''}`,
      type: map[event.event] ?? 'other',
      organizationId: event.payment?.externalReference,
      externalSubscriptionId: event.payment?.subscription,
    } satisfies BillingWebhookEvent;
  }
}

export function getBillingProvider(key = env.billingProvider()): BillingProvider {
  switch (key) {
    case 'stripe':
      return new StripeBillingProvider();
    case 'asaas':
      return new AsaasBillingProvider();
    default:
      return new ManualBillingProvider();
  }
}
