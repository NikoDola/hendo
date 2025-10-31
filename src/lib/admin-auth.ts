// Admin authentication system
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';

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
 * Only emails ending with @nikodola.com are allowed
 */
export function isAuthorizedAdmin(email: string): boolean {
  return email.toLowerCase().endsWith('@nikodola.com');
}

/**
 * Authenticates admin user and creates session
 */
export async function authenticateAdmin(email: string, name?: string): Promise<AdminUser | null> {
  if (!isAuthorizedAdmin(email)) {
    throw new Error('Unauthorized: Only @nikodola.com emails are allowed');
  }

  try {
    // Check if admin already exists
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    let adminUser: AdminUser;

    if (querySnapshot.empty) {
      // Create new admin user
      const newAdminRef = await addDoc(collection(db, 'admins'), {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
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
      adminUser = {
        id: adminDoc.id,
        ...adminDoc.data(),
        createdAt: adminDoc.data().createdAt?.toDate() || new Date(),
        lastLoginAt: new Date()
      } as AdminUser;
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
    const adminEmail = cookieStore.get('admin_email')?.value;

    if (!adminEmail || !isAuthorizedAdmin(adminEmail)) {
      return null;
    }

    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('email', '==', adminEmail.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const adminDoc = querySnapshot.docs[0];
    return {
      id: adminDoc.id,
      ...adminDoc.data(),
      createdAt: adminDoc.data().createdAt?.toDate() || new Date(),
      lastLoginAt: adminDoc.data().lastLoginAt?.toDate() || new Date()
    } as AdminUser;
  } catch (error) {
    console.error('Error getting admin from session:', error);
    return null;
  }
}

/**
 * Creates admin session cookie
 */
export function createAdminSession(admin: AdminUser): void {
  // This will be handled by the API route
}

/**
 * Clears admin session
 */
export function clearAdminSession(): void {
  // This will be handled by the API route
}
