import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const allowedPaths = ['/dashboard', '/login', '/legal'];

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest) => {
  const session = req.auth;
  if (!session?.user) return NextResponse.next();

  const pathname = req.nextUrl.pathname;
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));
  const onboardingComplete = session.user.onboardingComplete === true;

  if (onboardingComplete || isAllowed) {
    return NextResponse.next();
  }

  const redirectUrl = new URL('/dashboard', req.nextUrl);
  redirectUrl.searchParams.set('onboarding', 'required');
  return NextResponse.redirect(redirectUrl);
});

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)).*)',
  ],
};
