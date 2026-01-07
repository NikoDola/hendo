import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = firebaseAdmin.firestore();
    const snap = await db
      .collection('music')
      .where('showToHome', '==', true)
      .get();

    const tracks = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
        const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
        return {
          id: d.id,
          ...data,
          createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
          updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
        };
      })
      .sort((a, b) => {
        // Sort by createdAt descending (newest first) on server side
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Get home music tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get home music tracks' },
      { status: 500 }
    );
  }
}

