// Admin authentication system
import { cookies } from 'next/headers';
import { isAdminEmail } from '@/lib/auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  createdAt: Date;
  lastLoginAt: Date;
}

/**
 * Checks if an email is authorized for admin access
 * Admin emails from auth.ts or emails ending with @nikodola.com
 */
export function isAuthorizedAdmin(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return isAdminEmail(lowerEmail) || lowerEmail.endsWith('@nikodola.com');
}

/**
 * Authenticates admin user and creates session
 */
export async function authenticateAdmin(email: string, name?: string): Promise<AdminUser | null> {
  if (!isAuthorizedAdmin(email)) {
    throw new Error('Unauthorized: Only @nikodola.com emails are allowed');
  }

  try {
    const db = firebaseAdmin.firestore();
    const querySnapshot = await db
      .collection('admins')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    let adminUser: AdminUser;

    if (querySnapshot.empty) {
      // Create new admin user
      const newAdminRef = await db.collection('admins').add({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'admin',
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

      adminUser = {
        id: newAdminRef.id,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
    } else {
      // Update last login time
      const adminDoc = querySnapshot.docs[0];
      const data = adminDoc.data() as Record<string, unknown>;
      adminUser = {
        id: adminDoc.id,
        email: String(data.email || email.toLowerCase()),
        name: String(data.name || name || email.split('@')[0]),
        role: (data.role as 'admin' | 'super_admin') || 'admin',
        createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
        lastLoginAt: new Date()
      };
    }

    return adminUser;
  } catch (error) {
    console.error('Admin authentication error:', error);
    throw new Error('Failed to authenticate admin user');
  }
}

/**
 * Gets admin user from session cookie
 */
export async function getAdminFromSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('fb_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email?.toLowerCase() || '';

    if (!email || !isAuthorizedAdmin(email)) {
      return null;
    }

    const db = firebaseAdmin.firestore();
    const querySnapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      // Admin not in admins collection, but has valid session and @nikodola.com email
      // Return a basic admin object
      return {
        id: decodedClaims.uid,
        email: email,
        name: decodedClaims.name || email.split('@')[0],
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date()
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
      lastLoginAt: (data.lastLoginAt as { toDate?: () => Date })?.toDate?.() || new Date()
    };
  } catch (error) {
    console.error('Error getting admin from session:', error);
    return null;
  }
}

/**
 * Creates admin session cookie
 */
export function createAdminSession(): void {
  // This will be handled by the API route
}

/**
 * Clears admin session
 */
export function clearAdminSession(): void {
  // This will be handled by the API route
}
