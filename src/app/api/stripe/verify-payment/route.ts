import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserFromSession } from '@/lib/auth';
import { updateUserPurchases } from '@/lib/auth';

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

    if (session.payment_status === 'paid') {
      // Update user purchase count
      await updateUserPurchases(user.id, 1);

      // Generate download data
      const downloadData = {
        downloadUrl: `https://example.com/downloads/${session.metadata?.musicTrackId}.zip`,
        pdfUrl: `https://example.com/rights/${session.metadata?.musicTrackId}.pdf`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      return NextResponse.json(downloadData);
    } else {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
