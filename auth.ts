import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Resend from 'next-auth/providers/resend';
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

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  debug: true,
  providers: [
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
    }),
  ],
  callbacks: {
    // Open Access: No signIn checks required. Everyone can join.
    ...authConfig.callbacks,
  },
  events: {
    async createUser({ user }) {
      if (user?.id) {
        await assignFounderNumberIfMissing(user.id);
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET, // Explizit setzen
});
