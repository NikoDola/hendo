import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';
import { updateUserPurchases } from '@/lib/auth';
import { generateDownloadPackage } from '@/lib/downloads';
import { recordPurchase } from '@/lib/purchases';
import { getMusicTrackServer } from '@/lib/music-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      console.error('❌ [Verify Payment] No user found in session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      console.error('❌ [Verify Payment] No session ID provided');
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

    const metadata = session.metadata || {};

    // Support both single-track purchases and cart purchases (multiple tracks)
    let trackIds: string[] = [];

    const rawIds = metadata.musicTrackIds;
    if (rawIds) {
      try {
        const parsed = JSON.parse(rawIds);
        if (Array.isArray(parsed)) {
          trackIds = parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
        }
      } catch {
        // ignore parse errors and fall back to single id
      }
    }

    if (trackIds.length === 0 && metadata.musicTrackId) {
      trackIds = [metadata.musicTrackId];
    }

    if (trackIds.length === 0) {
      return NextResponse.json(
        { error: 'Music track ID(s) not found in payment metadata' },
        { status: 400 }
      );
    }

    // Use authUid for storage path (Firebase Auth UID) to match Storage security rules
    const userIdForStorage = user.authUid || user.id;

    const results: Array<{
      trackId: string;
      trackTitle: string;
      price: number;
      downloadUrl: string;
      pdfUrl: string;
      expiresAt: string;
    }> = [];

    for (const trackId of trackIds) {
      const track = await getMusicTrackServer(trackId);
      if (!track) {
        return NextResponse.json(
          { error: `Track not found: ${trackId}` },
          { status: 404 }
        );
      }

      const downloadData = await generateDownloadPackage(
        trackId,
        userIdForStorage,
        user.name,
        user.email
      );

      // Use Firestore document ID for purchase record, but authUid for storage
      await recordPurchase(
        user.id, // Firestore document ID for purchase record
        trackId,
        track.title,
        track.price,
        downloadData.zipUrl,
        downloadData.pdfUrl,
        downloadData.expiresAt
      );

      results.push({
        trackId,
        trackTitle: track.title,
        price: track.price,
        downloadUrl: downloadData.zipUrl,
        pdfUrl: downloadData.pdfUrl,
        expiresAt: downloadData.expiresAt.toISOString(),
      });
    }

    // Update user purchase count (use Firestore document ID)
    await updateUserPurchases(user.id, results.length);

    // Backward-compatible response for single purchases
    if (results.length === 1) {
      const r = results[0];
      return NextResponse.json({
        downloadUrl: r.downloadUrl,
        pdfUrl: r.pdfUrl,
        expiresAt: r.expiresAt,
        trackId: r.trackId,
        trackTitle: r.trackTitle,
        purchasedTrackIds: [r.trackId],
        items: results
      });
    }

    return NextResponse.json({
      purchasedTrackIds: results.map(r => r.trackId),
      items: results
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to verify payment and generate downloads' },
      { status: 500 }
    );
  }
}
