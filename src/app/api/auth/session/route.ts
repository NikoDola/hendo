import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { createOrUpdateUser } from '@/lib/auth';

// Creates a Firebase session cookie from an ID token provided by the client
// POST body: { idToken: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }
    
    const { idToken } = JSON.parse(body);
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 7; // 7 days
    let sessionCookie: string;
    try {
      sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { expiresIn });
    } catch (e) {
      console.error('createSessionCookie failed:', e);
      return NextResponse.json({ error: 'Server session setup failed. Check Firebase Admin credentials.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('fb_session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });

    // Upsert user in Firestore based on decoded token
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken, true);
    const email = decoded.email || '';
    const name = decoded.name || email.split('@')[0];
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');
    try {
      await createOrUpdateUser({
        email,
        name,
        authUid: decoded.uid,
        firstName,
        lastName,
        ipAddress: 'firebase',
      });
    } catch (e) {
      // Non-fatal: user record may already exist
      console.warn('Upsert user after session failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}


