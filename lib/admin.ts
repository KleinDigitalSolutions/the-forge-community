import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Admin Authorization Helpers
 *
 * Centralized admin checks for API routes
 */

/**
 * Checks if the current session user is an admin
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error('ADMIN_EMAIL not configured in environment');
    return false;
  }

  return session?.user?.email === adminEmail;
}

/**
 * Requires admin access - returns 403 response if not admin
 * Use in API routes: const adminCheck = await requireAdmin(); if (adminCheck) return adminCheck;
 *
 * @returns NextResponse with 403 if not admin, null if authorized
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return NextResponse.json(
      { error: 'Admin configuration missing' },
      { status: 500 }
    );
  }

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (session.user.email !== adminEmail) {
    return NextResponse.json(
      { error: 'Admin access required - Unauthorized' },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Alternative: Returns admin status and session
 * @returns { isAdmin: boolean, session: Session | null }
 */
export async function getAdminStatus() {
  const session = await auth();
  const adminCheck = await isAdmin();

  return {
    isAdmin: adminCheck,
    session,
    email: session?.user?.email || null
  };
}
