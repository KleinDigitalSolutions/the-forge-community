import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      accountStatus?: 'ACTIVE' | 'DELETED';
      onboardingComplete?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountStatus?: 'ACTIVE' | 'DELETED';
    onboardingComplete?: boolean;
  }
}
