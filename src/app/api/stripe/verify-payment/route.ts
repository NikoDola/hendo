import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';
import { updateUserPurchases } from '@/lib/auth';
import { generateDownloadPackage } from '@/lib/downloads';
import { recordPurchase } from '@/lib/purchases';
import { getMusicTrack } from '@/lib/music';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify the user email matches the session customer email
    if (session.customer_email && session.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Payment session does not match current user' },
        { status: 403 }
      );
    }

    const musicTrackId = session.metadata?.musicTrackId;
    if (!musicTrackId) {
      return NextResponse.json(
        { error: 'Music track ID not found in payment metadata' },
        { status: 400 }
      );
    }

    // Get track details
    const track = await getMusicTrack(musicTrackId);
    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Generate download package (ZIP + PDF)
    // Use authUid for storage path (Firebase Auth UID) to match Storage security rules
    const userIdForStorage = user.authUid || user.id;
    console.log('Generating download package for track:', musicTrackId);
    console.log('Using userId for storage:', userIdForStorage);
    const downloadData = await generateDownloadPackage(
      musicTrackId,
      userIdForStorage,
      user.name,
      user.email
    );

    // Record purchase in database
    console.log('Recording purchase for user:', {
      userId: user.id,
      email: user.email,
      trackId: musicTrackId,
      trackTitle: track.title
    });
    
    // Use Firestore document ID for purchase record, but authUid for storage
    const purchase = await recordPurchase(
      user.id, // Firestore document ID for purchase record
      musicTrackId,
      track.title,
      track.price,
      downloadData.zipUrl,
      downloadData.pdfUrl,
      downloadData.expiresAt
    );
    
    console.log('Purchase recorded successfully:', purchase.id);

    // Update user purchase count (use Firestore document ID)
    await updateUserPurchases(user.id, 1);

    return NextResponse.json({
      downloadUrl: downloadData.zipUrl,
      pdfUrl: downloadData.pdfUrl,
      expiresAt: downloadData.expiresAt.toISOString(),
      trackId: musicTrackId,
      trackTitle: track.title
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment and generate downloads' },
      { status: 500 }
    );
  }
}
