// Music management system
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface MusicTrack {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  price: number;
  audioFileUrl: string;
  audioFileName: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin email
}

export interface CreateMusicData {
  title: string;
  description: string;
  hashtags: string[];
  price: number;
  audioFile: File;
  pdfFile?: File;
}

export interface UpdateMusicData {
  title?: string;
  description?: string;
  hashtags?: string[];
  price?: number;
  audioFile?: File;
  pdfFile?: File;
}

/**
 * Uploads a file to Firebase Storage
 */
async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * Deletes a file from Firebase Storage
 */
async function deleteFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error - file might not exist
  }
}

/**
 * Creates a new music track
 */
export async function createMusicTrack(data: CreateMusicData, adminEmail: string): Promise<MusicTrack> {
  try {
    // Upload audio file
    let audioFileUrl: string;
    let audioFileName: string;
    try {
      audioFileName = `music/${Date.now()}_${data.audioFile.name}`;
      audioFileUrl = await uploadFile(data.audioFile, audioFileName);
    } catch (uploadError: unknown) {
      const error = uploadError as { code?: string; message?: string };
      console.error('Error uploading audio file:', uploadError);
      if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
        throw new Error('Permission denied: Firebase Storage rules do not allow uploads. Please check your Storage security rules allow admin uploads.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded: Your Firebase Storage has reached its limit.');
      } else if (error.code === 'storage/unauthenticated') {
        throw new Error('Authentication required: Please ensure you are logged in.');
      } else {
        throw new Error(`Failed to upload audio file: ${error.message || error.code || 'Unknown error'}`);
      }
    }

    // Upload PDF file if provided
    let pdfFileUrl: string | undefined;
    let pdfFileName: string | undefined;
    if (data.pdfFile) {
      try {
        pdfFileName = `music/pdfs/${Date.now()}_${data.pdfFile.name}`;
        pdfFileUrl = await uploadFile(data.pdfFile, pdfFileName);
      } catch (pdfError: unknown) {
        console.error('Error uploading PDF file:', pdfError);
        // If PDF upload fails, we can still continue with the track creation
        console.warn('PDF upload failed, continuing without PDF');
      }
    }

    // Create music track document
    let musicRef;
    try {
      musicRef = await addDoc(collection(db, 'music'), {
        title: data.title,
        description: data.description,
        hashtags: data.hashtags,
        price: data.price,
        audioFileUrl,
        audioFileName,
        pdfFileUrl,
        pdfFileName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminEmail
      });
    } catch (firestoreError: unknown) {
      const error = firestoreError as Error;
      console.error('Error creating Firestore document:', firestoreError);
      // Try to clean up uploaded files if Firestore creation fails
      try {
        await deleteFile(audioFileUrl);
        if (pdfFileUrl) await deleteFile(pdfFileUrl);
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }
      throw new Error(`Failed to save track to database: ${error.message || 'Database error'}`);
    }

    return {
      id: musicRef.id,
      title: data.title,
      description: data.description,
      hashtags: data.hashtags,
      price: data.price,
      audioFileUrl,
      audioFileName,
      pdfFileUrl,
      pdfFileName,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminEmail
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating music track:', error);
    // If error already has a specific message, throw it as is
    if (err.message && !err.message.includes('Failed to create music track')) {
      throw error;
    }
    // Otherwise, provide a more helpful generic message
    throw new Error(`Failed to create music track: ${err.message || 'Unknown error occurred'}`);
  }
}

/**
 * Updates an existing music track
 */
export async function updateMusicTrack(trackId: string, data: UpdateMusicData): Promise<MusicTrack> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      throw new Error('Music track not found');
    }

    const currentTrack = trackSnap.data() as MusicTrack;
    const updateData: {
      updatedAt: ReturnType<typeof serverTimestamp>;
      title?: string;
      description?: string;
      hashtags?: string[];
      price?: number;
      audioFileUrl?: string;
      audioFileName?: string;
      pdfFileUrl?: string;
      pdfFileName?: string;
    } = {
      updatedAt: serverTimestamp()
    };

    // Update basic fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.hashtags !== undefined) updateData.hashtags = data.hashtags;
    if (data.price !== undefined) updateData.price = data.price;

    // Handle audio file update
    if (data.audioFile) {
      // Delete old audio file
      await deleteFile(currentTrack.audioFileUrl);

      // Upload new audio file
      const audioFileName = `music/${Date.now()}_${data.audioFile.name}`;
      const audioFileUrl = await uploadFile(data.audioFile, audioFileName);

      updateData.audioFileUrl = audioFileUrl;
      updateData.audioFileName = audioFileName;
    }

    // Handle PDF file update
    if (data.pdfFile) {
      // Delete old PDF file if exists
      if (currentTrack.pdfFileUrl) {
        await deleteFile(currentTrack.pdfFileUrl);
      }

      // Upload new PDF file
      const pdfFileName = `music/pdfs/${Date.now()}_${data.pdfFile.name}`;
      const pdfFileUrl = await uploadFile(data.pdfFile, pdfFileName);

      updateData.pdfFileUrl = pdfFileUrl;
      updateData.pdfFileName = pdfFileName;
    }

    // Update the document
    await updateDoc(trackRef, updateData);

    // Return updated track
    const updatedSnap = await getDoc(trackRef);
    return {
      id: updatedSnap.id,
      ...updatedSnap.data(),
      createdAt: updatedSnap.data()?.createdAt?.toDate() || new Date(),
      updatedAt: updatedSnap.data()?.updatedAt?.toDate() || new Date()
    } as MusicTrack;
  } catch (error) {
    console.error('Error updating music track:', error);
    throw new Error('Failed to update music track');
  }
}

/**
 * Deletes a music track
 */
export async function deleteMusicTrack(trackId: string): Promise<void> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      throw new Error('Music track not found');
    }

    const track = trackSnap.data() as MusicTrack;

    // Delete audio file
    await deleteFile(track.audioFileUrl);

    // Delete PDF file if exists
    if (track.pdfFileUrl) {
      await deleteFile(track.pdfFileUrl);
    }

    // Delete document
    await deleteDoc(trackRef);
  } catch (error) {
    console.error('Error deleting music track:', error);
    throw new Error('Failed to delete music track');
  }
}

/**
 * Gets all music tracks
 */
export async function getAllMusicTracks(): Promise<MusicTrack[]> {
  try {
    const musicRef = collection(db, 'music');
    const q = query(musicRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as MusicTrack[];
  } catch (error) {
    console.error('Error getting music tracks:', error);
    throw new Error('Failed to get music tracks');
  }
}

/**
 * Gets a single music track by ID
 */
export async function getMusicTrack(trackId: string): Promise<MusicTrack | null> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      return null;
    }

    return {
      id: trackSnap.id,
      ...trackSnap.data(),
      createdAt: trackSnap.data()?.createdAt?.toDate() || new Date(),
      updatedAt: trackSnap.data()?.updatedAt?.toDate() || new Date()
    } as MusicTrack;
  } catch (error) {
    console.error('Error getting music track:', error);
    throw new Error('Failed to get music track');
  }
}
