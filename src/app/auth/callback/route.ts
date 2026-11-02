import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

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

      // SEC-11 Fix: Prevent host header poisoning by preferring APP_URL or verified origin
      const configuredBase = process.env.APP_URL
        ? process.env.APP_URL.startsWith('http')
          ? process.env.APP_URL
          : `https://${process.env.APP_URL}`
        : origin;

      return NextResponse.redirect(new URL(next, configuredBase).toString());
    }
    console.error('[Auth Callback] Exchange/Verify error:', error.message);
  }

  // Return the user to login with an error flag if exchange fails
  return NextResponse.redirect(new URL('/auth/login?error=oauth_exchange_failed', origin).toString());
}
