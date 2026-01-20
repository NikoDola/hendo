import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

// firebase-admin requires the Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    const emailNormalized = String(email).toLowerCase().trim();
    const tokenNormalized = String(token).trim();

    // If Firebase Admin isn't initialized (missing server env vars), fail with a helpful message.
    if (!firebaseAdmin.apps?.length) {
      return NextResponse.json(
        {
          error:
            'Server is missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your deployment environment.',
        },
        { status: 500 }
      );
    }

    const firestore = firebaseAdmin.firestore();
    const subscriberRef = firestore.collection('subscribers').doc(emailNormalized);
    const snap = await subscriberRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const data = snap.data() as { verificationToken?: string; verified?: boolean } | undefined;

    if (data?.verified) {
      return NextResponse.json({ success: true, message: 'Email already verified' }, { status: 200 });
    }

    if (!data?.verificationToken || data.verificationToken !== tokenNormalized) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
    }

    await subscriberRef.set(
      {
        verified: true,
        verifiedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(emailNormalized);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error: unknown) {
    console.error('Email verification error:', error);

    // Always return something actionable (without stack traces / secrets)
    const message =
      error instanceof Error
        ? error.message || error.name || 'Internal server error'
        : typeof error === 'string'
          ? error
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return String(error);
              }
            })();

    const debug = {
      runtime: process.env.NEXT_RUNTIME || 'unknown',
      nodeEnv: process.env.NODE_ENV,
      adminApps: firebaseAdmin.apps?.length ?? 0,
      hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    };

    return NextResponse.json({ error: message, debug }, { status: 500 });
  }
}
