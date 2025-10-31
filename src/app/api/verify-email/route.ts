import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    // Verify the token (simple validation for now)
    // In a real implementation, you'd verify the token with your email service

    // Update the subscriber record in Firestore to mark as verified
    const subscribersRef = collection(db, 'subscribers');
    const q = query(subscribersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Update the first matching document
    const subscriberDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'subscribers', subscriberDoc.id), {
      verified: true,
      verifiedAt: new Date(),
      verificationToken: token
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
