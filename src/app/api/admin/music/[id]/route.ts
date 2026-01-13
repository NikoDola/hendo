import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { getMusicTrackServer } from '@/lib/music-server';

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

    const track = await getMusicTrackServer(id);
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

    const { title, description, hashtags, genre, price, audioFileUrl, audioFileName, pdfFileUrl, pdfFileName, imageFileUrl, imageFileName, showToHome, stems } = body;

    // Get existing track to preserve existing files if not updated
    const existingTrack = await getMusicTrackServer(id);
    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Enforce max 3 home tracks
    if (showToHome === true && !existingTrack.showToHome) {
      const adminDb = firebaseAdmin.firestore();
      const homeSnap = await adminDb.collection('music').where('showToHome', '==', true).get();
      const homeCount = homeSnap.size;
      if (homeCount >= 3) {
        return NextResponse.json(
          { error: 'You cannot add more than 3 tracks to the home page. Please remove one first.' },
          { status: 400 }
        );
      }
    }

    // Update the track in Firestore (Admin SDK bypasses Firestore security rules)
    const adminDb = firebaseAdmin.firestore();
    const docRef = adminDb.collection('music').doc(id);

    const updateData: Record<string, unknown> = {
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    };

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (hashtags !== undefined) updateData.hashtags = Array.isArray(hashtags) ? hashtags : [];
    if (genre !== undefined) updateData.genre = genre ? genre.trim() : '';
    if (price !== undefined) updateData.price = parseFloat(price);
    if (showToHome !== undefined) updateData.showToHome = showToHome;
    if (stems !== undefined) updateData.stems = Boolean(stems);

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

    await docRef.set(updateData, { merge: true });

    // Return updated track
    const updatedTrack = await getMusicTrackServer(id);
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

    const adminDb = firebaseAdmin.firestore();
    const docRef = adminDb.collection('music').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const data = snap.data() as Record<string, unknown>;
    const audioFileName = typeof data.audioFileName === 'string' ? data.audioFileName : null;
    const pdfFileName = typeof data.pdfFileName === 'string' ? data.pdfFileName : null;
    const imageFileName = typeof data.imageFileName === 'string' ? data.imageFileName : null;

    // Best-effort delete from Storage using Admin SDK (bypasses Storage rules)
    try {
      const bucket = firebaseAdmin.storage().bucket();
      const deletes = [audioFileName, pdfFileName, imageFileName]
        .filter((p): p is string => Boolean(p && p.trim().length > 0))
        .map((path) => bucket.file(path).delete().catch(() => undefined));
      await Promise.all(deletes);
    } catch (e) {
      console.warn('Failed to delete some storage files:', e);
    }

    await docRef.delete();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete music track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete music track' },
      { status: 500 }
    );
  }
}
