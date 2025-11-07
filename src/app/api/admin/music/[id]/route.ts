import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { deleteMusicTrack, getMusicTrack } from '@/lib/music';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const track = await getMusicTrack(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    } catch (jsonError: unknown) {
      const err = jsonError as Error;
      console.error('Failed to parse JSON:', jsonError);
      console.error('Error details:', {
        message: err.message,
        name: err.name
      });

      // In Next.js, we can only read the body once, so if json() fails, we can't use text()
      // This usually means the body is empty or malformed
      return NextResponse.json(
        {
          error: `Invalid request format. Expected JSON. ${err.message || 'The request body may be empty or not valid JSON.'}`
        },
        { status: 400 }
      );
    }

    const { title, description, hashtags, genre, price, audioFileUrl, audioFileName, pdfFileUrl, pdfFileName, imageFileUrl, imageFileName } = body;

    // Get existing track to preserve existing files if not updated
    const { getMusicTrack } = await import('@/lib/music');
    const existingTrack = await getMusicTrack(id);
    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Update the track in Firestore
    const trackRef = (await import('@/lib/firebase')).db;
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = doc(trackRef, 'music', id);

    const updateData: {
      updatedAt: ReturnType<typeof serverTimestamp>;
      title?: string;
      description?: string;
      hashtags?: string[];
      genre?: string;
      price?: number;
      audioFileUrl?: string;
      audioFileName?: string;
      pdfFileUrl?: string | null;
      pdfFileName?: string | null;
      imageFileUrl?: string | null;
      imageFileName?: string | null;
    } = {
      updatedAt: serverTimestamp()
    };

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (hashtags !== undefined) updateData.hashtags = Array.isArray(hashtags) ? hashtags : [];
    if (genre !== undefined) updateData.genre = genre ? genre.trim() : '';
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
    if (imageFileUrl && imageFileName) {
      updateData.imageFileUrl = imageFileUrl;
      updateData.imageFileName = imageFileName;
    } else if (imageFileUrl === null) {
      // Explicitly clear image if null is sent
      updateData.imageFileUrl = null;
      updateData.imageFileName = null;
    }

    await updateDoc(docRef, updateData);

    // Return updated track
    const updatedTrack = await getMusicTrack(id);
    return NextResponse.json({ track: updatedTrack });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update music track error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to update music track' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteMusicTrack(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete music track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete music track' },
      { status: 500 }
    );
  }
}
