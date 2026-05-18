import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET() {
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

    const db = firebaseAdmin.firestore();

    // Aggregate spend per userId from the purchases collection.
    const purchasesSnap = await db.collection('purchases').get();
    const userSpending = new Map<string, { count: number; total: number }>();
    purchasesSnap.docs.forEach((p) => {
      const data = p.data() as Record<string, unknown>;
      const userId = String(data.userId || '');
      const price = typeof data.price === 'number' ? data.price : Number(data.price || 0);
      if (!userId) return;
      const current = userSpending.get(userId) || { count: 0, total: 0 };
      userSpending.set(userId, {
        count: current.count + 1,
        total: current.total + (Number.isFinite(price) ? price : 0),
      });
    });

    // Return ONLY users that exist in Firestore. We intentionally do NOT
    // auto-create user docs from Firebase Auth here — that previously
    // auto-assigned admin role to anyone matching the allowlist on a GET.
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const spending = userSpending.get(d.id) || { count: 0, total: 0 };
      const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
      const lastLoginAt = (data.lastLoginAt as { toDate?: () => Date } | undefined)?.toDate?.();
      return {
        id: d.id,
        email: String(data.email || ''),
        name: String(data.name || ''),
        role: String(data.role || 'user'),
        createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        lastLoginAt: lastLoginAt ? lastLoginAt.toISOString() : new Date().toISOString(),
        ipAddress: String(data.ipAddress || ''),
        purchases: spending.count,
        totalSpent: spending.total,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
