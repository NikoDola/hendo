# Hendo Store — Roadmap

Website improvements approved by the client (June 2026). Working through them one
at a time.

Legend: ✅ done · 🚧 in progress · ⏳ queued (approved) · 📌 pinned (revisit later)

## Done
- ✅ **#1 — Reliable webhook-based order fulfillment** (merged to `main`, commit `webhook stripe`)
  A Stripe `checkout.session.completed` webhook fulfills orders server-side, so a
  paying customer always gets their download even if they close the success tab,
  lose connection, or the redirect fails. Idempotent (no duplicate orders) and
  reused by the success page.
  - [x] Carry user/order info in checkout session metadata
  - [x] Shared, idempotent fulfillment module (`src/lib/fulfillment.ts`)
  - [x] `/api/stripe/webhook` route (Stripe signature verified)
  - [x] Refactor `verify-payment` to reuse the same fulfillment
  - **STILL TO DO (config, not code):** register the webhook endpoint at
    `https://thelegendofhendo.com/api/stripe/webhook` (event
    `checkout.session.completed`) and set `STRIPE_WEBHOOK_SECRET` (`whsec_…`) in Vercel.

## In progress
- 🚧 **#4 — Purchase confirmation email** (branded receipt + download link)
  Sent once from the fulfillment step (so it can't double-send), via the existing
  Proton SMTP transporter. Dark theme, electric-blue accent, stars, LemonMilk-style
  all-caps headings.
  - [ ] `sendPurchaseConfirmationEmail` template in `src/lib/email/index.ts`
  - [ ] Call it from `src/lib/fulfillment.ts` (non-blocking)

## Queued (approved — do next, in this order)
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
