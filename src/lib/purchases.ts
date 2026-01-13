// Purchase management system
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { getMusicTrackServer } from '@/lib/music-server';

export interface UserPurchase {
  id: string;
  userId: string;
  trackId: string;
  trackTitle: string;
  price: number;
  zipUrl: string;
  pdfUrl: string;
  audioFileUrl?: string;
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
    const db = firebaseAdmin.firestore();
    const purchasesRef = db.collection('purchases');
    const purchaseData = {
      userId,
      trackId,
      trackTitle,
      price,
      zipUrl,
      pdfUrl,
      purchasedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    };
    
    const purchaseRef = await purchasesRef.add(purchaseData);

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
    const db = firebaseAdmin.firestore();
    const querySnapshot = await db
      .collection('purchases')
      .where('userId', '==', userId)
      .get();

    const purchases = querySnapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const purchase = {
        id: d.id,
        userId: String(data.userId || ''),
        trackId: String(data.trackId || ''),
        trackTitle: String(data.trackTitle || ''),
        price: typeof data.price === 'number' ? data.price : Number(data.price || 0),
        zipUrl: String(data.zipUrl || ''),
        pdfUrl: String(data.pdfUrl || ''),
        purchasedAt: (data.purchasedAt as { toDate?: () => Date } | undefined)?.toDate?.()
          || (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.()
          || new Date(),
        expiresAt: (data.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date()
      };
      return purchase;
    });

    // Enrich purchases with track audio URL so the user dashboard can play/pause directly.
    // We batch-fetch track docs to avoid N+1.
    const uniqueTrackIds = Array.from(
      new Set(
        purchases
          .map((p) => p.trackId)
          .filter((id) => typeof id === 'string' && id.length > 0)
      )
    );

    if (uniqueTrackIds.length > 0) {
      const refs = uniqueTrackIds.map((id) => db.collection('music').doc(id));
      const snaps = await db.getAll(...refs);
      const audioByTrackId: Record<string, string> = {};

      for (const s of snaps) {
        if (!s.exists) continue;
        const data = s.data() as Record<string, unknown>;
        audioByTrackId[s.id] = String(data.audioFileUrl || '');
      }

      for (const p of purchases) {
        (p as UserPurchase).audioFileUrl = audioByTrackId[p.trackId] || '';
      }
    }
    
    // Sort manually by purchase date (newest first)
    purchases.sort((a, b) => {
      const dateA = a.purchasedAt.getTime();
      const dateB = b.purchasedAt.getTime();
      return dateB - dateA; // Descending
    });
    
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
    const db = firebaseAdmin.firestore();
    const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();
    if (!purchaseDoc.exists) {
      throw new Error('Purchase not found');
    }

    const data = purchaseDoc.data() as Record<string, unknown>;
    const purchase: UserPurchase = {
      id: purchaseDoc.id,
      userId: String(data.userId || ''),
      trackId: String(data.trackId || ''),
      trackTitle: String(data.trackTitle || ''),
      price: typeof data.price === 'number' ? data.price : Number(data.price || 0),
      zipUrl: String(data.zipUrl || ''),
      pdfUrl: String(data.pdfUrl || ''),
      purchasedAt: (data.purchasedAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date(),
      expiresAt: (data.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date()
    };

    // Get full track details
    try {
      const track = await getMusicTrackServer(String(data.trackId || ''));
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
    const db = firebaseAdmin.firestore();
    const querySnapshot = await db
      .collection('purchases')
      .where('userId', '==', userId)
      .where('trackId', '==', trackId)
      .limit(1)
      .get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking track ownership:', error);
    return false;
  }
}

