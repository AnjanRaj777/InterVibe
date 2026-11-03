import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getDodoClient,
  getDodoProductId,
  normalizePlanTier,
  normalizeBillingCycle,
  isDodoApiConfigured,
  getDodoEnvironment,
  type PlanTier,
  type BillingCycle,
} from '@/lib/dodo';
import { getUserSubscriptionFromDb, upsertUserSubscription } from '@/lib/db';

async function resolveAuthenticatedCaller() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      userId: user.id,
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

export async function GET() {
  try {
    const caller = await resolveAuthenticatedCaller();
    if (!caller) {
      return NextResponse.json(
        {
          subscription: null,
          dodoConfigured: isDodoApiConfigured(),
          environment: getDodoEnvironment(),
        },
        { status: 401 }
      );
    }

    const record = await getUserSubscriptionFromDb({
      userId: caller.userId,
      email: caller.email,
    });

    return NextResponse.json({
      subscription: record,
      dodoConfigured: isDodoApiConfigured(),
      environment: getDodoEnvironment(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const caller = await resolveAuthenticatedCaller();
    if (!caller) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = (body?.action || 'update') as 'update' | 'cancel' | 'change_plan';

    const current = await getUserSubscriptionFromDb({
      userId: caller.userId,
      email: caller.email,
    });

    const dodo = getDodoClient();

    if (action === 'cancel') {
      const subId = current?.dodoSubscriptionId;
      if (dodo && subId && !subId.startsWith('sub_dodo_')) {
        try {
          await dodo.subscriptions.update(subId, { status: 'cancelled' });
        } catch (e) {
          console.warn('[Subscription API] Dodo cancel notice:', e);
        }
      }

      const updated = await upsertUserSubscription({
        userId: caller.userId,
        email: caller.email,
        fullName: caller.name,
        tier: 'free',
        billingCycle: current?.billingCycle || 'monthly',
        status: 'active',
        dodoCustomerId: current?.dodoCustomerId,
        dodoSubscriptionId: null,
      });

      return NextResponse.json({ ok: true, subscription: updated });
    }

    const tier: PlanTier = normalizePlanTier(body?.tier || body?.plan);
    const billingCycle: BillingCycle = normalizeBillingCycle(
      body?.billingCycle || current?.billingCycle
    );

    if (tier === 'free') {
      const updated = await upsertUserSubscription({
        userId: caller.userId,
        email: caller.email,
        fullName: caller.name,
        tier: 'free',
        billingCycle,
        status: 'active',
        dodoCustomerId: current?.dodoCustomerId,
        dodoSubscriptionId: null,
      });
      return NextResponse.json({ ok: true, subscription: updated });
    }

    // Paid plan changes strictly require a configured Dodo client and an active verified Dodo subscription
    if (!dodo) {
      return NextResponse.json(
        {
          error:
            'Dodo Payments is not configured yet. Please set DODO_PAYMENTS_API_KEY in .env.local.',
        },
        { status: 503 }
      );
    }

    const existingSubId = current?.dodoSubscriptionId;
    const targetProductId = getDodoProductId(tier, billingCycle);

    if (!existingSubId || existingSubId.startsWith('sub_dodo_')) {
      return NextResponse.json(
        {
          error:
            'Paid subscription upgrade requires completing Dodo Payments checkout (/api/checkout/dodo).',
        },
        { status: 403 }
      );
    }

    if (!targetProductId) {
      return NextResponse.json(
        {
          error: `Dodo Product ID for ${tier} (${billingCycle}) is not configured.`,
        },
        { status: 503 }
      );
    }

    const sub = await dodo.subscriptions.retrieve(existingSubId);
    if (sub.status !== 'active') {
      return NextResponse.json(
        { error: 'Existing Dodo subscription is not active.' },
        { status: 403 }
      );
    }

    if (action === 'change_plan') {
      await dodo.subscriptions.changePlan(existingSubId, {
        product_id: targetProductId,
        proration_billing_mode: 'prorated_immediately',
        quantity: 1,
      });
    }

    const updated = await upsertUserSubscription({
      userId: caller.userId,
      email: caller.email,
      fullName: caller.name,
      tier,
      billingCycle,
      status: 'active',
      dodoCustomerId: current?.dodoCustomerId,
      dodoSubscriptionId: existingSubId,
      dodoPaymentId: current?.dodoPaymentId,
    });

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (err: any) {
    console.error('[Subscription API POST] Error:', err);
    return NextResponse.json(
      { error: 'Subscription update failed' },
      { status: 500 }
    );
  }
}
