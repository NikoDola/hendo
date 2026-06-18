// Dev/admin preview of the purchase-confirmation email templates so they can be
// viewed in a browser (and compared) without sending a real email.
//   ?template=v1       -> current design
//   ?template=v2       -> centered / white-stars / starfield design
//   (no param)         -> side-by-side compare view
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import {
  renderPurchaseConfirmationHtml,
  renderPurchaseConfirmationHtmlCentered,
  renderPurchaseConfirmationHtmlNeon,
  renderPurchaseConfirmationHtmlCosmic,
  type PurchaseConfirmationParams,
} from '@/lib/email';

export const runtime = 'nodejs';

const SAMPLE: PurchaseConfirmationParams = {
  to: 'preview@example.com',
  customerName: 'Alex Rivera',
  items: [
    { trackTitle: 'Flights Over Feelings', price: 250 },
    { trackTitle: 'Bae', price: 200 },
  ],
  amountTotal: 45000,
  currency: 'usd',
  orderId: 'cs_test_a1B2c3D4e5F6g7',
  dashboardUrl: 'https://thelegendofhendo.com/dashboard',
  downloadUrl: 'https://thelegendofhendo.com/download/sample.zip',
};

function htmlResponse(html: string) {
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  // Admin-gated, but always allowed in local dev for convenience.
  const admin = await getAdminFromSession();
  if (!admin && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const template = request.nextUrl.searchParams.get('template');

  if (template === 'v1') return htmlResponse(renderPurchaseConfirmationHtml(SAMPLE));
  if (template === 'v2') return htmlResponse(renderPurchaseConfirmationHtmlCentered(SAMPLE));
  if (template === 'v3') return htmlResponse(renderPurchaseConfirmationHtmlNeon(SAMPLE));
  if (template === 'v4') return htmlResponse(renderPurchaseConfirmationHtmlCosmic(SAMPLE));

  // Default: side-by-side compare of both versions in iframes.
  const compare = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email template comparison</title>
  <style>
    body { margin:0; background:#101216; color:#e6e9f2; font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif; }
    h1 { text-align:center; font-weight:600; padding:18px 0 4px; margin:0; font-size:18px; }
    p.note { text-align:center; color:#8a93a6; margin:0 0 16px; font-size:13px; }
    .grid { display:flex; flex-wrap:wrap; gap:16px; padding:0 16px 32px; justify-content:center; }
    .col { flex:1 1 460px; max-width:680px; }
    .col h2 { font-size:14px; font-weight:600; text-align:center; color:#aab1c4; margin:0 0 8px; }
    iframe { width:100%; height:1000px; border:1px solid #2a2f3a; border-radius:10px; background:#04050a; }
  </style>
</head>
<body>
  <h1>Purchase confirmation — template comparison</h1>
  <p class="note">V1 = current/live. V2 = centered + starfield. V3 = neon magenta. V4 = cosmic glass panel in a full starfield.</p>
  <div class="grid">
    <div class="col">
      <h2>V1 — current (live)</h2>
      <iframe src="?template=v1" title="V1"></iframe>
    </div>
    <div class="col">
      <h2>V2 — centered + starfield</h2>
      <iframe src="?template=v2" title="V2"></iframe>
    </div>
    <div class="col">
      <h2>V3 — neon magenta</h2>
      <iframe src="?template=v3" title="V3"></iframe>
    </div>
    <div class="col">
      <h2>V4 — cosmic</h2>
      <iframe src="?template=v4" title="V4"></iframe>
    </div>
  </div>
</body>
</html>`;
  return htmlResponse(compare);
}
