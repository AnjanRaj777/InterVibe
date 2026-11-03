import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import {
  normalizePlanTier,
  normalizeBillingCycle,
  resolvePlanFromProductId,
  getDodoEnvironment,
  isDodoApiConfigured,
  type PlanTier,
  type BillingCycle,
  type SubscriptionStatus,
} from '@/lib/dodo';
import { upsertUserSubscription } from '@/lib/db';

function extractIdentityAndPlan(data: any): {
  userId?: string;
  email?: string;
  fullName?: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  dodoCustomerId?: string | null;
  dodoSubscriptionId?: string | null;
  dodoPaymentId?: string | null;
  currentPeriodEnd?: string | null;
} {
  const metadata = data?.metadata || {};
  const customer = data?.customer || {};

  const userId = metadata.userId ? String(metadata.userId) : metadata.user_id ? String(metadata.user_id) : undefined;
  const email = customer.email || metadata.email || data?.customer_email || undefined;
  const fullName = customer.name || metadata.name || undefined;

  const productId =
    data?.product_id ||
    data?.product_cart?.[0]?.product_id ||
    metadata.productId ||
    null;

  const fromProduct = resolvePlanFromProductId(productId ? String(productId) : null);
  const tier: PlanTier =
    fromProduct?.tier || normalizePlanTier(metadata.plan ? String(metadata.plan) : 'pro');
  const billingCycle: BillingCycle =
    fromProduct?.billingCycle ||
    normalizeBillingCycle(
      metadata.billingCycle
        ? String(metadata.billingCycle)
        : data?.payment_frequency_interval || data?.subscription_period_interval
    );

  return {
    userId,
    email: email ? String(email) : undefined,
    fullName: fullName ? String(fullName) : undefined,
    tier: tier === 'free' ? 'pro' : tier,
    billingCycle,
    dodoCustomerId: customer.customer_id || data?.customer_id || null,
    dodoSubscriptionId: data?.subscription_id || null,
    dodoPaymentId: data?.payment_id || null,
    currentPeriodEnd: data?.next_billing_date || data?.expires_at || null,
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const webhookKey = (process.env.DODO_PAYMENTS_WEBHOOK_KEY || '').trim();
    const isRealWebhookKey = Boolean(
      webhookKey &&
        !webhookKey.startsWith('your_') &&
        webhookKey !== 'whsec_your_webhook_secret_here'
    );

    // SEC-22: Enforce webhook secret in production or when Dodo API is configured
    if (!isRealWebhookKey && (process.env.NODE_ENV === 'production' || isDodoApiConfigured())) {
      console.error('[Dodo Webhook] Missing DODO_PAYMENTS_WEBHOOK_KEY in production/live mode');
      return NextResponse.json(
        { error: 'Webhook verification secret not configured' },
        { status: 500 }
      );
    }

    const webhookHeaders: Record<string, string> = {
      'webhook-id': req.headers.get('webhook-id') || '',
      'webhook-signature': req.headers.get('webhook-signature') || '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
    };

    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'dodo_webhook_verifier',
      environment: getDodoEnvironment(),
      webhookKey: isRealWebhookKey ? webhookKey : null,
    });

    let event: any;

    if (isRealWebhookKey) {
      try {
        event = client.webhooks.unwrap(rawBody, {
          headers: webhookHeaders,
          key: webhookKey,
        });
      } catch (verifyErr: any) {
        console.error('[Dodo Webhook] Signature verification failed:', verifyErr?.message);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      event = client.webhooks.unsafeUnwrap(rawBody);
    }

    const eventType: string = event?.type || event?.event_type || '';
    const data: any = event?.data || {};
    const extracted = extractIdentityAndPlan(data);

    console.log(`[Dodo Webhook] Processing event: ${eventType}`, {
      email: extracted.email,
      userId: extracted.userId,
      tier: extracted.tier,
      subscriptionId: extracted.dodoSubscriptionId,
    });

    switch (eventType) {
      case 'subscription.active':
      case 'subscription.renewed':
      case 'subscription.plan_changed':
      case 'subscription.updated':
      case 'subscription.unpaused':
      case 'payment.succeeded': {
        await upsertUserSubscription({
          userId: extracted.userId,
          email: extracted.email,
          fullName: extracted.fullName,
          tier: extracted.tier,
          billingCycle: extracted.billingCycle,
          status: 'active',
          dodoCustomerId: extracted.dodoCustomerId,
          dodoSubscriptionId: extracted.dodoSubscriptionId,
          dodoPaymentId: extracted.dodoPaymentId,
          currentPeriodEnd: extracted.currentPeriodEnd,
        });
        break;
      }

      case 'subscription.on_hold':
      case 'subscription.past_due':
      case 'subscription.failed': {
        const status: SubscriptionStatus =
          eventType === 'subscription.on_hold' ? 'on_hold' : 'past_due';
        await upsertUserSubscription({
          userId: extracted.userId,
          email: extracted.email,
          fullName: extracted.fullName,
          tier: extracted.tier,
          billingCycle: extracted.billingCycle,
          status,
          dodoCustomerId: extracted.dodoCustomerId,
          dodoSubscriptionId: extracted.dodoSubscriptionId,
          dodoPaymentId: extracted.dodoPaymentId,
          currentPeriodEnd: extracted.currentPeriodEnd,
        });
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired':
      case 'refund.succeeded': {
        await upsertUserSubscription({
          userId: extracted.userId,
          email: extracted.email,
          fullName: extracted.fullName,
          tier: 'free',
          billingCycle: extracted.billingCycle,
          status: 'cancelled',
          dodoCustomerId: extracted.dodoCustomerId,
          dodoSubscriptionId: extracted.dodoSubscriptionId,
          dodoPaymentId: extracted.dodoPaymentId,
        });
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, type: eventType }, { status: 200 });
  } catch (err: any) {
    console.error('[Dodo Webhook] Error handling webhook:', err);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 400 }
    );
  }
}
