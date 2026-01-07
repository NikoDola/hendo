import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

function isAuthorizedAdminEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const ADMIN_EMAILS = ['thelegendofhendo@gmail.com', 'nikodola@gmail.com'];
  return ADMIN_EMAILS.includes(lower) || lower.endsWith('@nikodola.com');
}

export async function GET() {
  try {
    // Verify admin via Firebase session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = decoded.email?.toLowerCase() || '';
    if (!isAuthorizedAdminEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Admin SDK Firestore (bypasses client security rules)
    const db = firebaseAdmin.firestore();

    // Fetch users from Firestore
    const usersSnap = await db.collection('users').get();
    const emailToUser = new Map<string, { id: string; email: string; name?: string; role?: string }>();
    usersSnap.docs.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      const uEmail = String(data.email || '').toLowerCase();
      if (!uEmail) return;
      emailToUser.set(uEmail, {
        id: d.id,
        email: uEmail,
        name: String(data.name || ''),
        role: String(data.role || 'user'),
      });
    });

    // Also fetch users from Firebase Auth and include any missing
    const authUsersAccumulator: { uid: string; email?: string; displayName?: string }[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
      const page = await firebaseAdmin.auth().listUsers(1000, nextPageToken);
      authUsersAccumulator.push(...page.users);
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    for (const authUser of authUsersAccumulator) {
      const uEmail = authUser.email?.toLowerCase();
      if (!uEmail) continue;
      if (!emailToUser.has(uEmail)) {
        // Create minimal user into Firestore so it appears in the list (Admin SDK)
        const name = authUser.displayName || uEmail.split('@')[0];
        const role = isAuthorizedAdminEmail(uEmail) ? 'admin' : 'user';
        await db.collection('users').add({
          email: uEmail,
          name,
          authUid: authUser.uid,
          role,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          purchases: 0,
        });
      }
    }

    // Re-read after potential upserts
    const usersSnap2 = await db.collection('users').get();

    // Get all purchases to calculate total spent per user
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

    const users = usersSnap2.docs.map((d) => {
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
