import DodoPayments from 'dodopayments';

export type PlanTier = 'free' | 'hustler' | 'pro' | 'teams';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'on_hold' | 'expired';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  badge: string;
  tagline: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  interviewsLimit: number;
  minutesLimit: number;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    badge: 'FREE',
    tagline: 'For trying out InterVibe',
    monthlyPriceInr: 0,
    annualPriceInr: 0,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    interviewsLimit: 3,
    minutesLimit: 30,
    features: [
      '3 interviews total (lifetime)',
      '30 mins total',
      'Basic AI feedback',
      '1 interview template',
      'Community support',
    ],
  },
  hustler: {
    id: 'hustler',
    name: 'Hustler Plan',
    badge: 'HUSTLER',
    tagline: 'For active job seekers',
    monthlyPriceInr: 499,
    annualPriceInr: 349,
    monthlyPriceUsd: 7,
    annualPriceUsd: 5,
    interviewsLimit: 20,
    minutesLimit: 300,
    features: [
      '20 interviews / month',
      '300 mins total',
      'Advanced AI feedback',
      '10 templates + custom',
      'Resume analysis',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    badge: 'PRO',
    tagline: 'For serious interview prep',
    monthlyPriceInr: 1499,
    annualPriceInr: 1049,
    monthlyPriceUsd: 15,
    annualPriceUsd: 11,
    interviewsLimit: 100,
    minutesLimit: 1200,
    features: [
      '100 interviews / month',
      '1200 mins total',
      'Deep performance analytics',
      'Unlimited templates',
      'Voice cloning + behavior map',
      'Priority support + Slack',
      'Export to PDF / Notion',
    ],
  },
  teams: {
    id: 'teams',
    name: 'Teams Plan',
    badge: 'TEAMS',
    tagline: 'For coaches & orgs',
    monthlyPriceInr: 4999,
    annualPriceInr: 3499,
    monthlyPriceUsd: 49,
    annualPriceUsd: 35,
    interviewsLimit: 500,
    minutesLimit: 5000,
    features: [
      '500 interviews / month',
      '5000 mins pooled',
      'Team dashboard + SSO',
      'Custom AI interviewer',
      'API access + webhooks',
      'Dedicated success manager',
      'Onboarding + training',
    ],
  },
};

export function normalizePlanTier(raw?: string | null): PlanTier {
  const val = (raw || '').trim().toLowerCase();
  if (val === 'hustler') return 'hustler';
  if (val === 'pro') return 'pro';
  if (val === 'teams' || val === 'enterprise') return 'teams';
  return 'free';
}

export function normalizeBillingCycle(raw?: string | null): BillingCycle {
  const val = (raw || '').trim().toLowerCase();
  if (val === 'annual' || val === 'yearly' || val === 'year') return 'annual';
  return 'monthly';
}

export function isPaidTier(tier?: string | null): boolean {
  const normalized = normalizePlanTier(tier);
  return normalized === 'hustler' || normalized === 'pro' || normalized === 'teams';
}

export function getDodoProductId(tier: PlanTier, cycle: BillingCycle): string | null {
  const map: Record<string, string | undefined> = {
    'hustler:monthly':
      process.env.DODO_PRODUCT_HUSTLER_MONTHLY ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_HUSTLER_MONTHLY,
    'hustler:annual':
      process.env.DODO_PRODUCT_HUSTLER_ANNUAL ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_HUSTLER_ANNUAL,
    'pro:monthly':
      process.env.DODO_PRODUCT_PRO_MONTHLY ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO_MONTHLY,
    'pro:annual':
      process.env.DODO_PRODUCT_PRO_ANNUAL ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO_ANNUAL,
    'teams:monthly':
      process.env.DODO_PRODUCT_TEAMS_MONTHLY ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_TEAMS_MONTHLY,
    'teams:annual':
      process.env.DODO_PRODUCT_TEAMS_ANNUAL ||
      process.env.NEXT_PUBLIC_DODO_PRODUCT_TEAMS_ANNUAL,
  };

  const candidate = map[`${tier}:${cycle}`]?.trim();
  if (!candidate || candidate.startsWith('your_') || candidate === 'pdt_replace_me') {
    return null;
  }
  return candidate;
}

export function resolvePlanFromProductId(productId?: string | null): {
  tier: PlanTier;
  billingCycle: BillingCycle;
} | null {
  if (!productId) return null;
  const trimmed = productId.trim();

  const pairs: Array<{ tier: PlanTier; cycle: BillingCycle }> = [
    { tier: 'hustler', cycle: 'monthly' },
    { tier: 'hustler', cycle: 'annual' },
    { tier: 'pro', cycle: 'monthly' },
    { tier: 'pro', cycle: 'annual' },
    { tier: 'teams', cycle: 'monthly' },
    { tier: 'teams', cycle: 'annual' },
  ];

  for (const p of pairs) {
    const configuredId = getDodoProductId(p.tier, p.cycle);
    if (configuredId && configuredId === trimmed) {
      return { tier: p.tier, billingCycle: p.cycle };
    }
  }

  const lower = trimmed.toLowerCase();
  const billingCycle: BillingCycle =
    lower.includes('annual') || lower.includes('year') ? 'annual' : 'monthly';
  if (lower.includes('teams') || lower.includes('enterprise')) {
    return { tier: 'teams', billingCycle };
  }
  if (lower.includes('hustler')) {
    return { tier: 'hustler', billingCycle };
  }
  if (lower.includes('pro')) {
    return { tier: 'pro', billingCycle };
  }

  return null;
}

export function isDodoApiConfigured(): boolean {
  const apiKey = (process.env.DODO_PAYMENTS_API_KEY || '').trim();
  return Boolean(
    apiKey &&
      !apiKey.startsWith('your_') &&
      apiKey !== 'dodo_test_your_api_key_here'
  );
}

export function getDodoEnvironment(): 'test_mode' | 'live_mode' {
  const env = (process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode').trim().toLowerCase();
  return env === 'live_mode' || env === 'live' ? 'live_mode' : 'test_mode';
}

export function getDodoClient(): DodoPayments | null {
  if (!isDodoApiConfigured()) {
    return null;
  }

  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!.trim(),
    environment: getDodoEnvironment(),
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() || null,
  });
}

export function formatPlanAmountInr(tier: PlanTier, cycle: BillingCycle): string {
  const plan = PLANS[tier];
  if (!plan || tier === 'free') return '₹0.00';
  const monthly = cycle === 'annual' ? plan.annualPriceInr : plan.monthlyPriceInr;
  const total = cycle === 'annual' ? monthly * 12 : monthly;
  return `₹${total.toLocaleString('en-IN')}.00`;
}
