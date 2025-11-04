import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { updateMusicTrack, deleteMusicTrack, getMusicTrack } from '@/lib/music';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const track = await getMusicTrack(params.id);
    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ track });

  } catch (error) {
    console.error('Get music track error:', error);
    return NextResponse.json(
      { error: 'Failed to get music track' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Files are now uploaded client-side, so we receive JSON with file URLs
    let body;
    try {
      body = await request.json();
      console.log('Received body:', JSON.stringify(body, null, 2));
    } catch (jsonError: any) {
      console.error('Failed to parse JSON:', jsonError);
      console.error('Error details:', {
        message: jsonError.message,
        name: jsonError.name
      });
      
      // In Next.js, we can only read the body once, so if json() fails, we can't use text()
      // This usually means the body is empty or malformed
      return NextResponse.json(
        { 
          error: `Invalid request format. Expected JSON. ${jsonError.message || 'The request body may be empty or not valid JSON.'}` 
        },
        { status: 400 }
      );
    }
    
    const { title, description, hashtags, price, audioFileUrl, audioFileName, pdfFileUrl, pdfFileName } = body;

    // Get existing track to preserve existing files if not updated
    const { getMusicTrack } = await import('@/lib/music');
    const existingTrack = await getMusicTrack(params.id);
    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Update Firestore document
    const { db } = await import('@/lib/firebase');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (hashtags !== undefined) updateData.hashtags = Array.isArray(hashtags) ? hashtags : [];
    if (price !== undefined) updateData.price = parseFloat(price);

    // Only update file URLs if new ones were provided
    if (audioFileUrl && audioFileName) {
      updateData.audioFileUrl = audioFileUrl;
      updateData.audioFileName = audioFileName;
    }
    if (pdfFileUrl && pdfFileName) {
      updateData.pdfFileUrl = pdfFileUrl;
      updateData.pdfFileName = pdfFileName;
    } else if (pdfFileUrl === null) {
      // Explicitly clear PDF if null is sent
      updateData.pdfFileUrl = null;
      updateData.pdfFileName = null;
    }

    const trackRef = doc(db, 'music', params.id);
    await updateDoc(trackRef, updateData);

    // Return updated track
    const updatedTrack = await getMusicTrack(params.id);
    return NextResponse.json({ track: updatedTrack });

  } catch (error: any) {
    console.error('Update music track error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update music track' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteMusicTrack(params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete music track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete music track' },
      { status: 500 }
    );
  }
}
