import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession, authenticateAdmin } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const admin = await getAdminFromSession();

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const admin = await authenticateAdmin(email, name);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Failed to authenticate admin' },
        { status: 401 }
      );
    }

    // Set admin session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_email', admin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_email');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}