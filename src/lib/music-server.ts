import { firebaseAdmin } from '@/lib/firebaseAdmin';

export interface ServerMusicTrack {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: number;
  audioFileUrl: string;
  audioFileName?: string;
  pdfFileUrl?: string | null;
  pdfFileName?: string | null;
  imageFileUrl?: string | null;
  imageFileName?: string | null;
  showToHome?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getMusicTrackServer(trackId: string): Promise<ServerMusicTrack | null> {
  const db = firebaseAdmin.firestore();
  const snap = await db.collection('music').doc(trackId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return {
    id: snap.id,
    title: String(data.title || ''),
    description: String(data.description || ''),
    hashtags: Array.isArray(data.hashtags) ? (data.hashtags as string[]) : [],
    genre: String(data.genre || ''),
    price: typeof data.price === 'number' ? data.price : Number(data.price || 0),
    audioFileUrl: String(data.audioFileUrl || ''),
    audioFileName: data.audioFileName ? String(data.audioFileName) : undefined,
    pdfFileUrl: data.pdfFileUrl !== undefined ? (data.pdfFileUrl as string | null) : undefined,
    pdfFileName: data.pdfFileName !== undefined ? (data.pdfFileName as string | null) : undefined,
    imageFileUrl: data.imageFileUrl !== undefined ? (data.imageFileUrl as string | null) : undefined,
    imageFileName: data.imageFileName !== undefined ? (data.imageFileName as string | null) : undefined,
    showToHome: Boolean(data.showToHome),
    createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
    updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
  };
}


