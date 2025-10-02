// Firebase-Shopify synchronization utilities
import { db } from '@/lib/firebase';
import { createCustomer } from '@/lib/shopify/admin';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

/**
 * Generates a secure random password for Firebase users synced to Shopify
 */
function generateSecurePassword(): string {
  // Generate a secure random password with letters, numbers, and special characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char

  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Creates a Shopify customer from Firebase user data
 */
export async function createShopifyCustomerFromFirebase(firebaseUser: {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}) {
  try {
    // Generate a secure random password for the user
    const password = generateSecurePassword();

    // Create customer in Shopify WITHOUT email verification
    const shopifyCustomer = await createCustomer({
      email: firebaseUser.email,
      first_name: firebaseUser.firstName || 'Customer',
      last_name: firebaseUser.lastName || 'User',
      password: password,
      accepts_marketing: true, // Since they signed up for newsletter
      send_email_welcome: false // NO welcome email from Shopify - Firebase handles verification
    });

    console.log('Created Shopify customer from Firebase user:', shopifyCustomer.id);
    return shopifyCustomer;
  } catch (error) {
    console.error('Failed to create Shopify customer from Firebase user:', error);
    throw error;
  }
}

/**
 * Creates a Firebase user from Shopify customer data
 */
export async function createFirebaseUserFromShopify(shopifyCustomer: {
  email: string;
  first_name: string;
  last_name: string;
  id: string;
}) {
  try {
    // Check if user already exists in Firebase
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', shopifyCustomer.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('Firebase user already exists for Shopify customer:', shopifyCustomer.email);
      return querySnapshot.docs[0].data();
    }

    // Create user in Firebase
    const firebaseUser = await addDoc(collection(db, 'users'), {
      email: shopifyCustomer.email,
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      shopifyCustomerId: shopifyCustomer.id,
      source: 'shopify',
      createdAt: serverTimestamp(),
      verified: true // Shopify customers are considered verified
    });

    console.log('Created Firebase user from Shopify customer:', firebaseUser.id);
    return firebaseUser;
  } catch (error) {
    console.error('Failed to create Firebase user from Shopify customer:', error);
    throw error;
  }
}

/**
 * Syncs a newsletter subscriber to Shopify
 * This is called when someone subscribes to the newsletter
 */
export async function syncNewsletterSubscriberToShopify(email: string, firstName?: string, lastName?: string) {
  try {
    // Check if customer already exists in Shopify (we'll handle this gracefully)
    const shopifyCustomer = await createShopifyCustomerFromFirebase({
      email,
      firstName,
      lastName,
      source: 'newsletter'
    });

    // Update the Firebase subscriber record with Shopify customer ID
    const subscribersRef = collection(db, 'subscribers');
    const q = query(subscribersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const subscriberDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'subscribers', subscriberDoc.id), {
        shopifyCustomerId: shopifyCustomer.id,
        syncedToShopify: true,
        syncedAt: serverTimestamp()
      });
    }

    return shopifyCustomer;
  } catch (error) {
    console.error('Failed to sync newsletter subscriber to Shopify:', error);
    // Don't throw error - newsletter signup should still work even if Shopify sync fails
    return null;
  }
}

/**
 * Syncs a Shopify customer to Firebase
 * This is called when someone registers through Shopify
 */
export async function syncShopifyCustomerToFirebase(shopifyCustomer: {
  email: string;
  first_name: string;
  last_name: string;
  id: string;
}) {
  try {
    const firebaseUser = await createFirebaseUserFromShopify(shopifyCustomer);
    return firebaseUser;
  } catch (error) {
    console.error('Failed to sync Shopify customer to Firebase:', error);
    // Don't throw error - Shopify registration should still work even if Firebase sync fails
    return null;
  }
}

/**
 * Generates a secure random password for Firebase users
 */
export function generateDefaultPassword(): string {
  return generateSecurePassword();
}

