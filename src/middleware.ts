import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

const protectedRoutes = ['/feed', '/search', '/profile', '/messages', '/employer', '/dashboard', '/notifications', '/connections'];
const authRoutes = ['/auth/login', '/auth/signup', '/auth/verify'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAuthRoute) return NextResponse.next();

  const { supabase, response } = createMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/feed/:path*', '/search/:path*', '/profile/:path*', '/messages/:path*', '/employer/:path*', '/dashboard/:path*', '/notifications/:path*', '/connections/:path*', '/auth/:path*'],
};
