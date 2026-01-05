import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getUserPurchases } from '@/lib/purchases';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const purchases = await getUserPurchases(user.id);
    
    return NextResponse.json({ purchases });

  } catch (error: unknown) {
    const err = error as Error & { stack?: string };
    console.error('Get purchases error:', error);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json(
      { error: err.message || 'Failed to get purchases', purchases: [] },
      { status: 500 }
    );
  }
}

