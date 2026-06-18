// Deactivate a Stripe promotion code (admin only). Stripe promotion codes can't
// be deleted, only set inactive — that immediately stops the code from working.
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });

  const { id } = await params;
  if (!id || !id.startsWith('promo_')) {
    return NextResponse.json({ error: 'Invalid promotion code id.' }, { status: 400 });
  }

  try {
    const promo = await stripe.promotionCodes.update(id, { active: false });
    return NextResponse.json({ id: promo.id, active: promo.active });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to deactivate coupon.' },
      { status: 502 }
    );
  }
}
