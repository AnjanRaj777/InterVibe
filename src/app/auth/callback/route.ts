import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles OAuth callback redirects from Supabase Auth for both GitHub and Google.
 * Exchange authorization code for a session and redirects to the target destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard/interview';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Sync GitHub / Google OAuth metadata to public.profiles if needed
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileName = 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.user_metadata?.user_name || 
            user.email?.split('@')[0] || 
            'Developer';

          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email || '',
            full_name: profileName,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      } catch (profileErr) {
        console.warn('[OAuth Callback] Notice updating profile from OAuth:', profileErr);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    console.error('[OAuth Callback] Exchange error:', error.message);
  }

  // Return the user to login with an error flag if exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_exchange_failed`);
}
