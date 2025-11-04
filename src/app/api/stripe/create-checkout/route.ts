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

    // Get base URL from the request (for local testing) or env variable
    // Check multiple headers to determine the correct base URL
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Try to get from origin header first
    const origin = request.headers.get('origin');
    if (origin) {
      baseUrl = origin;
    } else {
      // Fall back to referer or host header
      const referer = request.headers.get('referer');
      if (referer) {
        try {
          const url = new URL(referer);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch (e) {
          // If parsing fails, use default
        }
      } else {
        // Try host header
        const host = request.headers.get('host');
        if (host) {
          baseUrl = `http://${host}`;
        }
      }
    }
    
    console.log('Creating checkout session with baseUrl:', baseUrl);
    
    const session = await createCheckoutSession(
      musicTrackId,
      musicTitle,
      price,
      user.email,
      `${baseUrl}/music/success?session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/music/cancel`
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
