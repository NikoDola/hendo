// Admin authentication helpers (server-side).
// Reads the Firebase session cookie and resolves the requesting admin's profile.
import { cookies } from 'next/headers';
import { isAuthorizedAdmin } from '@/lib/auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  createdAt: Date;
  lastLoginAt: Date;
}

export { isAuthorizedAdmin };

/**
 * Resolves the admin user from the current request's session cookie.
 * Returns null when there's no session or the user isn't on the admin allowlist.
 */
export async function getAdminFromSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('fb_session')?.value;
    if (!sessionCookie) return null;

    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email?.toLowerCase() || '';
    if (!email || !isAuthorizedAdmin(email)) return null;

    const db = firebaseAdmin.firestore();
    const querySnapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return {
        id: decodedClaims.uid,
        email,
        name: decodedClaims.name || email.split('@')[0],
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    }

    const adminDoc = querySnapshot.docs[0];
    const data = adminDoc.data() as Record<string, unknown>;
    return {
      id: adminDoc.id,
      email: String(data.email || email),
      name: String(data.name || decodedClaims.name || email.split('@')[0]),
      role: (data.role as 'admin' | 'super_admin') || 'admin',
      createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
      lastLoginAt: (data.lastLoginAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Error getting admin from session:', error);
    return null;
  }
}
