# Hendo Store — Roadmap

Website improvements approved by the client (June 2026). Working through them one
at a time.

Legend: ✅ done · 🚧 in progress · ⏳ queued (approved) · 📌 pinned (revisit later)

## In progress
- 🚧 **#1 — Reliable webhook-based order fulfillment**
  A Stripe `checkout.session.completed` webhook fulfills orders server-side, so a
  paying customer always gets their download even if they close the success tab,
  lose connection, or the redirect fails. Includes idempotency (no duplicate
  orders) and is reused by the success page.
  - [ ] Carry user/order info in checkout session metadata
  - [ ] Shared, idempotent fulfillment module
  - [ ] `/api/stripe/webhook` route (Stripe signature verified)
  - [ ] Refactor `verify-payment` to reuse the same fulfillment
  - **Vercel env var:** `STRIPE_WEBHOOK_SECRET` (value = the `whsec_…` signing
    secret from the Stripe webhook endpoint). Register the endpoint at
    `https://thelegendofhendo.com/api/stripe/webhook` for event
    `checkout.session.completed`.

## Queued (approved — do next, in this order)
- ⏳ **#4 — Purchase confirmation email** (receipt + download link via Resend). Pairs with #1.
- ⏳ **#3 — Guest purchase recovery** (email the downloads / link guest orders to an account).
- ⏳ **#6 — Apple Pay / Google Pay + promo codes** at checkout.
- ⏳ **#9 — Permanent re-downloads** (lifetime access to purchased files).

## Pinned (client said "put a pin on it" — not now)
- 📌 #5 — License tiers (MP3 / WAV / trackout / exclusive + real license PDF)
- 📌 #7 — Sales / revenue dashboard for the owner
- 📌 #8 — Server-side catalog search & pagination (scale)
- 📌 #10 — Automated tests for the payment path
- 📌 #11 — SEO pass (metadata, Open Graph, sitemap)
- 📌 #12 — Secrets hygiene + rotation (.env cleanup)

## Not doing
- ❌ #2 — Preview audio protection (client declined)
