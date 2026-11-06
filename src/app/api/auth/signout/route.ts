import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rposcxtwctvcegwryvua.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.warn('[SignOut API] Supabase signOut notice:', err);
  }

  const res = NextResponse.json({ ok: true });

  // Delete all sb-* and auth session cookies from response
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
      res.cookies.delete(cookie.name);
      try {
        cookieStore.delete(cookie.name);
      } catch {
        // ignore in server component context
      }
    }
  }

  return res;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rposcxtwctvcegwryvua.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.warn('[SignOut API] Supabase signOut notice:', err);
  }

  const url = new URL('/auth/login?signout=1', req.url);
  const res = NextResponse.redirect(url);

  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
      res.cookies.delete(cookie.name);
      try {
        cookieStore.delete(cookie.name);
      } catch {
        // ignore
      }
    }
  }

  return res;
}
