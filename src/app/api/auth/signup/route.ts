import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get client IP
    const headerStore = await headers();
    const forwardedFor = headerStore.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    const user = await createOrUpdateUser({
      email,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      password,
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
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 500 }
    );
  }
}
