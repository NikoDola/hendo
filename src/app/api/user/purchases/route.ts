import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getUserPurchases } from '@/lib/purchases';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Fetching purchases for user:', user.id, user.email);
    const purchases = await getUserPurchases(user.id);
    console.log('Found purchases:', purchases.length);
    
    return NextResponse.json({ purchases });

  } catch (error: any) {
    console.error('Get purchases error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to get purchases', purchases: [] },
      { status: 500 }
    );
  }
}

