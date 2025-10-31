import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { musicTrackId, musicTitle, price } = await request.json();

    if (!musicTrackId || !musicTitle || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession(
      musicTrackId,
      musicTitle,
      price,
      user.email,
      `${process.env.NEXT_PUBLIC_BASE_URL}/music/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.NEXT_PUBLIC_BASE_URL}/music/cancel`
    );

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
