import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { fulfillCheckoutSession } from '@/lib/fulfillment';

// Must run on the Node runtime (firebase-admin needs Node) and never be cached,
// so we always read the raw body for signature verification.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error(
      'Stripe webhook is not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET).'
    );
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Raw body is required to verify the signature — do NOT parse as JSON first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(
      '⚠️ Stripe webhook signature verification failed:',
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // Give a concurrently-running success page a moment to finish so we don't
      // 500 unnecessarily; if it's still going we 500 and Stripe retries later.
      await fulfillCheckoutSession(session, { waitForResultMs: 12000 });
      console.log('✅ Fulfilled checkout session via webhook:', session.id);
    }

    // Acknowledge everything else so Stripe stops retrying unhandled event types.
    return NextResponse.json({ received: true });
  } catch (err) {
    // Return 500 so Stripe retries with backoff (the failed attempt released its
    // fulfillment claim, so the retry can re-attempt cleanly).
    console.error('💥 Stripe webhook fulfillment error:', err);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
}
