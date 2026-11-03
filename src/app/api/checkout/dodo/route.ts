import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getDodoClient,
  getDodoProductId,
  normalizePlanTier,
  normalizeBillingCycle,
  resolvePlanFromProductId,
  type PlanTier,
  type BillingCycle,
} from '@/lib/dodo';
import { upsertUserSubscription } from '@/lib/db';

function resolveAppOrigin(req: Request): string {
  const configured = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && configured) {
    return configured.startsWith('http') ? configured : `https://${configured}`;
  }
  try {
    const reqUrl = new URL(req.url);
    if (reqUrl.origin && reqUrl.origin !== 'null') {
      return reqUrl.origin;
    }
  } catch {
    // ignore
  }
  return configured || 'http://localhost:3000';
}

async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email || '',
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Candidate',
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid session required to start checkout' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const tier: PlanTier = normalizePlanTier(body?.plan || body?.tier);
    const billingCycle: BillingCycle = normalizeBillingCycle(body?.billingCycle);
    const quantity = Math.min(100, Math.max(1, Math.floor(Number(body?.quantity || body?.seats || 1))));

    const userId = authUser.id;
    const userEmail = authUser.email;
    const userName = authUser.name;

    const origin = resolveAppOrigin(req);

    // Downgrade to Free Starter
    if (tier === 'free') {
      const record = await upsertUserSubscription({
        userId,
        email: userEmail,
        fullName: userName,
        tier: 'free',
        billingCycle,
        status: 'active',
      });

      return NextResponse.json({
        mode: 'downgraded',
        subscription: record,
      });
    }

    const dodo = getDodoClient();
    if (!dodo) {
      return NextResponse.json(
        {
          error:
            'Dodo Payments is not configured yet. Please set DODO_PAYMENTS_API_KEY in .env.local to process live/test payments.',
          code: 'DODO_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const productId = getDodoProductId(tier, billingCycle);
    if (!productId) {
      return NextResponse.json(
        {
          error: `Dodo Product ID for ${tier.toUpperCase()} (${billingCycle}) is not configured. Please set DODO_PRODUCT_${tier.toUpperCase()}_${billingCycle.toUpperCase()} in .env.local.`,
          code: 'DODO_PRODUCT_MISSING',
        },
        { status: 503 }
      );
    }

    const returnUrlBase =
      (process.env.DODO_PAYMENTS_RETURN_URL || '').trim() ||
      `${origin}/dashboard/billing`;
    const returnUrl = new URL(returnUrlBase, origin);
    returnUrl.searchParams.set('dodo_checkout', 'success');
    returnUrl.searchParams.set('plan', tier);
    returnUrl.searchParams.set('cycle', billingCycle);

    const cancelUrl = new URL('/dashboard/billing', origin);
    cancelUrl.searchParams.set('dodo_checkout', 'cancelled');

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity,
        },
      ],
      customer: userEmail
        ? {
            email: userEmail,
            name: userName,
          }
        : undefined,
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customization: {
        theme: 'dark',
        show_order_details: true,
      },
      feature_flags: {
        allow_discount_code: true,
        redirect_immediately: true,
      },
      metadata: {
        userId,
        email: userEmail,
        plan: tier,
        billingCycle,
        app: 'InterVibe',
      },
    });

    return NextResponse.json({
      mode: 'dodo_redirect',
      session_id: session.session_id,
      checkout_url: session.checkout_url,
      plan: tier,
      billingCycle,
    });
  } catch (err: any) {
    console.error('[Dodo Checkout POST] Error creating checkout session:', err);
    return NextResponse.json(
      { error: 'Failed to initialize Dodo Payments checkout' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { verified: false, error: 'Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const dodo = getDodoClient();
    if (!dodo) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Dodo Payments API key is not configured.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const subscriptionId = searchParams.get('subscription_id');
    const paymentId = searchParams.get('payment_id');
    const fallbackPlan = normalizePlanTier(searchParams.get('plan'));
    const fallbackCycle = normalizeBillingCycle(searchParams.get('cycle'));

    const userId = authUser.id;
    const userEmail = authUser.email;
    const userName = authUser.name;

    if (!sessionId && !subscriptionId) {
      return NextResponse.json(
        { verified: false, error: 'Missing Dodo session_id or subscription_id' },
        { status: 400 }
      );
    }

    let verifiedTier: PlanTier = fallbackPlan !== 'free' ? fallbackPlan : 'pro';
    let verifiedCycle: BillingCycle = fallbackCycle;
    let resolvedCustomerId: string | null = null;
    let resolvedSubId: string | null = subscriptionId;
    let resolvedPayId: string | null = paymentId;
    let isPaymentVerified = false;

    if (sessionId) {
      const sessionStatus = await dodo.checkoutSessions.retrieve(sessionId);
      // Verify ownership: customer email must match authenticated user
      if (
        sessionStatus.customer_email &&
        userEmail &&
        sessionStatus.customer_email.toLowerCase() !== userEmail.toLowerCase()
      ) {
        return NextResponse.json(
          { verified: false, error: 'Checkout session ownership mismatch' },
          { status: 403 }
        );
      }

      if (sessionStatus.payment_status !== 'succeeded') {
        return NextResponse.json(
          {
            verified: false,
            payment_status: sessionStatus.payment_status,
          },
          { status: 200 }
        );
      }

      resolvedPayId = sessionStatus.payment_id || resolvedPayId;
      isPaymentVerified = true;
    }

    if (subscriptionId) {
      const sub = await dodo.subscriptions.retrieve(subscriptionId);
      // Verify ownership via metadata.userId or customer.email
      const metaUserId = sub.metadata?.userId ? String(sub.metadata.userId) : '';
      const subEmail = sub.customer?.email || '';
      if (
        (metaUserId && metaUserId !== userId) ||
        (!metaUserId && subEmail && userEmail && subEmail.toLowerCase() !== userEmail.toLowerCase())
      ) {
        return NextResponse.json(
          { verified: false, error: 'Subscription ownership mismatch' },
          { status: 403 }
        );
      }

      if (sub.status !== 'active') {
        return NextResponse.json(
          { verified: false, subscription_status: sub.status },
          { status: 200 }
        );
      }

      resolvedSubId = sub.subscription_id;
      resolvedCustomerId = sub.customer?.customer_id || null;
      const fromProd = resolvePlanFromProductId(sub.product_id);
      if (fromProd) {
        verifiedTier = fromProd.tier;
        verifiedCycle = fromProd.billingCycle;
      } else if (sub.metadata?.plan) {
        verifiedTier = normalizePlanTier(String(sub.metadata.plan));
        verifiedCycle = normalizeBillingCycle(
          sub.metadata.billingCycle ? String(sub.metadata.billingCycle) : undefined
        );
      }
      isPaymentVerified = true;
    }

    if (!isPaymentVerified) {
      return NextResponse.json(
        { verified: false, error: 'Payment not yet confirmed' },
        { status: 200 }
      );
    }

    const record = await upsertUserSubscription({
      userId,
      email: userEmail,
      fullName: userName,
      tier: verifiedTier,
      billingCycle: verifiedCycle,
      status: 'active',
      dodoCustomerId: resolvedCustomerId,
      dodoSubscriptionId: resolvedSubId,
      dodoPaymentId: resolvedPayId,
    });

    return NextResponse.json({
      verified: true,
      subscription: record,
      plan: verifiedTier,
      billingCycle: verifiedCycle,
    });
  } catch (err: any) {
    console.error('[Dodo Checkout GET] Verification error:', err);
    return NextResponse.json(
      { verified: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
