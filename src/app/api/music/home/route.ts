import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

// Public home-page endpoint. Same field projection as /api/music — no internal fields.
function toPublicTrack(id: string, data: Record<string, unknown>) {
  const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    genre: data.genre ?? '',
    price: typeof data.price === 'number' ? data.price : Number(data.price ?? 0),
    audioFileUrl: data.audioFileUrl ?? null,
    imageFileUrl: data.imageFileUrl ?? null,
    stems: Boolean(data.stems),
    showToHome: Boolean(data.showToHome),
    createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
    updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const db = firebaseAdmin.firestore();
    const snap = await db.collection('music').where('showToHome', '==', true).get();
    const tracks = snap.docs
      .map((d) => toPublicTrack(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Get home music tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get home music tracks' },
      { status: 500 }
    );
  }
}
