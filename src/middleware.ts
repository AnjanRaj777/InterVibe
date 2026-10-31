import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect all /dashboard routes server-side
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is already authenticated, redirect away from login/signup to dashboard
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard/interview', request.url));
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
