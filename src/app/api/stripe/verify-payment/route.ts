import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';
import { updateUserPurchases } from '@/lib/auth';
import { generateCollectionDownloadPackage } from '@/lib/downloads';
import { recordPurchase } from '@/lib/purchases';
import { getMusicTrackServer } from '@/lib/music-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();

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

    // If the user is logged in, make sure the session matches them.
    if (user?.email && session.customer_email && session.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Payment session does not match current user' }, { status: 403 });
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

    const customerEmail =
      (session.customer_details?.email || session.customer_email || '').toString();
    const customerName =
      (session.customer_details?.name || '').toString();

    // Use authUid for storage path if logged in; otherwise use a guest scoped to the Stripe session ID.
    const userIdForStorage = user?.authUid || user?.id || `guest_${session.id}`;

    const collection = await generateCollectionDownloadPackage(
      trackIds,
      userIdForStorage,
      user?.name || customerName || 'Guest',
      user?.email || customerEmail || 'guest@checkout.stripe'
    );

    // Record a purchase per track (for ownership / dashboard history)
    for (const item of collection.items) {
      const track = await getMusicTrackServer(item.trackId);
      if (!track) {
        return NextResponse.json({ error: `Track not found: ${item.trackId}` }, { status: 404 });
      }

      await recordPurchase(
        user?.id || `guest_${session.id}`,
        item.trackId,
        track.title,
        track.price,
        collection.zipUrl,
        '', // PDF is included inside the ZIP now (no separate PDF download)
        collection.expiresAt
      );
    }

    // Update user purchase count (use Firestore document ID)
    if (user?.id) {
      await updateUserPurchases(user.id, collection.items.length);
    }

    return NextResponse.json({
      collectionZipUrl: collection.zipUrl,
      expiresAt: collection.expiresAt.toISOString(),
      purchasedTrackIds: collection.items.map((i) => i.trackId),
      items: collection.items,
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
