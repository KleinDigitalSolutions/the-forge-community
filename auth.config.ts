import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login', // Redirect back to login on error
    verifyRequest: '/login?verify=true', // Used for magic links
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = 
        nextUrl.pathname === '/' || 
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/legal') || 
        nextUrl.pathname.startsWith('/api/founders/add') || // Allow application submission
        nextUrl.pathname.startsWith('/api/chat'); // Allow public chat

      if (isPublicRoute) {
        // Redirect logged-in users away from login page to dashboard
        if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }
      
      // Protect all other routes
      return isLoggedIn;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      // Add custom claims to session here if needed (e.g. founder status)
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
