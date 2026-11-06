import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Handle explicit signout flag (?signout=1 or ?logout=1)
  const isExplicitSignOut = searchParams.has('signout') || searchParams.has('logout');
  if (isExplicitSignOut) {
    // Delete all sb-* auth session cookies from response
    const allCookies = request.cookies.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
        response.cookies.delete(cookie.name);
      }
    }
    // If an unauthenticated or signing out user is on /dashboard, bounce to /auth/login
    if (pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/auth/login?signout=1', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // If Supabase email confirmation or OAuth falls back to the root Site URL (/?code=... or /?token_hash=...),
  // forward the request to /auth/callback so the session is exchanged properly.
  if (
    pathname === '/' &&
    (searchParams.has('code') || (searchParams.has('token_hash') && searchParams.has('type')))
  ) {
    const callbackUrl = new URL('/auth/callback', request.url);
    searchParams.forEach((val, key) => callbackUrl.searchParams.set(key, val));
    return NextResponse.redirect(callbackUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase keys are not configured, allow request through to fallback UI
  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your_anon_key_here') {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect all /dashboard routes server-side
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('next', pathname === '/dashboard' ? '/dashboard/overview' : pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/overview', request.url));
    }
  }

  // If user is already authenticated, redirect away from login/signup to dashboard
  // unless they explicitly opened the account switcher (?switch=1) or signed out
  const isSwitchingAccount = searchParams.get('switch') === '1';
  if (
    user &&
    !isSwitchingAccount &&
    !isExplicitSignOut &&
    (pathname === '/auth/login' ||
      pathname === '/auth/signup' ||
      pathname === '/login' ||
      pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (avatars, images, logos, .glb 3D models)
     */
    '/((?!_next/static|_next/image|favicon.ico|avatars/|images/|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb)$).*)',
  ],
};
