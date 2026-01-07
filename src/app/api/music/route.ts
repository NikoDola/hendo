import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = firebaseAdmin.firestore();
    const snap = await db.collection('music').orderBy('createdAt', 'desc').get();
    const tracks = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
      const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
      return {
        id: d.id,
        ...data,
        createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
      };
    });
    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Get music tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get music tracks' },
      { status: 500 }
    );
  }
}
