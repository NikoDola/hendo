import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';
import { fulfillCheckoutSession } from '@/lib/fulfillment';

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

    // Fulfill via the shared, idempotent path. If the Stripe webhook already
    // fulfilled this session, this just returns the cached result (no duplicate
    // purchases or ZIP generation). The user is watching the page, so wait a bit
    // if another worker is mid-fulfillment.
    const result = await fulfillCheckoutSession(session, { waitForResultMs: 20000 });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to verify payment and generate downloads' },
      { status: 500 }
    );
  }
}
