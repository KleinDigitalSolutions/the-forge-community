import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Resend from 'next-auth/providers/resend';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Resend as ResendClient } from 'resend';
import { assignFounderNumberIfMissing } from '@/lib/founder-number';

const resendClient = new ResendClient(process.env.AUTH_RESEND_KEY);
const resendFrom =
  process.env.AUTH_RESEND_FROM ||
  (process.env.NODE_ENV === 'production'
    ? 'STAKE & SCALE <info@stakeandscale.de>'
    : 'onboarding@resend.dev');

const providers = [
  Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: resendFrom,
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          await resendClient.emails.send({
            from: 'STAKE & SCALE <info@stakeandscale.de>',
            to: email,
            subject: 'Dein Login Link für STAKE & SCALE',
            html: `
              <body style="background: #000; color: #fff; font-family: sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 10px; padding: 40px; text-align: center;">
                  <h1 style="color: #D4AF37; margin-bottom: 20px;">Willkommen zurück.</h1>
                  <p style="color: #ccc; margin-bottom: 30px;">Klicke auf den Button, um dich sicher einzuloggen.</p>
                  <a href="${url}" style="background: #D4AF37; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Jetzt einloggen
                  </a>
                  <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    Falls du diesen Login nicht angefordert hast, kannst du diese Email ignorieren.
                  </p>
                </div>
              </body>
            `,
            text: `Login Link: ${url}`,
          });
          console.log('Verification email sent to:', email);
        } catch (error) {
          console.error('Failed to send verification email:', error);
          throw new Error('Failed to send verification email');
        }
      },
    })
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  providers,
  callbacks: {
    // Open Access: No signIn checks required. Everyone can join.
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.email) return false;
      const account = await prisma.user.findUnique({
        where: { email: user.email },
        select: { accountStatus: true }
      });
      if (account?.accountStatus === 'DELETED') return false;
      return true;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      const account = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { accountStatus: true, onboardingComplete: true }
      });
      token.accountStatus = account?.accountStatus ?? 'ACTIVE';
      token.onboardingComplete = account?.onboardingComplete ?? false;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        const accountStatus =
          (token as { accountStatus?: 'ACTIVE' | 'DELETED' }).accountStatus ?? 'ACTIVE';
        session.user.accountStatus = accountStatus;
        session.user.onboardingComplete =
          (token as { onboardingComplete?: boolean }).onboardingComplete ?? false;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      if (user?.id) {
        await assignFounderNumberIfMissing(user.id);
        const initialCreditsRaw = Number.parseInt(process.env.INITIAL_CREDITS ?? '0', 10);
        const initialCredits = Number.isFinite(initialCreditsRaw)
          ? Math.max(0, initialCreditsRaw)
          : 0;
        await prisma.user.update({
          where: { id: user.id },
          data: { credits: initialCredits }
        });
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET, // Explizit setzen
});
