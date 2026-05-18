import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createCheckoutSessionForItems } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();

    const body = await request.json().catch(() => ({}));
    const { items, musicTrackId, musicTitle, price } = body as {
      items?: Array<{ id: string; title: string; price: number }>;
      musicTrackId?: string;
      musicTitle?: string;
      price?: number;
    };

    // Base URL is server-controlled. Never read from Origin/Referer/Host —
    // those are attacker-controllable and would let a third party redirect the
    // Stripe success flow to their own domain (phishing + session_id leak).
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not set in production');
      return NextResponse.json(
        { error: 'Checkout is misconfigured. Please contact support.' },
        { status: 500 }
      );
    }

    const successUrl = `${baseUrl}/music/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/music/cancel`;

    let session;
    if (Array.isArray(items) && items.length > 0) {
      session = await createCheckoutSessionForItems(items, user?.email, successUrl, cancelUrl);
    } else {
      if (!musicTrackId || !musicTitle || !price) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      session = await createCheckoutSession(musicTrackId, musicTitle, price, user?.email, successUrl, cancelUrl);
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
