import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all routes except static assets, public legal pages, and specific public APIs
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/founders/add|api/chat|api/debug-env).*)'],
};
