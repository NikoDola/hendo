import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = (decoded.email || '').toLowerCase();
    const name = decoded.name || email.split('@')[0];
    const role = isAuthorizedAdmin(email) ? 'admin' : 'user';

    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.uid,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
