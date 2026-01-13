import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export interface User {
  id: string;
  email: string;
  name: string;
  authUid?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLoginAt: Date;
  ipAddress?: string;
  purchases?: number;
  totalSpent?: number;
}

const ADMIN_EMAILS = ['thelegendofhendo@gmail.com', 'nikodola@gmail.com'];
const SALT_ROUNDS = 12;

// ============================================================================
// Password Management
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// ============================================================================
// User Role Management
// ============================================================================

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================================================
// User CRUD Operations
// ============================================================================

export async function createOrUpdateUser(userData: {
  email: string;
  name: string;
  authUid?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  ipAddress?: string;
}): Promise<User> {
  try {
    const email = userData.email.toLowerCase();
    const isAdmin = isAdminEmail(email);

    // Use Admin SDK on the server to avoid Firestore rules / permission-denied on refresh.
    const adminDb = firebaseAdmin.firestore();
    const querySnapshot = await adminDb.collection('users').where('email', '==', email).limit(1).get();

    if (querySnapshot.empty) {
      return await createNewUser(userData, isAdmin);
    } else {
      return await updateExistingUser(querySnapshot.docs[0], userData);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create/update user account');
  }
}

async function createNewUser(userData: {
  email: string;
  name: string;
  authUid?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}, isAdmin: boolean): Promise<User> {
  const adminDb = firebaseAdmin.firestore();
  const payload: Record<string, unknown> = {
    email: userData.email,
    name: userData.name ?? userData.email.split('@')[0],
    authUid: userData.authUid,
    role: isAdmin ? 'admin' : 'user',
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    purchases: 0
  };

  if (userData.firstName) payload.firstName = userData.firstName;
  if (userData.lastName) payload.lastName = userData.lastName;
  if (userData.password) payload.password = await hashPassword(userData.password);

  const newUserRef = await adminDb.collection('users').add(payload);

  return {
    id: newUserRef.id,
    email: payload.email as string,
    name: payload.name as string,
    authUid: payload.authUid as string | undefined,
    role: payload.role as 'admin' | 'user',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    purchases: 0
  };
}

async function updateExistingUser(
  userDoc: { id: string; data: () => Record<string, unknown> },
  userData: { ipAddress?: string; authUid?: string; name?: string; firstName?: string; lastName?: string }
): Promise<User> {
  const adminDb = firebaseAdmin.firestore();
  const docData = userDoc.data();
  await adminDb.collection('users').doc(userDoc.id).set(
    {
      lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      ipAddress: userData.ipAddress,
      // Opportunistically backfill fields
      ...(userData.authUid ? { authUid: userData.authUid } : {}),
      ...(userData.name ? { name: userData.name } : {}),
      ...(userData.firstName ? { firstName: userData.firstName } : {}),
      ...(userData.lastName ? { lastName: userData.lastName } : {}),
    },
    { merge: true }
  );

  return {
    id: userDoc.id,
    email: String(docData.email || ''),
    name: String(docData.name || ''),
    authUid: docData.authUid as string | undefined,
    role: (docData.role as 'admin' | 'user') || 'user',
    createdAt: (docData.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    lastLoginAt: new Date(),
    ipAddress: docData.ipAddress as string | undefined,
    purchases: Number(docData.purchases) || 0
  };
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const adminDb = firebaseAdmin.firestore();
    const querySnapshot = await adminDb.collection('users').get();
    
    // Get all purchases to calculate total spent per user
    const purchasesSnapshot = await adminDb.collection('purchases').get();
    
    // Group purchases by userId and calculate total spent
    const userSpending = new Map<string, { count: number; total: number }>();
    purchasesSnapshot.docs.forEach(purchaseDoc => {
      const data = purchaseDoc.data();
      const userId = data.userId;
      const price = data.price || 0;
      
      if (userId) {
        const current = userSpending.get(userId) || { count: 0, total: 0 };
        userSpending.set(userId, {
          count: current.count + 1,
          total: current.total + price
        });
      }
    });

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const spending = userSpending.get(doc.id) || { count: 0, total: 0 };
      
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        purchases: spending.count,
        totalSpent: spending.total
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const adminDb = firebaseAdmin.firestore();
    await adminDb.collection('users').doc(userId).set(
      {
        deleted: true,
        deletedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

// ============================================================================
// Authentication Operations
// ============================================================================

export async function authenticateUser(credentials: {
  email: string;
  password: string;
  ipAddress?: string;
}): Promise<User> {
  try {
    const email = credentials.email.toLowerCase();
    const adminDb = firebaseAdmin.firestore();
    const querySnapshot = await adminDb.collection('users').where('email', '==', email).limit(1).get();

    if (querySnapshot.empty) {
      throw new Error('Invalid email or password');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.password) {
      throw new Error('Please use Google sign-in for this account');
    }

    const isValidPassword = await verifyPassword(credentials.password, userData.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    await adminDb.collection('users').doc(userDoc.id).set(
      {
        lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        ipAddress: credentials.ipAddress,
      },
      { merge: true }
    );

    return {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLoginAt: new Date(),
      ipAddress: userData.ipAddress,
      purchases: userData.purchases || 0
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error(error instanceof Error ? error.message : 'Authentication failed');
  }
}

export async function getUserFromSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('fb_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email?.toLowerCase() || '';
    const uid = decodedClaims.uid || '';

    if (!email || !uid) {
      return null;
    }

    // IMPORTANT: use Admin SDK Firestore here (client SDK is blocked by your Firestore rules on server)
    const adminDb = firebaseAdmin.firestore();

    // Prefer authUid match (stable) and fall back to email.
    let userSnap = await adminDb.collection('users').where('authUid', '==', uid).limit(1).get();
    if (userSnap.empty) {
      userSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    }

    if (userSnap.empty) {
      // Create minimal profile (needed for engagement tracking, purchases, etc.)
      const name = decodedClaims.name || email.split('@')[0];
      const role = isAdminEmail(email) ? 'admin' : 'user';
      const ref = await adminDb.collection('users').add({
        email,
        name,
        authUid: uid,
        role,
        purchases: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        ipAddress: 'firebase',
      });

      return {
        id: ref.id,
        email,
        name,
        authUid: uid,
        role,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        purchases: 0,
      };
    }

    const docSnap = userSnap.docs[0];
    const data = docSnap.data() as Record<string, unknown>;
    const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date();
    const lastLoginAt = (data.lastLoginAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date();

    // Ensure authUid is stored for future lookups
    if (!data.authUid && uid) {
      try {
        await adminDb.collection('users').doc(docSnap.id).set({ authUid: uid }, { merge: true });
      } catch (e) {
        console.warn('Failed to backfill authUid:', e);
      }
    }

    return {
      id: docSnap.id,
      email: String(data.email || email),
      name: String(data.name || decodedClaims.name || email.split('@')[0]),
      authUid: String(data.authUid || uid),
      role: (data.role as 'admin' | 'user') || (isAdminEmail(email) ? 'admin' : 'user'),
      createdAt,
      lastLoginAt,
      ipAddress: data.ipAddress as string | undefined,
      purchases: Number(data.purchases) || 0,
      totalSpent: Number(data.totalSpent) || undefined,
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

export async function updateUserPurchases(userId: string, increment: number = 1): Promise<void> {
  try {
    const adminDb = firebaseAdmin.firestore();
    const ref = adminDb.collection('users').doc(userId);
    const snap = await ref.get();
    if (!snap.exists) return;

    const data = snap.data() as Record<string, unknown>;
    const currentPurchases = typeof data.purchases === 'number' ? data.purchases : Number(data.purchases || 0);
    await ref.set({ purchases: currentPurchases + increment }, { merge: true });
  } catch (error) {
    console.error('Error updating user purchases:', error);
    throw new Error('Failed to update user purchases');
  }
}

