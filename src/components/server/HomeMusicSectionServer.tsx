import { firebaseAdmin } from '@/lib/firebaseAdmin';
import type { MusicTrack } from '@/lib/music';
import HomeMusicClient from '@/components/client/HomeMusicClient';

async function getHomeTracks(): Promise<MusicTrack[]> {
  try {
    const db = firebaseAdmin.firestore();
    const musicRef = db.collection('music');
    
    // Fetch tracks with showToHome = true (no orderBy to avoid composite index requirement)
    const querySnapshot = await musicRef
      .where('showToHome', '==', true)
      .get();
    
    const tracks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        hashtags: data.hashtags || [],
        genre: data.genre || '',
        price: data.price || 0,
        audioFileUrl: data.audioFileUrl || '',
        audioFileName: data.audioFileName || '',
        pdfFileUrl: data.pdfFileUrl,
        pdfFileName: data.pdfFileName,
        imageFileUrl: data.imageFileUrl,
        imageFileName: data.imageFileName,
        showToHome: data.showToHome || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || ''
      } as MusicTrack;
    });

    // Sort by createdAt descending in memory and take first 3
    return tracks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
  } catch (error) {
    console.error('Error fetching home tracks (server):', error);
    return [];
  }
}

export default async function HomeMusicSectionServer() {
  const tracks = await getHomeTracks();

  if (tracks.length === 0) {
    return null;
  }

  return <HomeMusicClient tracks={tracks} />;
}

