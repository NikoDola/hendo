import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { sendContactEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, recaptchaToken } = await request.json();

    // reCAPTCHA: required in production; optional in development (so local dev
    // without the secret still works). Previously the verification block was
    // skipped silently when no token was sent — an obvious bypass.
    const isProd = process.env.NODE_ENV === 'production';
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (isProd && (!recaptchaToken || !recaptchaSecret)) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification is required.' },
        { status: 400 }
      );
    }

    if (recaptchaToken && recaptchaSecret) {
      const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaToken)}`,
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success || (typeof verifyData.score === 'number' && verifyData.score < 0.5)) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Save contact message to Firestore (Admin SDK so it works without login / client rules)
    const db = firebaseAdmin.firestore();
    await db.collection('contact_messages').add({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      read: false
    });

    // Send email notification via Resend (Firebase + Resend integration)
    try {
      await sendContactEmail(name.trim(), email.trim(), message.trim());
    } catch (emailError) {
      // Log error but don't fail the request - message is already saved to Firestore
      console.error('Failed to send contact email notification:', emailError);
      // Continue anyway since the message is saved
    }

    return NextResponse.json(
      { message: 'Thank you for your message! We will get back to you soon.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}




