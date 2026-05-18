import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = decoded.email?.toLowerCase() || '';
    if (!isAuthorizedAdmin(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const db = firebaseAdmin.firestore();

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const createdAt = (userData.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
    const lastLoginAt = (userData.lastLoginAt as { toDate?: () => Date } | undefined)?.toDate?.();

    const user = {
      id: userDoc.id,
      email: String(userData.email || ''),
      name: String(userData.name || ''),
      role: String(userData.role || 'user'),
      createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
      lastLoginAt: lastLoginAt ? lastLoginAt.toISOString() : new Date().toISOString(),
      ipAddress: userData.ipAddress as string | undefined,
    };

    const purchasesSnap = await db
      .collection('purchases')
      .where('userId', '==', userId)
      .get();

    const purchases = purchasesSnap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const purchasedAt =
          (data.purchasedAt as { toDate?: () => Date } | undefined)?.toDate?.() ||
          (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() ||
          new Date();
        return {
          id: d.id,
          trackId: String(data.trackId || ''),
          trackTitle: String(data.trackTitle || ''),
          price: typeof data.price === 'number' ? data.price : Number(data.price || 0),
          purchasedAt: purchasedAt.toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      );

    return NextResponse.json({ user, purchases });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}
