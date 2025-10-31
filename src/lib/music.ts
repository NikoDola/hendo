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
    const audioFileName = `music/${Date.now()}_${data.audioFile.name}`;
    const audioFileUrl = await uploadFile(data.audioFile, audioFileName);

    // Upload PDF file if provided
    let pdfFileUrl: string | undefined;
    let pdfFileName: string | undefined;
    if (data.pdfFile) {
      pdfFileName = `music/pdfs/${Date.now()}_${data.pdfFile.name}`;
      pdfFileUrl = await uploadFile(data.pdfFile, pdfFileName);
    }

    // Create music track document
    const musicRef = await addDoc(collection(db, 'music'), {
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
  } catch (error) {
    console.error('Error creating music track:', error);
    throw new Error('Failed to create music track');
  }
}

/**
 * Updates an existing music track
 */
export async function updateMusicTrack(trackId: string, data: UpdateMusicData, adminEmail: string): Promise<MusicTrack> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      throw new Error('Music track not found');
    }

    const currentTrack = trackSnap.data() as MusicTrack;
    const updateData: any = {
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
