import { db, storage } from '@/lib/firebase';
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

export interface MusicTrack {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: number;
  audioFileUrl: string;
  audioFileName: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  imageFileUrl?: string;
  imageFileName?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateMusicData {
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: number;
  audioFile: File;
  pdfFile?: File;
  imageFile?: File;
}

export interface UpdateMusicData {
  title?: string;
  description?: string;
  hashtags?: string[];
  genre?: string;
  price?: number;
  audioFile?: File;
  pdfFile?: File;
  imageFile?: File;
}

// ============================================================================
// File Storage Operations
// ============================================================================

async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

async function deleteFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

function generateFileName(prefix: string, originalName: string): string {
  return `${prefix}/${Date.now()}_${originalName}`;
}

// ============================================================================
// Track CRUD Operations
// ============================================================================

export async function createMusicTrack(data: CreateMusicData, adminEmail: string): Promise<MusicTrack> {
  try {
    const { audioFileUrl, audioFileName } = await uploadAudioFile(data.audioFile);
    const { pdfFileUrl, pdfFileName } = await uploadPdfFile(data.pdfFile);
    const { imageFileUrl, imageFileName } = await uploadImageFile(data.imageFile);

    const musicRef = await saveMusicToDatabase({
      ...data,
      audioFileUrl,
      audioFileName,
      pdfFileUrl,
      pdfFileName,
      imageFileUrl,
      imageFileName,
      adminEmail
    });

    return {
      id: musicRef.id,
      title: data.title,
      description: data.description,
      hashtags: data.hashtags,
      genre: data.genre,
      price: data.price,
      audioFileUrl,
      audioFileName,
      pdfFileUrl,
      pdfFileName,
      imageFileUrl,
      imageFileName,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminEmail
    };
  } catch (error) {
    console.error('Error creating music track:', error);
    throw error;
  }
}

async function uploadAudioFile(file: File): Promise<{ audioFileUrl: string; audioFileName: string }> {
  try {
    const audioFileName = generateFileName('music', file.name);
    const audioFileUrl = await uploadFile(file, audioFileName);
    return { audioFileUrl, audioFileName };
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
}

async function uploadPdfFile(file?: File): Promise<{ pdfFileUrl?: string; pdfFileName?: string }> {
  if (!file) {
    return {};
  }

  try {
    const pdfFileName = generateFileName('music/pdfs', file.name);
    const pdfFileUrl = await uploadFile(file, pdfFileName);
    return { pdfFileUrl, pdfFileName };
  } catch (pdfError: unknown) {
    console.error('Error uploading PDF file:', pdfError);
    console.warn('PDF upload failed, continuing without PDF');
    return {};
  }
}

async function uploadImageFile(file?: File): Promise<{ imageFileUrl?: string; imageFileName?: string }> {
  if (!file) {
    return {};
  }

  try {
    const imageFileName = generateFileName('music/images', file.name);
    const imageFileUrl = await uploadFile(file, imageFileName);
    return { imageFileUrl, imageFileName };
  } catch (imageError: unknown) {
    console.error('Error uploading image file:', imageError);
    console.warn('Image upload failed, continuing without image');
    return {};
  }
}

async function saveMusicToDatabase(data: {
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: number;
  audioFileUrl: string;
  audioFileName: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  imageFileUrl?: string;
  imageFileName?: string;
  adminEmail: string;
}): Promise<{ id: string }> {
  try {
    return await addDoc(collection(db, 'music'), {
      title: data.title,
      description: data.description,
      hashtags: data.hashtags,
      genre: data.genre,
      price: data.price,
      audioFileUrl: data.audioFileUrl,
      audioFileName: data.audioFileName,
      pdfFileUrl: data.pdfFileUrl,
      pdfFileName: data.pdfFileName,
      imageFileUrl: data.imageFileUrl,
      imageFileName: data.imageFileName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: data.adminEmail
    });
  } catch (firestoreError: unknown) {
    const error = firestoreError as Error;
    console.error('Error creating Firestore document:', firestoreError);
    
    try {
      await deleteFile(data.audioFileUrl);
      if (data.pdfFileUrl) await deleteFile(data.pdfFileUrl);
      if (data.imageFileUrl) await deleteFile(data.imageFileUrl);
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }
    
    throw new Error(`Failed to save track to database: ${error.message || 'Database error'}`);
  }
}

export async function updateMusicTrack(trackId: string, data: UpdateMusicData): Promise<MusicTrack> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      throw new Error('Music track not found');
    }

    const currentTrack = trackSnap.data() as MusicTrack;
    const updateData = await prepareUpdateData(currentTrack, data);

    await updateDoc(trackRef, updateData);

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

async function prepareUpdateData(currentTrack: MusicTrack, data: UpdateMusicData): Promise<Record<string, unknown>> {
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.hashtags !== undefined) updateData.hashtags = data.hashtags;
  if (data.genre !== undefined) updateData.genre = data.genre;
  if (data.price !== undefined) updateData.price = data.price;

  if (data.audioFile) {
    await deleteFile(currentTrack.audioFileUrl);
    const { audioFileUrl, audioFileName } = await uploadAudioFile(data.audioFile);
    updateData.audioFileUrl = audioFileUrl;
    updateData.audioFileName = audioFileName;
  }

  if (data.pdfFile) {
    if (currentTrack.pdfFileUrl) {
      await deleteFile(currentTrack.pdfFileUrl);
    }
    const { pdfFileUrl, pdfFileName } = await uploadPdfFile(data.pdfFile);
    updateData.pdfFileUrl = pdfFileUrl;
    updateData.pdfFileName = pdfFileName;
  }

  if (data.imageFile) {
    if (currentTrack.imageFileUrl) {
      await deleteFile(currentTrack.imageFileUrl);
    }
    const { imageFileUrl, imageFileName } = await uploadImageFile(data.imageFile);
    updateData.imageFileUrl = imageFileUrl;
    updateData.imageFileName = imageFileName;
  }

  return updateData;
}

export async function deleteMusicTrack(trackId: string): Promise<void> {
  try {
    const trackRef = doc(db, 'music', trackId);
    const trackSnap = await getDoc(trackRef);

    if (!trackSnap.exists()) {
      throw new Error('Music track not found');
    }

    const track = trackSnap.data() as MusicTrack;

    await deleteFile(track.audioFileUrl);
    if (track.pdfFileUrl) {
      await deleteFile(track.pdfFileUrl);
    }
    if (track.imageFileUrl) {
      await deleteFile(track.imageFileUrl);
    }

    await deleteDoc(trackRef);
  } catch (error) {
    console.error('Error deleting music track:', error);
    throw new Error('Failed to delete music track');
  }
}

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

