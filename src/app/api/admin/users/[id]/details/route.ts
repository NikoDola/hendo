import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAdminEmail } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = decoded.email?.toLowerCase() || '';
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    // Get user details
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const user = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: userData.createdAt?.toDate().toISOString() || new Date().toISOString(),
      lastLoginAt: userData.lastLoginAt?.toDate().toISOString() || new Date().toISOString(),
      ipAddress: userData.ipAddress,
    };

    // Get user purchases
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('userId', '==', userId));
    const purchasesSnapshot = await getDocs(q);

    const purchases = purchasesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        trackId: data.trackId,
        trackTitle: data.trackTitle,
        price: data.price,
        purchasedAt: data.purchasedAt?.toDate().toISOString() || data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    // Sort by purchase date (newest first)
    purchases.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

    return NextResponse.json({ user, purchases });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}

