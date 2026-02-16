import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Always allow login page, auth callbacks, static assets, API routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return response;
  }

  // Refresh session (important for cookie persistence)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
