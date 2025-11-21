import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

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

const ADMIN_EMAILS = ['thelegendofhend@gmail.com', 'nikodola@gmail.com'];
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

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
  const payload: Record<string, unknown> = {
    email: userData.email,
    name: userData.name ?? userData.email.split('@')[0],
    authUid: userData.authUid,
    role: isAdmin ? 'admin' : 'user',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    purchases: 0
  };

  if (userData.firstName) payload.firstName = userData.firstName;
  if (userData.lastName) payload.lastName = userData.lastName;
  if (userData.password) payload.password = await hashPassword(userData.password);

  const newUserRef = await addDoc(collection(db, 'users'), payload);

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

async function updateExistingUser(userDoc: { id: string; data: () => Record<string, unknown> }, userData: { ipAddress?: string }): Promise<User> {
  const docData = userDoc.data();
  await updateDoc(doc(db, 'users', userDoc.id), {
    lastLoginAt: serverTimestamp(),
    ipAddress: userData.ipAddress
  });

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
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // Get all purchases to calculate total spent per user
    const purchasesRef = collection(db, 'purchases');
    const purchasesSnapshot = await getDocs(purchasesRef);
    
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
    await updateDoc(doc(db, 'users', userId), {
      deleted: true,
      deletedAt: serverTimestamp()
    });
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

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

    await updateDoc(doc(db, 'users', userDoc.id), {
      lastLoginAt: serverTimestamp(),
      ipAddress: credentials.ipAddress
    });

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
    const { firebaseAdmin } = await import('@/lib/firebaseAdmin');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('fb_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email?.toLowerCase() || '';

    if (!email) {
      return null;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      try {
        const newUser = await createOrUpdateUser({
          email: email,
          name: decodedClaims.name || email.split('@')[0],
          authUid: decodedClaims.uid,
        });
        return {
          ...newUser,
          authUid: decodedClaims.uid,
        };
      } catch (error) {
        console.error('Error creating user in Firestore:', error);
        return {
          id: decodedClaims.uid,
          email: email,
          name: decodedClaims.name || email.split('@')[0],
          authUid: decodedClaims.uid,
          role: isAdminEmail(email) ? 'admin' : 'user',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          purchases: 0
        };
      }
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (!userData.authUid && decodedClaims.uid) {
      try {
        await updateDoc(doc(db, 'users', userDoc.id), {
          authUid: decodedClaims.uid
        });
      } catch (error) {
        console.warn('Failed to update authUid:', error);
      }
    }
    
    return {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      authUid: userData.authUid || decodedClaims.uid,
      role: userData.role || (isAdminEmail(email) ? 'admin' : 'user'),
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      ipAddress: userData.ipAddress,
      purchases: userData.purchases || 0
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

export async function updateUserPurchases(userId: string, increment: number = 1): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    
    if (!userDoc.empty) {
      const currentPurchases = userDoc.docs[0].data().purchases || 0;
      await updateDoc(userRef, {
        purchases: currentPurchases + increment
      });
    }
  } catch (error) {
    console.error('Error updating user purchases:', error);
    throw new Error('Failed to update user purchases');
  }
}

