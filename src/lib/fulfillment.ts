// Shared, idempotent order fulfillment for Stripe checkout sessions.
//
// Both the Stripe webhook (`checkout.session.completed`) and the success-page
// `verify-payment` endpoint call `fulfillCheckoutSession`. A `fulfillments/{sessionId}`
// document acts as an atomic claim so a paid order is fulfilled EXACTLY ONCE,
// even if the webhook and the browser arrive at the same time. Whoever loses the
// race reads the cached result instead of generating a second ZIP / duplicate
// purchase records.
import type Stripe from 'stripe';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { generateCollectionDownloadPackage } from '@/lib/downloads';
import { recordPurchase } from '@/lib/purchases';
import { getMusicTrackServer } from '@/lib/music-server';
import { updateUserPurchases } from '@/lib/auth';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

export interface FulfillmentResult {
  collectionZipUrl: string;
  expiresAt: string; // ISO string
  purchasedTrackIds: string[];
  items: Array<{ trackId: string; trackTitle: string; price: number }>;
}

interface FulfillmentDoc {
  status: 'processing' | 'completed';
  sessionId: string;
  result?: FulfillmentResult;
}

interface FulfillOptions {
  // When another worker already holds the claim and is still processing, wait up
  // to this many ms for it to finish and return its result. The success page sets
  // this (the user is watching); the webhook sets a smaller value.
  waitForResultMs?: number;
}

function extractTrackIds(metadata: Stripe.Metadata | null | undefined): string[] {
  const md = metadata || {};
  let trackIds: string[] = [];

  const rawIds = md.musicTrackIds;
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

  if (trackIds.length === 0 && md.musicTrackId) {
    trackIds = [md.musicTrackId];
  }

  return trackIds;
}

async function waitForCompletion(
  ref: FirebaseFirestore.DocumentReference,
  maxMs: number
): Promise<FulfillmentResult | null> {
  const start = Date.now();
  const intervalMs = 750;
  while (Date.now() - start < maxMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const snap = await ref.get();
    if (!snap.exists) {
      // Claim was released (the worker failed). Caller should re-attempt.
      return null;
    }
    const data = snap.data() as FulfillmentDoc | undefined;
    if (data?.status === 'completed' && data.result) {
      return data.result;
    }
  }
  return null;
}

/**
 * Does the actual work: build the download package, record purchases, bump the
 * user's purchase count. Only ever called by the worker that won the claim.
 */
async function doFulfill(session: Stripe.Checkout.Session): Promise<FulfillmentResult> {
  const metadata = session.metadata || {};
  const trackIds = extractTrackIds(metadata);

  if (trackIds.length === 0) {
    throw new Error('Music track ID(s) not found in payment metadata');
  }

  const customerEmail =
    (session.customer_details?.email || session.customer_email || '').toString();
  const customerName = (session.customer_details?.name || '').toString();

  // Buyer identity stamped at checkout time (create-checkout route). Absent for guests.
  const metaUserId = (metadata.userId || '').toString();
  const metaAuthUid = (metadata.authUid || '').toString();
  const metaUserName = (metadata.userName || '').toString();
  const metaUserEmail = (metadata.userEmail || '').toString();

  // Storage path: prefer the stable Firebase auth uid; guests are scoped to the session.
  const userIdForStorage = metaAuthUid || metaUserId || `guest_${session.id}`;
  // Purchase records / dashboard ownership key.
  const recordUserId = metaUserId || `guest_${session.id}`;

  const collection = await generateCollectionDownloadPackage(
    trackIds,
    userIdForStorage,
    metaUserName || customerName || 'Guest',
    metaUserEmail || customerEmail || 'guest@checkout.stripe'
  );

  // Record a purchase per track (for ownership / dashboard history).
  for (const item of collection.items) {
    const track = await getMusicTrackServer(item.trackId);
    if (!track) {
      throw new Error(`Track not found: ${item.trackId}`);
    }

    await recordPurchase(
      recordUserId,
      item.trackId,
      track.title,
      track.price,
      collection.zipUrl,
      '', // PDF is included inside the ZIP now (no separate PDF download)
      collection.expiresAt
    );
  }

  // Update the registered user's purchase count (Firestore document ID).
  if (metaUserId) {
    await updateUserPurchases(metaUserId, collection.items.length);
  }

  // Send the branded purchase confirmation. Best-effort: a mail failure must
  // never break (or re-trigger) fulfillment — the order is already complete.
  const recipientEmail = metaUserEmail || customerEmail;
  if (recipientEmail) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
      await sendPurchaseConfirmationEmail({
        to: recipientEmail,
        customerName: metaUserName || customerName || undefined,
        items: collection.items.map((i) => ({ trackTitle: i.trackTitle, price: i.price })),
        amountTotal: session.amount_total,
        currency: session.currency,
        orderId: session.id,
        dashboardUrl: `${baseUrl}/dashboard`,
        downloadUrl: collection.zipUrl,
      });
    } catch (err) {
      console.error('Failed to send purchase confirmation email (order still fulfilled):', err);
    }
  }

  return {
    collectionZipUrl: collection.zipUrl,
    expiresAt: collection.expiresAt.toISOString(),
    purchasedTrackIds: collection.items.map((i) => i.trackId),
    items: collection.items,
  };
}

/**
 * Fulfill a paid checkout session exactly once. Safe to call from multiple places
 * (webhook + success page) concurrently and repeatedly.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  opts: FulfillOptions = {}
): Promise<FulfillmentResult> {
  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const db = firebaseAdmin.firestore();
  const ref = db.collection('fulfillments').doc(session.id);

  // Atomically claim fulfillment. The returned value reflects the committed run,
  // so it's safe even if the transaction body retries under contention.
  const claim = await db.runTransaction<
    { claimed: true } | { claimed: false; existing: FulfillmentDoc }
  >(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return { claimed: false, existing: snap.data() as FulfillmentDoc };
    }
    tx.set(ref, {
      status: 'processing',
      sessionId: session.id,
      startedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });
    return { claimed: true };
  });

  if (!claim.claimed) {
    // Someone else owns (or owned) this session.
    if (claim.existing.status === 'completed' && claim.existing.result) {
      return claim.existing.result;
    }
    // Still processing elsewhere — optionally wait for it to finish.
    const waitMs = opts.waitForResultMs ?? 0;
    if (waitMs > 0) {
      const result = await waitForCompletion(ref, waitMs);
      if (result) return result;
    }
    // Couldn't get a result in time (or the other worker failed and released the
    // claim). Signal a retryable state — the webhook returns 500 so Stripe retries.
    throw new Error('Fulfillment already in progress for this session');
  }

  // We own the claim — do the work, then publish the result for everyone else.
  try {
    const result = await doFulfill(session);
    await ref.set(
      {
        status: 'completed',
        result,
        completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return result;
  } catch (error) {
    // Release the claim so a retry (Stripe webhook retry / page reload) can re-attempt.
    await ref.delete().catch(() => {});
    throw error;
  }
}
