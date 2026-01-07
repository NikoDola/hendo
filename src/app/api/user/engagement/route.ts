import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

type EngagementAction = 'favorite_add' | 'favorite_remove' | 'cart_add' | 'cart_remove';

type RateLimitKey = 'favorite' | 'cart';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIONS_PER_WINDOW = 50;

function nowMs() {
  return Date.now();
}

function getRateLimitKey(action: EngagementAction): RateLimitKey | null {
  if (action.startsWith('favorite_')) return 'favorite';
  if (action.startsWith('cart_')) return 'cart';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '') as EngagementAction;
    const trackId = String(body.trackId || '');

    if (!action || !trackId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateKey = getRateLimitKey(action);
    if (!rateKey) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();
    const userRef = db.collection('users').doc(user.id);
    const statsRef = db.collection('musicStats').doc(trackId);
    const favRef = statsRef.collection('favorites').doc(user.id);
    const cartRef = statsRef.collection('carts').doc(user.id);

    const isAdd = action.endsWith('_add');
    const isRemove = action.endsWith('_remove');

    // Enforce rate limit only for "add" actions (spamming toggles/removes shouldn't lock someone out)
    const shouldRateLimit = isAdd;

    const result = await db.runTransaction(async (tx) => {
      const now = nowMs();

      // IMPORTANT: Firestore transactions require all reads to be executed before all writes.
      // Read everything we might need up-front.
      const [userSnap, statsSnap, favSnap, cartSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(statsRef),
        tx.get(favRef),
        tx.get(cartRef),
      ]);

      const userData = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {};

      const rateLimits = (userData.engagementRateLimits as Record<string, unknown> | undefined) || {};
      const current = (rateLimits[rateKey] as Record<string, unknown> | undefined) || {};

      const windowStartMs = typeof current.windowStartMs === 'number' ? current.windowStartMs : 0;
      const windowCount = typeof current.windowCount === 'number' ? current.windowCount : 0;
      const cooldownUntilMs = typeof current.cooldownUntilMs === 'number' ? current.cooldownUntilMs : 0;

      if (shouldRateLimit && cooldownUntilMs && now < cooldownUntilMs) {
        return { blocked: true, cooldownUntilMs };
      }

      let nextWindowStartMs = windowStartMs;
      let nextWindowCount = windowCount;
      let nextCooldownUntilMs = cooldownUntilMs;

      if (shouldRateLimit) {
        if (!nextWindowStartMs || now - nextWindowStartMs > THREE_HOURS_MS) {
          nextWindowStartMs = now;
          nextWindowCount = 1;
        } else {
          nextWindowCount = nextWindowCount + 1;
        }

        if (nextWindowCount > MAX_ACTIONS_PER_WINDOW) {
          nextCooldownUntilMs = now + ONE_DAY_MS;
          tx.set(
            userRef,
            {
              engagementRateLimits: {
                ...rateLimits,
                [rateKey]: {
                  windowStartMs: nextWindowStartMs,
                  windowCount: nextWindowCount,
                  cooldownUntilMs: nextCooldownUntilMs,
                  lastUpdatedAtMs: now,
                },
              },
            },
            { merge: true }
          );
          return { blocked: true, cooldownUntilMs: nextCooldownUntilMs };
        }

        tx.set(
          userRef,
          {
            engagementRateLimits: {
              ...rateLimits,
              [rateKey]: {
                windowStartMs: nextWindowStartMs,
                windowCount: nextWindowCount,
                cooldownUntilMs: nextCooldownUntilMs || 0,
                lastUpdatedAtMs: now,
              },
            },
          },
          { merge: true }
        );
      }

      // Stats updates
      const statsData = statsSnap.exists ? (statsSnap.data() as Record<string, unknown>) : {};
      const favoriteCount = typeof statsData.favoriteCount === 'number' ? statsData.favoriteCount : 0;
      const cartCount = typeof statsData.cartCount === 'number' ? statsData.cartCount : 0;

      let nextFavoriteCount = favoriteCount;
      let nextCartCount = cartCount;

      if (action === 'favorite_add') {
        if (!favSnap.exists) {
          nextFavoriteCount = favoriteCount + 1;
          tx.set(statsRef, { favoriteCount: nextFavoriteCount }, { merge: true });
        }
        tx.set(
          favRef,
          {
            userId: user.id,
            authUid: user.authUid || null,
            email: user.email,
            name: user.name,
            lastActionAtMs: now,
          },
          { merge: true }
        );
      }

      if (action === 'favorite_remove') {
        if (favSnap.exists) {
          nextFavoriteCount = Math.max(0, favoriteCount - 1);
          tx.set(statsRef, { favoriteCount: nextFavoriteCount }, { merge: true });
          tx.delete(favRef);
        }
      }

      if (action === 'cart_add') {
        if (!cartSnap.exists) {
          nextCartCount = cartCount + 1;
          tx.set(statsRef, { cartCount: nextCartCount }, { merge: true });
        }
        tx.set(
          cartRef,
          {
            userId: user.id,
            authUid: user.authUid || null,
            email: user.email,
            name: user.name,
            lastActionAtMs: now,
          },
          { merge: true }
        );
      }

      if (action === 'cart_remove') {
        if (cartSnap.exists) {
          nextCartCount = Math.max(0, cartCount - 1);
          tx.set(statsRef, { cartCount: nextCartCount }, { merge: true });
          tx.delete(cartRef);
        }
      }

      return { blocked: false, favoriteCount: nextFavoriteCount, cartCount: nextCartCount };
    });

    if (result.blocked) {
      return NextResponse.json(
        { error: 'Rate limited', cooldownUntilMs: result.cooldownUntilMs },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      trackId,
      favoriteCount: (result as { favoriteCount?: number }).favoriteCount ?? null,
      cartCount: (result as { cartCount?: number }).cartCount ?? null,
      userId: user.id,
    });
  } catch (error) {
    console.error('Engagement tracking error:', error);
    const debugHeader = request.headers.get('x-debug-engagement') === '1';
    const isProd = process.env.NODE_ENV === 'production';
    // In dev, always return debug details to make setup issues easy to diagnose.
    if (!isProd || debugHeader) {
      const err = error as Error & { code?: unknown };
      return NextResponse.json(
        {
          error: 'Failed to record engagement',
          debug: {
            message: err?.message || String(error),
            name: err?.name,
            code: (err as { code?: unknown })?.code,
            stack: err?.stack,
          },
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Failed to record engagement' }, { status: 500 });
  }
}


