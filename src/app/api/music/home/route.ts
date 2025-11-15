import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET() {
  try {
    const musicRef = collection(db, 'music');
    const q = query(
      musicRef,
      where('showToHome', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    const tracks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString()
    })).sort((a, b) => {
      // Sort by createdAt descending (newest first) on client side
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

