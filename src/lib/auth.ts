// Authentication system with admin/user roles
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
}

// Admin emails that get admin role
const ADMIN_EMAILS = [
  'thelegendofhend@gmail.com',
  'nikodola@gmail.com'
];

/**
 * Hash a password
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Checks if an email should get admin role
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Creates or updates a user account
 */
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

    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    let user: User;

    if (querySnapshot.empty) {
      // Create new user (omit undefined fields - Firestore rejects undefined)
      const payload: {
        email: string;
        name: string;
        role?: string;
        displayName?: string;
        photoURL?: string | null;
        createdAt: ReturnType<typeof serverTimestamp>;
        lastLoginAt: ReturnType<typeof serverTimestamp>;
        authUid?: string;
        purchases?: number;
        firstName?: string;
        lastName?: string;
        password?: string;
      } = {
        email,
        name: userData.name ?? email.split('@')[0],
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

      user = {
        id: newUserRef.id,
        email,
        name: payload.name,
        authUid: payload.authUid ?? undefined,
        role: (payload.role || 'user') as 'admin' | 'user',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        purchases: 0
      };
    } else {
      // Update existing user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLoginAt: serverTimestamp(),
        ipAddress: userData.ipAddress
      });
      user = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        authUid: userData.authUid,
        role: userData.role,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: new Date(),
        ipAddress: userData.ipAddress,
        purchases: userData.purchases || 0
      };
    }

    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create/update user account');
  }
}

/**
 * Gets user from session cookie (Firebase Auth)
 */
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

    // Get user from Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // User might not be in Firestore yet - create them
      try {
        const newUser = await createOrUpdateUser({
          email: email,
          name: decodedClaims.name || email.split('@')[0],
          authUid: decodedClaims.uid,
        });
        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          authUid: decodedClaims.uid, // Include authUid for Storage rules
          role: newUser.role,
          createdAt: newUser.createdAt,
          lastLoginAt: newUser.lastLoginAt,
          purchases: newUser.purchases || 0
        };
      } catch (error) {
        console.error('Error creating user in Firestore:', error);
        // Fallback: return with Firestore ID placeholder (will need to match later)
        return {
          id: decodedClaims.uid, // Use auth UID as fallback
          email: email,
          name: decodedClaims.name || email.split('@')[0],
          authUid: decodedClaims.uid, // Include authUid for Storage rules
          role: isAdminEmail(email) ? 'admin' : 'user',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          purchases: 0
        };
      }
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Ensure authUid is stored
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
      id: userDoc.id, // Use Firestore document ID for consistency
      email: userData.email,
      name: userData.name,
      authUid: userData.authUid || decodedClaims.uid, // Include authUid for Storage rules
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

/**
 * Gets all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        purchases: data.purchases || 0
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}

/**
 * Deletes a user account (admin only)
 */
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

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: {
  email: string;
  password: string;
  ipAddress?: string;
}): Promise<User> {
  try {
    const email = credentials.email.toLowerCase();
    
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Invalid email or password');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user has a password (not Google OAuth user)
    if (!userData.password) {
      throw new Error('Please use Google sign-in for this account');
    }

    // Verify password
    const isValidPassword = await verifyPassword(credentials.password, userData.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
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

/**
 * Updates user purchase count
 */
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
