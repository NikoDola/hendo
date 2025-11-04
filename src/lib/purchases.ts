// Purchase management system
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { getMusicTrack } from './music';

export interface UserPurchase {
  id: string;
  userId: string;
  trackId: string;
  trackTitle: string;
  price: number;
  zipUrl: string;
  pdfUrl: string;
  purchasedAt: Date;
  expiresAt: Date;
}

/**
 * Records a purchase in Firestore
 */
export async function recordPurchase(
  userId: string,
  trackId: string,
  trackTitle: string,
  price: number,
  zipUrl: string,
  pdfUrl: string,
  expiresAt: Date
): Promise<UserPurchase> {
  try {
    console.log('recordPurchase called with userId:', userId);
    const purchasesRef = collection(db, 'purchases');
    const purchaseData = {
      userId,
      trackId,
      trackTitle,
      price,
      zipUrl,
      pdfUrl,
      purchasedAt: serverTimestamp(),
      expiresAt,
      createdAt: serverTimestamp()
    };
    console.log('Saving purchase data:', { ...purchaseData, zipUrl: zipUrl.substring(0, 50) + '...', pdfUrl: pdfUrl.substring(0, 50) + '...' });
    
    const purchaseRef = await addDoc(purchasesRef, purchaseData);
    console.log('Purchase saved with ID:', purchaseRef.id);

    return {
      id: purchaseRef.id,
      userId,
      trackId,
      trackTitle,
      price,
      zipUrl,
      pdfUrl,
      purchasedAt: new Date(),
      expiresAt
    };
  } catch (error) {
    console.error('Error recording purchase:', error);
    throw new Error('Failed to record purchase');
  }
}

/**
 * Gets all purchases for a user
 */
export async function getUserPurchases(userId: string): Promise<UserPurchase[]> {
  try {
    console.log('getUserPurchases called with userId:', userId);
    const purchasesRef = collection(db, 'purchases');
    
    // Query without orderBy first to avoid index issues
    // We'll sort manually after fetching
    const q = query(
      purchasesRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found purchase documents:', querySnapshot.docs.length);
    
    const purchases = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const purchase = {
        id: doc.id,
        userId: data.userId,
        trackId: data.trackId,
        trackTitle: data.trackTitle,
        price: data.price,
        zipUrl: data.zipUrl,
        pdfUrl: data.pdfUrl,
        purchasedAt: data.purchasedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date()
      };
      console.log('Purchase found:', { id: purchase.id, userId: purchase.userId, trackTitle: purchase.trackTitle });
      return purchase;
    });
    
    // Sort manually by purchase date (newest first)
    purchases.sort((a, b) => {
      const dateA = a.purchasedAt.getTime();
      const dateB = b.purchasedAt.getTime();
      return dateB - dateA; // Descending
    });
    
    console.log('Returning purchases:', purchases.length);
    return purchases;
  } catch (error) {
    console.error('Error getting user purchases:', error);
    throw new Error('Failed to get user purchases');
  }
}

/**
 * Gets purchase details with full track information
 */
export async function getPurchaseWithTrack(purchaseId: string): Promise<UserPurchase & { track?: { id: string; title: string; price: number } }> {
  try {
    const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
    if (!purchaseDoc.exists()) {
      throw new Error('Purchase not found');
    }

    const data = purchaseDoc.data();
    const purchase: UserPurchase = {
      id: purchaseDoc.id,
      userId: data.userId,
      trackId: data.trackId,
      trackTitle: data.trackTitle,
      price: data.price,
      zipUrl: data.zipUrl,
      pdfUrl: data.pdfUrl,
      purchasedAt: data.purchasedAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date()
    };

    // Get full track details
    try {
      const track = await getMusicTrack(data.trackId);
      return { ...purchase, track: track || undefined };
    } catch (error) {
      console.warn('Could not fetch track details:', error);
      return purchase;
    }
  } catch (error) {
    console.error('Error getting purchase with track:', error);
    throw new Error('Failed to get purchase details');
  }
}

/**
 * Checks if user already owns a track
 */
export async function userOwnsTrack(userId: string, trackId: string): Promise<boolean> {
  try {
    const purchasesRef = collection(db, 'purchases');
    const q = query(
      purchasesRef,
      where('userId', '==', userId),
      where('trackId', '==', trackId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking track ownership:', error);
    return false;
  }
}

