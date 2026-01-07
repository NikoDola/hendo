import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

type StatsKind = 'favorites' | 'carts';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const trackIds = Array.isArray(body.trackIds) ? body.trackIds.map(String) : [];

    if (trackIds.length === 0) {
      return NextResponse.json({ stats: {} });
    }

    const db = firebaseAdmin.firestore();
    const refs = trackIds.map((id: string) => db.collection('musicStats').doc(id));
    const snaps = await db.getAll(...refs);

    const stats: Record<string, { favoriteCount: number; cartCount: number }> = {};
    snaps.forEach((snap, idx) => {
      const trackId = trackIds[idx];
      const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};
      stats[trackId] = {
        favoriteCount: typeof data.favoriteCount === 'number' ? data.favoriteCount : 0,
        cartCount: typeof data.cartCount === 'number' ? data.cartCount : 0,
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Admin stats bulk error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const trackId = url.searchParams.get('trackId') || '';
    const kind = (url.searchParams.get('kind') || '') as StatsKind;

    if (!trackId || (kind !== 'favorites' && kind !== 'carts')) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();
    const col = db.collection('musicStats').doc(trackId).collection(kind);
    const snapshot = await col.orderBy('lastActionAtMs', 'desc').limit(500).get();

    const users = snapshot.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        userId: String(data.userId || ''),
        name: String(data.name || ''),
        email: String(data.email || ''),
        lastActionAtMs: typeof data.lastActionAtMs === 'number' ? data.lastActionAtMs : 0,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin stats list error:', error);
    return NextResponse.json({ error: 'Failed to load user list' }, { status: 500 });
  }
}


