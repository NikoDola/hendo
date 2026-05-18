import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = firebaseAdmin.firestore();
    const existing = await db
      .collection('newsletter')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 409 }
      );
    }

    await db.collection('newsletter').add({
      email: normalizedEmail,
      subscribedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      source: 'under-construction',
    });

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
