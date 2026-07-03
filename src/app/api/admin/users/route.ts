import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldPath } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAuthorizedAdmin } from '@/lib/auth';

// Paginated: returns `limit` users per request (default 10) with a cursor for
// the next page, so the admin table can lazy-load instead of pulling every
// user and every purchase on one request.
const DEFAULT_PAGE_SIZE = 10;
// Firestore `in` queries accept at most 30 values, and we look up purchases
// with one `in` query per page.
const MAX_PAGE_SIZE = 30;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '', 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const cursor = searchParams.get('cursor') || '';

    const db = firebaseAdmin.firestore();

    // Order by document id, not createdAt: Firestore drops documents that are
    // missing the orderBy field, and older user docs may lack createdAt.
    let query = db
      .collection('users')
      .orderBy(FieldPath.documentId())
      .limit(limit);
    if (cursor) {
      query = query.startAfter(cursor);
    }
    const usersSnap = await query.get();

    // Aggregate spend only for the users on this page.
    const ids = usersSnap.docs.map((d) => d.id);
    const userSpending = new Map<string, { count: number; total: number }>();
    if (ids.length > 0) {
      const purchasesSnap = await db
        .collection('purchases')
        .where('userId', 'in', ids)
        .get();
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
    }

    // Return ONLY users that exist in Firestore. We intentionally do NOT
    // auto-create user docs from Firebase Auth here — that previously
    // auto-assigned admin role to anyone matching the allowlist on a GET.
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

    const nextCursor =
      usersSnap.docs.length === limit ? usersSnap.docs[usersSnap.docs.length - 1].id : null;

    // Total user count via the aggregate query (no document reads).
    let total: number | null = null;
    try {
      const countSnap = await db.collection('users').count().get();
      total = countSnap.data().count;
    } catch {
      // Older SDK/emulator without count() — the UI falls back to loaded count.
    }

    return NextResponse.json({ users, nextCursor, total });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
