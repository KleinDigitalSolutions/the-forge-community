import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Resend from 'next-auth/providers/resend';
import { getFounderByEmail } from './lib/notion';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  debug: true, // Hilft uns Fehler in Vercel Logs zu sehen
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: 'STAKE & SCALE <info@stakeandscale.de>',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        console.log(`Checking access for: ${user.email}`);

        // 1. Check if user already exists (Standard Login)
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        if (existingUser) return true;

        // 2. Check if applicant is approved in local DB (First Registration)
        const application = await prisma.founderApplication.findUnique({
          where: { email: user.email }
        });

        if (application && application.status === 'APPROVED') {
          console.log(`Access granted for applicant: ${user.email}`);
          return true; 
        }

        // 3. Fallback: Gatekeeper Check Notion (Legacy)
        const founder = await getFounderByEmail(user.email);

        if (founder && founder.status === 'active') {
           console.log(`Access granted via Notion for: ${user.email}`);
           return true;
        }

        console.log(`Access denied for ${user.email}: Not approved.`);
        return false;
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