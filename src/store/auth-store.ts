import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import {
  PLANS,
  normalizePlanTier,
  normalizeBillingCycle,
  isPaidTier,
  formatPlanAmountInr,
  type PlanTier,
  type BillingCycle,
  type SubscriptionStatus,
} from '@/lib/dodo';

export type { PlanTier, BillingCycle, SubscriptionStatus };

export type BillingInvoice = {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Refunded';
  dodoPaymentId?: string;
  dodoSubscriptionId?: string;
};

export type UserProfileData = {
  name?: string;
  avatarUrl?: string;
  targetRole?: string;
  seniority?: string;
  targetCompanies?: string;
  bio?: string;
  tags?: string[];
  defaultPersona?: string;
  pushToTalkMode?: string;
  resumeName?: string;
  resumeText?: string;
  resumeCharCount?: number;
  subscriptionTier?: PlanTier;
  billingCycle?: BillingCycle;
  subscriptionStatus?: SubscriptionStatus;
  hasProSubscription?: boolean;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
  creditsRemaining?: number;
  currentPeriodEnd?: string;
  invoices?: BillingInvoice[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  targetRole?: string;
  seniority?: string;
  targetCompanies?: string;
  bio?: string;
  tags?: string[];
  defaultPersona?: string;
  pushToTalkMode?: string;
  resumeName?: string;
  resumeText?: string;
  resumeCharCount?: number;
  subscriptionTier: PlanTier;
  billingCycle: BillingCycle;
  subscriptionStatus: SubscriptionStatus;
  hasProSubscription: boolean;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
  creditsRemaining?: number;
  currentPeriodEnd?: string;
  invoices?: BillingInvoice[];
};

export type SavedAccount = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'github';
  lastUsedAt: string;
  accessToken?: string;
  refreshToken?: string;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  savedAccounts: SavedAccount[];
  profilesByEmail: Record<string, UserProfileData>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    targetRole?: string,
    seniority?: string
  ) => Promise<{ sessionCreated: boolean }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  upgradeSubscription: (
    tier?: PlanTier,
    billingCycle?: BillingCycle,
    dodoMeta?: {
      subscriptionId?: string;
      paymentId?: string;
      customerId?: string;
      amountFormatted?: string;
    }
  ) => Promise<void>;
  downgradeSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfileData>) => Promise<void>;
  prepareAccountSwitch: () => Promise<void>;
  switchToAccount: (email: string) => Promise<'restored' | 'needs_reauth'>;
  removeSavedAccount: (email: string) => void;
}

const DEFAULT_PROFILE: Required<
  Pick<
    UserProfileData,
    | 'targetRole'
    | 'seniority'
    | 'targetCompanies'
    | 'bio'
    | 'tags'
    | 'defaultPersona'
    | 'pushToTalkMode'
  >
> = {
  targetRole: 'Senior Full Stack Developer',
  seniority: 'Senior / Staff',
  targetCompanies: 'Linear, Stripe, Meta, OpenAI',
  bio: 'Full Stack Engineer with 6+ years of experience scaling Next.js, Node.js, distributed microservices, and high-throughput real-time voice architectures.',
  tags: [
    'Next.js',
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'WebSockets',
    'System Design',
  ],
  defaultPersona: 'Sarah - Friendly HR',
  pushToTalkMode: 'hold-space',
};

function normalizeSeniority(val?: string | null): string {
  if (!val) return DEFAULT_PROFILE.seniority;
  if (val.startsWith('Junior')) return 'Junior / Mid-Level';
  if (val.startsWith('Mid-Level')) return 'Mid-Level';
  if (val.startsWith('Senior')) return 'Senior / Staff';
  if (val.startsWith('Principal')) return 'Principal / Architect';
  return val;
}

function detectProvider(appMetadata?: Record<string, any>): 'email' | 'google' | 'github' {
  const p = (appMetadata?.provider || '').toLowerCase();
  if (p === 'google') return 'google';
  if (p === 'github') return 'github';
  return 'email';
}

function upsertSavedAccount(list: SavedAccount[], entry: SavedAccount): SavedAccount[] {
  const key = entry.email.toLowerCase();
  const existing = list.find((a) => a.email.toLowerCase() === key);
  const merged: SavedAccount = {
    ...existing,
    ...entry,
    avatarUrl:
      entry.avatarUrl !== undefined ? entry.avatarUrl : existing?.avatarUrl || '',
  };
  const rest = list.filter((a) => a.email.toLowerCase() !== key);
  return [merged, ...rest];
}

interface RemoteProfileRow {
  found: boolean;
  tier?: PlanTier;
  billingCycle?: BillingCycle;
  status?: SubscriptionStatus;
  hasPro: boolean;
  dodoSubscriptionId?: string | null;
  dodoCustomerId?: string | null;
  creditsRemaining?: number;
  currentPeriodEnd?: string | null;
  fullName?: string | null;
  targetRole?: string | null;
  seniority?: string | null;
}

/**
 * Queries server-side subscription API + Supabase profiles table for subscription tier & saved career fields.
 */
async function fetchRemoteProfile(userId: string, _email?: string): Promise<RemoteProfileRow> {
  let subRecord: any = null;

  try {
    const res = await fetch('/api/subscription');
    if (res.ok) {
      const json = await res.json();
      subRecord = json?.subscription || null;
    }
  } catch {
    // fallback to direct supabase query
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'subscription_tier, full_name, target_role, seniority, credits_remaining'
      )
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      const tier = normalizePlanTier(subRecord?.tier || data.subscription_tier);
      const billingCycle = normalizeBillingCycle(subRecord?.billingCycle);
      const status: SubscriptionStatus = subRecord?.status || 'active';
      const hasPro =
        isPaidTier(tier) && status !== 'cancelled' && status !== 'expired';

      return {
        found: true,
        tier,
        billingCycle,
        status,
        hasPro,
        dodoSubscriptionId: subRecord?.dodoSubscriptionId || null,
        dodoCustomerId: subRecord?.dodoCustomerId || null,
        creditsRemaining:
          subRecord?.creditsRemaining ?? data.credits_remaining ?? PLANS[tier].interviewsLimit,
        currentPeriodEnd: subRecord?.currentPeriodEnd || null,
        fullName: data.full_name,
        targetRole: data.target_role,
        seniority: data.seniority,
      };
    }
  } catch {
    // ignore
  }

  if (subRecord) {
    const tier = normalizePlanTier(subRecord.tier);
    const billingCycle = normalizeBillingCycle(subRecord.billingCycle);
    const status: SubscriptionStatus = subRecord.status || 'active';
    return {
      found: true,
      tier,
      billingCycle,
      status,
      hasPro: isPaidTier(tier) && status !== 'cancelled' && status !== 'expired',
      dodoSubscriptionId: subRecord.dodoSubscriptionId || null,
      dodoCustomerId: subRecord.dodoCustomerId || null,
      creditsRemaining: subRecord.creditsRemaining ?? PLANS[tier].interviewsLimit,
      currentPeriodEnd: subRecord.currentPeriodEnd || null,
    };
  }

  return { found: false, hasPro: false };
}

function buildMergedUser(params: {
  id: string;
  email: string;
  userMetadata?: Record<string, any>;
  remote: RemoteProfileRow;
  localProfile?: UserProfileData;
  savedAccount?: SavedAccount;
  currentUser?: User | null;
}): User {
  const { id, email, userMetadata, remote, localProfile, savedAccount, currentUser } = params;
  const isSameCurrentUser =
    currentUser?.email && currentUser.email.toLowerCase() === email.toLowerCase();

  const name =
    localProfile?.name ||
    (isSameCurrentUser ? currentUser?.name : undefined) ||
    savedAccount?.name ||
    remote.fullName ||
    userMetadata?.full_name ||
    userMetadata?.name ||
    email.split('@')[0] ||
    'Candidate';

  const avatarUrl =
    (localProfile?.avatarUrl !== undefined ? localProfile.avatarUrl : undefined) ??
    (isSameCurrentUser && currentUser?.avatarUrl ? currentUser.avatarUrl : undefined) ??
    savedAccount?.avatarUrl ??
    userMetadata?.custom_avatar_url ??
    userMetadata?.avatar_url ??
    '';

  const targetRole =
    localProfile?.targetRole ||
    (isSameCurrentUser ? currentUser?.targetRole : undefined) ||
    remote.targetRole ||
    userMetadata?.target_role ||
    DEFAULT_PROFILE.targetRole;

  const seniority = normalizeSeniority(
    localProfile?.seniority ||
      (isSameCurrentUser ? currentUser?.seniority : undefined) ||
      remote.seniority ||
      userMetadata?.seniority ||
      DEFAULT_PROFILE.seniority
  );

  const targetCompanies =
    localProfile?.targetCompanies ??
    (isSameCurrentUser ? currentUser?.targetCompanies : undefined) ??
    userMetadata?.target_companies ??
    DEFAULT_PROFILE.targetCompanies;

  const bio =
    localProfile?.bio ??
    (isSameCurrentUser ? currentUser?.bio : undefined) ??
    userMetadata?.bio ??
    DEFAULT_PROFILE.bio;

  const tags =
    localProfile?.tags ??
    (isSameCurrentUser ? currentUser?.tags : undefined) ??
    (Array.isArray(userMetadata?.tags) ? userMetadata.tags : undefined) ??
    DEFAULT_PROFILE.tags;

  const defaultPersona =
    localProfile?.defaultPersona ??
    (isSameCurrentUser ? currentUser?.defaultPersona : undefined) ??
    userMetadata?.default_persona ??
    DEFAULT_PROFILE.defaultPersona;

  const pushToTalkMode =
    localProfile?.pushToTalkMode ??
    (isSameCurrentUser ? currentUser?.pushToTalkMode : undefined) ??
    userMetadata?.push_to_talk_mode ??
    DEFAULT_PROFILE.pushToTalkMode;

  const resumeName =
    localProfile?.resumeName ??
    (isSameCurrentUser ? currentUser?.resumeName : undefined) ??
    userMetadata?.resume_name;

  const resumeText =
    localProfile?.resumeText ??
    (isSameCurrentUser ? currentUser?.resumeText : undefined);

  const resumeCharCount =
    localProfile?.resumeCharCount ??
    (isSameCurrentUser ? currentUser?.resumeCharCount : undefined) ??
    userMetadata?.resume_char_count;

  // SECURITY: When server/DB subscription state (remote.found) is available,
  // it is the sole authoritative source for tier, status, and remaining credits.
  // Never allow localStorage or client-writable userMetadata to escalate a 'free' DB user to 'pro'.
  let subscriptionTier: PlanTier = 'free';
  let billingCycle: BillingCycle = 'monthly';
  let subscriptionStatus: SubscriptionStatus = 'active';
  let hasProSubscription = false;
  let creditsRemaining: number = PLANS.free.interviewsLimit;

  if (remote.found) {
    subscriptionTier = normalizePlanTier(remote.tier);
    billingCycle = normalizeBillingCycle(remote.billingCycle || 'monthly');
    subscriptionStatus = remote.status || 'active';
    hasProSubscription =
      isPaidTier(subscriptionTier) &&
      subscriptionStatus !== 'cancelled' &&
      subscriptionStatus !== 'expired';
    creditsRemaining =
      remote.creditsRemaining ?? PLANS[subscriptionTier].interviewsLimit;
  } else {
    subscriptionTier = normalizePlanTier(
      localProfile?.subscriptionTier ||
        (isSameCurrentUser ? currentUser?.subscriptionTier : undefined) ||
        'free'
    );
    billingCycle = normalizeBillingCycle(
      localProfile?.billingCycle ||
        (isSameCurrentUser ? currentUser?.billingCycle : undefined) ||
        'monthly'
    );
    subscriptionStatus =
      localProfile?.subscriptionStatus ||
      (isSameCurrentUser ? currentUser?.subscriptionStatus : undefined) ||
      'active';
    hasProSubscription =
      isPaidTier(subscriptionTier) &&
      subscriptionStatus !== 'cancelled' &&
      subscriptionStatus !== 'expired';
    creditsRemaining =
      localProfile?.creditsRemaining ?? PLANS[subscriptionTier].interviewsLimit;
  }

  const dodoSubscriptionId =
    remote.dodoSubscriptionId ||
    localProfile?.dodoSubscriptionId ||
    (isSameCurrentUser ? currentUser?.dodoSubscriptionId : undefined);

  const dodoCustomerId =
    remote.dodoCustomerId ||
    localProfile?.dodoCustomerId ||
    (isSameCurrentUser ? currentUser?.dodoCustomerId : undefined);

  const currentPeriodEnd =
    remote.currentPeriodEnd ||
    localProfile?.currentPeriodEnd ||
    (isSameCurrentUser ? currentUser?.currentPeriodEnd : undefined);

  const invoices =
    localProfile?.invoices ||
    (isSameCurrentUser ? currentUser?.invoices : undefined);

  return {
    id,
    name,
    email,
    avatarUrl,
    targetRole,
    seniority,
    targetCompanies,
    bio,
    tags,
    defaultPersona,
    pushToTalkMode,
    resumeName,
    resumeText,
    resumeCharCount,
    subscriptionTier,
    billingCycle,
    subscriptionStatus,
    hasProSubscription,
    dodoSubscriptionId,
    dodoCustomerId,
    creditsRemaining,
    currentPeriodEnd,
    invoices,
  };
}

function extractProfileSnapshot(user: User): UserProfileData {
  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    targetRole: user.targetRole,
    seniority: user.seniority,
    targetCompanies: user.targetCompanies,
    bio: user.bio,
    tags: user.tags,
    defaultPersona: user.defaultPersona,
    pushToTalkMode: user.pushToTalkMode,
    resumeName: user.resumeName,
    resumeText: user.resumeText,
    resumeCharCount: user.resumeCharCount,
    subscriptionTier: user.subscriptionTier,
    billingCycle: user.billingCycle,
    subscriptionStatus: user.subscriptionStatus,
    hasProSubscription: user.hasProSubscription,
    dodoSubscriptionId: user.dodoSubscriptionId,
    dodoCustomerId: user.dodoCustomerId,
    creditsRemaining: user.creditsRemaining,
    currentPeriodEnd: user.currentPeriodEnd,
    invoices: user.invoices,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      savedAccounts: [],
      profilesByEmail: {},

      initializeAuth: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const email = session.user.email || '';
            const emailKey = email.toLowerCase();
            const remote = await fetchRemoteProfile(session.user.id, email);
            const existingSaved = (get().savedAccounts || []).find(
              (a) => a.email.toLowerCase() === emailKey
            );
            const localProfile = (get().profilesByEmail || {})[emailKey];

            const mergedUser = buildMergedUser({
              id: session.user.id,
              email,
              userMetadata: session.user.user_metadata,
              remote,
              localProfile,
              savedAccount: existingSaved,
              currentUser: get().user,
            });

            const updatedAccounts = email
              ? upsertSavedAccount(get().savedAccounts || [], {
                  id: session.user.id,
                  name: mergedUser.name,
                  email,
                  avatarUrl: mergedUser.avatarUrl,
                  provider: detectProvider(session.user.app_metadata),
                  lastUsedAt: new Date().toISOString(),
                  accessToken: session.access_token,
                  refreshToken: session.refresh_token,
                })
              : get().savedAccounts || [];

            set((state) => ({
              user: mergedUser,
              isAuthenticated: true,
              savedAccounts: updatedAccounts,
              profilesByEmail: emailKey
                ? {
                    ...(state.profilesByEmail || {}),
                    [emailKey]: extractProfileSnapshot(mergedUser),
                  }
                : state.profilesByEmail || {},
            }));
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (err) {
          console.warn('[Auth Store] Session init notice:', err);
        }
      },

      login: async (email: string, password: string) => {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
          throw new Error('Email and password are required');
        }

        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // If unconfirmed email, auto-confirm via server assist (requires matching password) & retry
        if (error) {
          try {
            await fetch('/api/auth/assist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'confirm',
                email: cleanEmail,
                password,
              }),
            });
            const retry = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            data = retry.data;
            error = retry.error;
          } catch {
            // Keep original error if assist route is unreachable
          }
        }

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          const resolvedEmail = data.user.email || cleanEmail;
          const emailKey = resolvedEmail.toLowerCase();
          const remote = await fetchRemoteProfile(data.user.id, resolvedEmail);
          const existingSaved = (get().savedAccounts || []).find(
            (a) => a.email.toLowerCase() === emailKey
          );
          const localProfile = (get().profilesByEmail || {})[emailKey];

          const mergedUser = buildMergedUser({
            id: data.user.id,
            email: resolvedEmail,
            userMetadata: data.user.user_metadata,
            remote,
            localProfile,
            savedAccount: existingSaved,
            currentUser: get().user,
          });

          const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
            id: data.user.id,
            name: mergedUser.name,
            email: resolvedEmail,
            avatarUrl: mergedUser.avatarUrl,
            provider: detectProvider(data.user.app_metadata),
            lastUsedAt: new Date().toISOString(),
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
          });

          set((state) => ({
            user: mergedUser,
            isAuthenticated: true,
            savedAccounts: updatedAccounts,
            profilesByEmail: {
              ...(state.profilesByEmail || {}),
              [emailKey]: extractProfileSnapshot(mergedUser),
            },
          }));
        }
      },

      signup: async (
        name: string,
        email: string,
        password: string,
        targetRole?: string,
        seniority?: string
      ) => {
        const cleanEmail = email.trim();
        const cleanName = name.trim();
        const emailKey = cleanEmail.toLowerCase();

        if (!cleanEmail || !password) {
          throw new Error('Email and password are required');
        }

        const emailRedirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=/dashboard/interview`
            : undefined;

        const resolvedRole = targetRole || DEFAULT_PROFILE.targetRole;
        const resolvedSeniority = normalizeSeniority(seniority);
        const displayName = cleanName || cleanEmail.split('@')[0];

        let { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: displayName,
              target_role: resolvedRole,
              seniority: resolvedSeniority,
            },
          },
        });

        const isEmailRateLimit =
          error &&
          (error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('sending confirmation email'));

        if (error && !isEmailRateLimit) {
          throw new Error(error.message);
        }

        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error(
            'An account with this email already exists. Please sign in or continue with Google/GitHub.'
          );
        }

        const initialProfile: UserProfileData = {
          ...(get().profilesByEmail || {})[emailKey],
          name: displayName,
          targetRole: resolvedRole,
          seniority: resolvedSeniority,
        };

        set((state) => ({
          profilesByEmail: {
            ...(state.profilesByEmail || {}),
            [emailKey]: initialProfile,
          },
        }));

        if (isEmailRateLimit || !data?.session) {
          try {
            await fetch('/api/auth/assist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'ensure_signup',
                email: cleanEmail,
                password,
                name: displayName,
              }),
            });
            const signInRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (!signInRes.error && signInRes.data?.session && signInRes.data?.user) {
              data = {
                user: signInRes.data.user,
                session: signInRes.data.session,
              };
            }
          } catch {
            // Fallback to normal flow if server assist fails
          }
        }

        const sessionCreated = Boolean(data?.session);

        if (data?.user && sessionCreated) {
          const mergedUser = buildMergedUser({
            id: data.user.id,
            email: cleanEmail,
            userMetadata: data.user.user_metadata,
            remote: {
              found: true,
              tier: 'free',
              billingCycle: 'monthly',
              status: 'active',
              hasPro: false,
              creditsRemaining: PLANS.free.interviewsLimit,
              fullName: displayName,
              targetRole: resolvedRole,
              seniority: resolvedSeniority,
            },
            localProfile: initialProfile,
          });

          const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
            id: data.user.id,
            name: mergedUser.name,
            email: cleanEmail,
            avatarUrl: mergedUser.avatarUrl,
            provider: 'email',
            lastUsedAt: new Date().toISOString(),
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
          });

          set((state) => ({
            user: mergedUser,
            isAuthenticated: true,
            savedAccounts: updatedAccounts,
            profilesByEmail: {
              ...(state.profilesByEmail || {}),
              [emailKey]: extractProfileSnapshot(mergedUser),
            },
          }));
        } else {
          set({ user: null, isAuthenticated: false });
        }

        return { sessionCreated };
      },

      logout: async () => {
        const currentUser = get().user;
        const currentEmail = currentUser?.email?.toLowerCase();

        if (currentUser && currentEmail) {
          const snapshot = extractProfileSnapshot(currentUser);
          const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatarUrl: currentUser.avatarUrl,
            provider:
              (get().savedAccounts || []).find((a) => a.email.toLowerCase() === currentEmail)
                ?.provider || 'email',
            lastUsedAt: new Date().toISOString(),
            accessToken: undefined,
            refreshToken: undefined,
          }).map((acc) =>
            acc.email.toLowerCase() === currentEmail
              ? { ...acc, accessToken: undefined, refreshToken: undefined }
              : acc
          );

          set((state) => ({
            profilesByEmail: {
              ...(state.profilesByEmail || {}),
              [currentEmail]: {
                ...(state.profilesByEmail || {})[currentEmail],
                ...snapshot,
              },
            },
            savedAccounts: updatedAccounts,
          }));
        }

        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('[Auth] Sign out error:', err);
        }

        set({
          user: null,
          isAuthenticated: false,
        });
      },

      prepareAccountSwitch: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const currentUser = get().user;
          if (session?.user && session.user.email) {
            const email = session.user.email;
            const emailKey = email.toLowerCase();
            const localProfile = (get().profilesByEmail || {})[emailKey];
            const displayName =
              currentUser?.name ||
              localProfile?.name ||
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              email.split('@')[0];
            const avatarUrl =
              currentUser?.avatarUrl ||
              localProfile?.avatarUrl ||
              session.user.user_metadata?.avatar_url ||
              '';

            const updated = upsertSavedAccount(get().savedAccounts || [], {
              id: session.user.id,
              name: displayName,
              email,
              avatarUrl,
              provider: detectProvider(session.user.app_metadata),
              lastUsedAt: new Date().toISOString(),
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
            });

            set((state) => ({
              savedAccounts: updated,
              profilesByEmail: currentUser
                ? {
                    ...(state.profilesByEmail || {}),
                    [emailKey]: {
                      ...(state.profilesByEmail || {})[emailKey],
                      ...extractProfileSnapshot(currentUser),
                    },
                  }
                : state.profilesByEmail || {},
            }));
          }
        } catch (err) {
          console.warn('[Auth] prepareAccountSwitch notice:', err);
        }
      },

      switchToAccount: async (email: string) => {
        const cleanEmail = email.trim().toLowerCase();
        const target = (get().savedAccounts || []).find(
          (a) => a.email.toLowerCase() === cleanEmail
        );
        if (!target) return 'needs_reauth';

        try {
          const localProfile = (get().profilesByEmail || {})[cleanEmail];

          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (currentSession?.user?.email?.toLowerCase() === cleanEmail) {
            const remote = await fetchRemoteProfile(currentSession.user.id, target.email);
            const mergedUser = buildMergedUser({
              id: currentSession.user.id,
              email: target.email,
              userMetadata: currentSession.user.user_metadata,
              remote,
              localProfile,
              savedAccount: target,
              currentUser: get().user,
            });

            const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
              ...target,
              name: mergedUser.name,
              avatarUrl: mergedUser.avatarUrl,
              lastUsedAt: new Date().toISOString(),
              accessToken: currentSession.access_token,
              refreshToken: currentSession.refresh_token,
            });

            set((state) => ({
              user: mergedUser,
              isAuthenticated: true,
              savedAccounts: updatedAccounts,
              profilesByEmail: {
                ...(state.profilesByEmail || {}),
                [cleanEmail]: extractProfileSnapshot(mergedUser),
              },
            }));
            return 'restored';
          }

          if (target.accessToken && target.refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: target.accessToken,
              refresh_token: target.refreshToken,
            });

            if (!error && data.session && data.user) {
              const remote = await fetchRemoteProfile(data.user.id, target.email);
              const mergedUser = buildMergedUser({
                id: data.user.id,
                email: target.email,
                userMetadata: data.user.user_metadata,
                remote,
                localProfile,
                savedAccount: target,
                currentUser: get().user,
              });

              const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
                ...target,
                id: data.user.id,
                name: mergedUser.name,
                avatarUrl: mergedUser.avatarUrl,
                lastUsedAt: new Date().toISOString(),
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
              });

              set((state) => ({
                user: mergedUser,
                isAuthenticated: true,
                savedAccounts: updatedAccounts,
                profilesByEmail: {
                  ...(state.profilesByEmail || {}),
                  [cleanEmail]: extractProfileSnapshot(mergedUser),
                },
              }));
              return 'restored';
            }

            set((state) => ({
              savedAccounts: (state.savedAccounts || []).map((a) =>
                a.email.toLowerCase() === cleanEmail
                  ? { ...a, accessToken: undefined, refreshToken: undefined }
                  : a
              ),
            }));
          }
        } catch (err) {
          console.warn('[Auth] switchToAccount fallback to reauth:', err);
        }

        return 'needs_reauth';
      },

      removeSavedAccount: (email: string) => {
        const cleanEmail = email.trim().toLowerCase();
        set((state) => ({
          savedAccounts: (state.savedAccounts || []).filter(
            (a) => a.email.toLowerCase() !== cleanEmail
          ),
        }));
      },

      upgradeSubscription: async (
        tier: PlanTier = 'pro',
        billingCycle: BillingCycle = 'monthly',
        dodoMeta
      ) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const resolvedTier = normalizePlanTier(tier === 'free' ? 'pro' : tier);
        const resolvedCycle = normalizeBillingCycle(billingCycle);
        const hasPro = isPaidTier(resolvedTier);
        const credits = PLANS[resolvedTier].interviewsLimit;
        const periodEndIso = new Date(
          Date.now() + (resolvedCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString();

        // Sync with server first; only commit if server authorizes the subscription update
        try {
          const res = await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update',
              tier: resolvedTier,
              billingCycle: resolvedCycle,
              status: 'active',
              dodoSubscriptionId:
                dodoMeta?.subscriptionId || currentUser.dodoSubscriptionId,
              dodoCustomerId: dodoMeta?.customerId || currentUser.dodoCustomerId,
              dodoPaymentId: dodoMeta?.paymentId,
            }),
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson?.error || 'Subscription verification required');
          }
        } catch (e: any) {
          console.warn('[Auth Store] Server subscription sync notice:', e);
          if (e?.message?.includes('verification required') || e?.message?.includes('checkout is required')) {
            throw e;
          }
        }

        const newInvoice: BillingInvoice = {
          id: `INV-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          plan: `${PLANS[resolvedTier].name.replace(' Plan', '')} — ${
            resolvedCycle === 'annual' ? 'Annual' : 'Monthly'
          }`,
          amount:
            dodoMeta?.amountFormatted || formatPlanAmountInr(resolvedTier, resolvedCycle),
          status: 'Paid',
          dodoPaymentId: dodoMeta?.paymentId,
          dodoSubscriptionId: dodoMeta?.subscriptionId,
        };

        const emailKey = currentUser.email.toLowerCase();
        const existingInvoices = currentUser.invoices || [];
        const nextInvoices = [newInvoice, ...existingInvoices];

        const nextUser: User = {
          ...currentUser,
          subscriptionTier: resolvedTier,
          billingCycle: resolvedCycle,
          subscriptionStatus: 'active',
          hasProSubscription: hasPro,
          creditsRemaining: credits,
          currentPeriodEnd: periodEndIso,
          dodoSubscriptionId:
            dodoMeta?.subscriptionId ||
            currentUser.dodoSubscriptionId ||
            `sub_dodo_${resolvedTier}_${Date.now()}`,
          dodoCustomerId: dodoMeta?.customerId || currentUser.dodoCustomerId,
          invoices: nextInvoices,
        };

        set((state) => ({
          user: nextUser,
          profilesByEmail: {
            ...(state.profilesByEmail || {}),
            [emailKey]: {
              ...(state.profilesByEmail || {})[emailKey],
              ...extractProfileSnapshot(nextUser),
            },
          },
        }));
      },

      downgradeSubscription: async () => {
        const currentUser = get().user;
        if (!currentUser) return;

        const emailKey = currentUser.email.toLowerCase();
        const preservedFreeCredits = Math.min(
          currentUser.creditsRemaining ?? 0,
          PLANS.free.interviewsLimit
        );
        const nextUser: User = {
          ...currentUser,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          hasProSubscription: false,
          creditsRemaining: preservedFreeCredits,
          currentPeriodEnd: undefined,
          dodoSubscriptionId: undefined,
        };

        set((state) => ({
          user: nextUser,
          profilesByEmail: {
            ...(state.profilesByEmail || {}),
            [emailKey]: {
              ...(state.profilesByEmail || {})[emailKey],
              ...extractProfileSnapshot(nextUser),
            },
          },
        }));

        try {
          await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'cancel',
              dodoSubscriptionId: currentUser.dodoSubscriptionId,
            }),
          });
        } catch (e) {
          console.warn('[Auth Store] Server subscription cancel notice:', e);
        }
      },

      refreshSubscription: async () => {
        const currentUser = get().user;
        if (!currentUser) return;
        const remote = await fetchRemoteProfile(currentUser.id, currentUser.email);
        if (!remote.found) return;

        const emailKey = currentUser.email.toLowerCase();
        const resolvedTier = remote.tier || 'free';
        const resolvedCycle = remote.billingCycle || currentUser.billingCycle || 'monthly';
        const resolvedStatus = remote.status || 'active';
        const hasPro =
          isPaidTier(resolvedTier) &&
          resolvedStatus !== 'cancelled' &&
          resolvedStatus !== 'expired';

        const nextUser: User = {
          ...currentUser,
          subscriptionTier: resolvedTier,
          billingCycle: resolvedCycle,
          subscriptionStatus: resolvedStatus,
          hasProSubscription: hasPro,
          creditsRemaining:
            remote.creditsRemaining ?? PLANS[resolvedTier].interviewsLimit,
          dodoSubscriptionId: remote.dodoSubscriptionId || currentUser.dodoSubscriptionId,
          dodoCustomerId: remote.dodoCustomerId || currentUser.dodoCustomerId,
          currentPeriodEnd: remote.currentPeriodEnd || currentUser.currentPeriodEnd,
        };

        set((state) => ({
          user: nextUser,
          profilesByEmail: {
            ...(state.profilesByEmail || {}),
            [emailKey]: {
              ...(state.profilesByEmail || {})[emailKey],
              ...extractProfileSnapshot(nextUser),
            },
          },
        }));
      },

      updateAvatar: async (avatarUrl: string) => {
        await get().updateProfile({ avatarUrl });
      },

      updateProfile: async (updates: Partial<UserProfileData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const emailKey = currentUser.email.toLowerCase();
        // Profile updates only modify career/UI fields; subscription fields are managed exclusively via server endpoints
        const nextUser: User = {
          ...currentUser,
          ...updates,
          name: updates.name !== undefined ? updates.name : currentUser.name,
          avatarUrl:
            updates.avatarUrl !== undefined ? updates.avatarUrl : currentUser.avatarUrl,
          targetRole:
            updates.targetRole !== undefined ? updates.targetRole : currentUser.targetRole,
          seniority:
            updates.seniority !== undefined
              ? normalizeSeniority(updates.seniority)
              : currentUser.seniority,
          subscriptionTier: currentUser.subscriptionTier,
          billingCycle: currentUser.billingCycle,
          subscriptionStatus: currentUser.subscriptionStatus,
          hasProSubscription: currentUser.hasProSubscription,
        };

        const snapshot = extractProfileSnapshot(nextUser);

        const existingSaved = (get().savedAccounts || []).find(
          (a) => a.email.toLowerCase() === emailKey
        );
        const updatedAccounts = upsertSavedAccount(get().savedAccounts || [], {
          id: nextUser.id,
          name: nextUser.name,
          email: nextUser.email,
          avatarUrl: nextUser.avatarUrl,
          provider: existingSaved?.provider || 'email',
          lastUsedAt: new Date().toISOString(),
          accessToken: existingSaved?.accessToken,
          refreshToken: existingSaved?.refreshToken,
        });

        set((state) => ({
          user: nextUser,
          savedAccounts: updatedAccounts,
          profilesByEmail: {
            ...(state.profilesByEmail || {}),
            [emailKey]: {
              ...(state.profilesByEmail || {})[emailKey],
              ...snapshot,
            },
          },
        }));

        try {
          await supabase.from('profiles').upsert(
            {
              id: nextUser.id,
              email: nextUser.email,
              full_name: nextUser.name,
              target_role: nextUser.targetRole || DEFAULT_PROFILE.targetRole,
              seniority: nextUser.seniority || DEFAULT_PROFILE.seniority,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          const metadataPatch: Record<string, any> = {
            full_name: nextUser.name,
            target_role: nextUser.targetRole,
            seniority: nextUser.seniority,
            target_companies: nextUser.targetCompanies,
            bio: nextUser.bio,
            tags: nextUser.tags,
            default_persona: nextUser.defaultPersona,
            push_to_talk_mode: nextUser.pushToTalkMode,
            resume_name: nextUser.resumeName,
            resume_char_count: nextUser.resumeCharCount,
          };
          if (nextUser.avatarUrl && !nextUser.avatarUrl.startsWith('data:')) {
            metadataPatch.custom_avatar_url = nextUser.avatarUrl;
          } else if (nextUser.avatarUrl === '') {
            metadataPatch.custom_avatar_url = '';
          }

          await supabase.auth.updateUser({ data: metadataPatch });
        } catch (err) {
          console.warn('[Auth Store] Remote profile sync notice:', err);
        }
      },
    }),
    {
      name: 'intervibe-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
