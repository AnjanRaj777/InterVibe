import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function resolveSafeRedirectBase(requestOrigin: string): string {
  const rawAppUrl = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (!rawAppUrl) {
    return requestOrigin;
  }

  const normalizedAppUrl = rawAppUrl.startsWith('http')
    ? rawAppUrl
    : `https://${rawAppUrl}`;

  // Never redirect a production/non-localhost request to localhost even if APP_URL=http://localhost:3000 was copied into Vercel env vars
  const isAppUrlLocal =
    normalizedAppUrl.includes('localhost') || normalizedAppUrl.includes('127.0.0.1');
  const isRequestLocal =
    requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');

  if (isAppUrlLocal && !isRequestLocal) {
    return requestOrigin;
  }

  return requestOrigin || normalizedAppUrl;
}

/**
 * Handles OAuth and Email Confirmation callback redirects from Supabase Auth.
 * Exchanges authorization code or verifies OTP token_hash for a session and redirects to target destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // SEC-10 Fix: Prevent open redirect by strictly validating relative URL
  const rawNext = searchParams.get('next') ?? '/dashboard/interview';
  const isSafeRelativePath =
    typeof rawNext === 'string' &&
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.startsWith('/\\') &&
    !rawNext.includes(':');
  const next = isSafeRelativePath ? rawNext : '/dashboard/interview';

  const redirectBase = resolveSafeRedirectBase(origin);

  if (code || (token_hash && type)) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: token_hash!, type: type! });

    if (!error) {
      // Sync user metadata to public.profiles if needed
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const profileName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.user_name ||
            user.email?.split('@')[0] ||
            'Developer';

          await supabase.from('profiles').upsert(
            {
              id: user.id,
              email: user.email || '',
              full_name: profileName,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
      } catch (profileErr) {
        console.warn('[Auth Callback] Notice updating profile:', profileErr);
      }

      return NextResponse.redirect(new URL(next, redirectBase).toString());
    }
    console.error('[Auth Callback] Exchange/Verify error:', error.message);
  }

  // Return the user to login with an error flag if exchange fails
  return NextResponse.redirect(
    new URL('/auth/login?error=oauth_exchange_failed', redirectBase).toString()
  );
}
