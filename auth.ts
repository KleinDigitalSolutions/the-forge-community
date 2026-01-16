import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Resend from 'next-auth/providers/resend';
import { getFounderByEmail } from './lib/notion';
import { sql } from '@vercel/postgres';
import PostgresAdapter from '@auth/pg-adapter';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(sql),
  debug: true, // Hilft uns Fehler in Vercel Logs zu sehen
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // WICHTIG: Nutze 'onboarding@resend.dev' solange deine Domain nicht verifiziert ist!
      // Ändere dies erst, wenn du DNS Records bei Resend gesetzt hast.
      from: 'THE FORGE <onboarding@resend.dev>',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        console.log(`Checking access for: ${user.email}`);
        // Gatekeeper: Check Notion
        const founder = await getFounderByEmail(user.email);

        if (!founder) {
          console.log(`Access denied for ${user.email}: Not found in Notion.`);
          return false;
        }

        if (founder.status === 'inactive') {
           console.log(`Access denied for ${user.email}: Inactive.`);
           return false;
        }

        console.log(`Access granted for ${user.email}`);
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    ...authConfig.callbacks,
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET, // Explizit setzen
});