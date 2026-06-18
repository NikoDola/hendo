// Admin-only endpoint to create and list Stripe promotion codes (coupons),
// so the admin can manage discount codes from our dashboard instead of the
// Stripe dashboard. Each code is a Stripe Promotion Code wrapping a one-time
// percent-off Coupon.
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Shape returned to the admin UI for one promotion code. The underlying coupon
// (which holds percent_off) lives under `promotion.coupon`; it's only an object
// when expanded, so callers pass `fallbackPercentOff` for the just-created code.
function serialize(pc: import('stripe').Stripe.PromotionCode, fallbackPercentOff?: number) {
  const coupon =
    pc.promotion && typeof pc.promotion.coupon === 'object' ? pc.promotion.coupon : null;
  return {
    id: pc.id,
    code: pc.code,
    active: pc.active,
    percentOff: coupon?.percent_off ?? fallbackPercentOff ?? null,
    timesRedeemed: pc.times_redeemed,
    maxRedemptions: pc.max_redemptions ?? null,
    expiresAt: pc.expires_at ? pc.expires_at * 1000 : null,
    created: pc.created * 1000,
  };
}

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return bad('Unauthorized', 401);
  if (!stripe) return bad('Stripe is not configured.', 500);

  try {
    const list = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.promotion.coupon'],
    });
    return NextResponse.json({ codes: list.data.map((pc) => serialize(pc)) });
  } catch (e) {
    return bad(e instanceof Error ? e.message : 'Failed to list coupons.', 502);
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return bad('Unauthorized', 401);
  if (!stripe) return bad('Stripe is not configured.', 500);

  let body: { code?: unknown; percentOff?: unknown; maxRedemptions?: unknown; expiresAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad('Could not parse request body.');
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const percentOff = Number(body.percentOff);

  if (!code) return bad('A coupon code is required.');
  if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
    return bad('Percent off must be between 1 and 100.');
  }

  // Optional usage cap.
  let maxRedemptions: number | undefined;
  if (body.maxRedemptions != null && body.maxRedemptions !== '') {
    maxRedemptions = Number(body.maxRedemptions);
    if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
      return bad('Max redemptions must be a whole number of 1 or more.');
    }
  }

  // Optional expiry (stored on Stripe as a Unix timestamp in seconds).
  let expiresAtUnix: number | undefined;
  if (typeof body.expiresAt === 'string' && body.expiresAt.trim()) {
    const ts = new Date(body.expiresAt).getTime();
    if (Number.isNaN(ts)) return bad('Invalid expiry date.');
    if (ts <= Date.now()) return bad('Expiry must be in the future.');
    expiresAtUnix = Math.floor(ts / 1000);
  }

  try {
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: 'once',
      name: `${percentOff}% off`,
    });

    const promo = await stripe.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code,
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAtUnix ? { expires_at: expiresAtUnix } : {}),
    });

    return NextResponse.json({ code: serialize(promo, percentOff) });
  } catch (e) {
    // Stripe throws e.g. if the code already exists.
    return bad(e instanceof Error ? e.message : 'Failed to create coupon.', 502);
  }
}
