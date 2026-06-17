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
- 🚧 **#13 — Fix low-quality mobile thumbnails + auto-compress to AVIF** (client-reported, fixing now)
  Root cause: admin cover-image uploads go straight to Firebase Storage with zero
  resizing/compression, and the `next/image` usage on the cards has no `sizes` prop
  with too-small intrinsic dimensions — `MusicListCard`'s image container goes
  full-width on mobile (`MusicListCard.css` ~L469) while the source is capped at a
  small density-descriptor size, so mobile gets the blurriest result. Porting the
  same `sharp`-based AVIF pipeline already running in the `hr` project
  (`src/lib/images.ts` + `/api/admin/compress`) so every upload is re-encoded
  server-side to a consistent quality/size, regardless of what the admin uploads.
  - [x] `sharp` dependency + `serverExternalPackages: ["sharp"]` in `next.config.ts`
  - [x] `compressToAvif` helper in `src/lib/images.ts`
  - [x] `/api/admin/compress` route (admin-session gated)
  - [x] Wire `AdminMusicTrackForm.tsx` cover upload through the compress endpoint
  - [x] Add `sizes` + correct intrinsic width/height to `MusicCard.tsx` and
    `MusicListCard.tsx` `<Image>` usage
  - [x] Backfilled all 11 existing tracks' cover images to AVIF
    (`scripts/backfill-avif-covers.js --apply`, ~2.6MB → ~130KB each,
    originals left in Storage untouched)
  - [x] Fixed `FUNCTION_PAYLOAD_TOO_LARGE` on Vercel: `/api/admin/compress`
    used to receive the raw file in the request body, which hits Vercel's
    hard 4.5MB function body cap. Now the client uploads the raw file to
    Storage directly (as before), then calls compress with just the Storage
    path; the server fetches/compresses/replaces via the Admin SDK
    (no body-size limit on that side).
  - [x] Fixed `ERR_DLOPEN_FAILED` (sharp's libvips missing on Vercel): added
    `outputFileTracingIncludes` in `next.config.ts` for `/api/admin/compress`
    so Vercel's file tracer force-includes sharp's native binary instead of
    silently dropping it (it's loaded via `dlopen`, which static tracing can miss).
  - [ ] Redeploy to Vercel and re-test a real upload (both fixes need a fresh
    deploy — if `ERR_DLOPEN_FAILED` somehow persists, redeploy once with
    Vercel's build cache disabled)

- 🚧 **#4 — Purchase confirmation email** (branded receipt + download link)
  Sent once from the fulfillment step (so it can't double-send), via the existing
  Proton SMTP transporter. Dark theme, electric-blue accent, stars, LemonMilk-style
  all-caps headings.
  - [ ] `sendPurchaseConfirmationEmail` template in `src/lib/email/index.ts`
  - [ ] Call it from `src/lib/fulfillment.ts` (non-blocking)

## Queued (approved — do next, in this order)
- ⏳ **#3 — Guest purchase recovery** (email the downloads / link guest orders to an account).
- 🚧 **#6 — Apple Pay / Google Pay + promo codes** at checkout.
  - [x] `allow_promotion_codes: true` on both checkout session creators (`src/lib/stripe.ts`)
  - [x] Apple Pay / Google Pay — no code needed. We use Stripe-hosted Checkout
    (redirect to `checkout.stripe.com`), where wallet buttons appear automatically
    for `'card'` on supported browsers/devices (Safari w/ Apple Pay, Chrome/Android
    w/ Google Pay). No domain registration required (that's only for embedded
    Payment Element on your own domain).
  - [ ] Test on a real Apple Pay (Safari/iOS) and Google Pay (Chrome/Android) device
  - [ ] Create at least one Coupon + Promotion Code in the Stripe Dashboard to test
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
