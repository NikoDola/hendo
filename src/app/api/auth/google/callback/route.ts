import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    // Get client IP
    const headerStore = await headers();
    const forwardedFor = headerStore.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Create or update user
    const user = await createOrUpdateUser({
      email: userInfo.email,
      name: `${userInfo.given_name} ${userInfo.family_name}`,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      ipAddress
    });

    // Set user session cookie
    const cookieStore = await cookies();
    cookieStore.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google authentication failed' },
      { status: 500 }
    );
  }
}
