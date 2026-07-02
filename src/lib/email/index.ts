import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Small helpers (shared by templates)
// ---------------------------------------------------------------------------
//
// Dark-background rule for every template in this file: Gmail's mobile apps
// (and some other clients) rewrite background-color in dark mode and can flip
// an all-dark email to white — but they never touch background-image. So each
// dark surface sets its color twice: background-color plus an opaque
// linear-gradient() of the same color. Tables also carry a bgcolor attribute
// as a fallback for clients that strip style attributes.

/** Escape user-controlled strings before interpolating into email HTML. */
function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format an amount in the smallest currency unit (cents) as e.g. "$12.00". */
function formatMoney(cents: number, currency: string = 'usd'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format((cents || 0) / 100);
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  }
}

// Create Proton Mail SMTP transporter
const createTransporter = () => {
  if (!process.env.PROTON_SMTP_USER || !process.env.PROTON_SMTP_TOKEN) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.PROTON_SMTP_HOST || 'smtp.protonmail.ch',
    port: parseInt(process.env.PROTON_SMTP_PORT || '587'),
    secure: false, // false for port 587 (uses STARTTLS), true for port 465
    auth: {
      user: process.env.PROTON_SMTP_USER,
      pass: process.env.PROTON_SMTP_TOKEN,
    },
  });
};

export async function sendVerificationEmail(email: string, verificationToken: string) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Proton Mail SMTP not configured');
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const info = await transporter.sendMail({
      from: `T. HENDO <${process.env.PROTON_SMTP_USER}>`,
      to: email,
      subject: 'Verify your email - T. HENDO Newsletter',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Verify your email</title>
  <style> body { margin:0; padding:0; background-color:#000000; } </style>
</head>
<body bgcolor="#000000" style="margin:0;padding:0;background-color:#000000;background-image:linear-gradient(#000000,#000000);">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000;background-image:linear-gradient(#000000,#000000);">
    <tr>
      <td align="center" style="padding:0;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; background-image: linear-gradient(#000000,#000000); color: #fff; text-align: left;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">T. HENDO</h1>
          </div>

          <div style="background-color: #1a1a1a; background-image: linear-gradient(#1a1a1a,#1a1a1a); padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #fff; margin-top: 0;">Welcome to T. HENDO Newsletter!</h2>
            
            <p style="color: #ccc; line-height: 1.6; margin-bottom: 25px;">
              Thank you for subscribing to our newsletter. To complete your subscription and start receiving updates, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #ffd700; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, you can also copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #ffd700; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
              This email was sent because you subscribed to the T. HENDO newsletter. If you didn't subscribe, you can safely ignore this email.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Proton Mail SMTP not configured');
    }

    const info = await transporter.sendMail({
      from: `T. HENDO <${process.env.PROTON_SMTP_USER}>`,
      to: email,
      subject: 'Welcome to T. HENDO Newsletter! 🎉',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to T. HENDO</title>
  <style> body { margin:0; padding:0; background-color:#000000; } </style>
</head>
<body bgcolor="#000000" style="margin:0;padding:0;background-color:#000000;background-image:linear-gradient(#000000,#000000);">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000;background-image:linear-gradient(#000000,#000000);">
    <tr>
      <td align="center" style="padding:0;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; background-image: linear-gradient(#000000,#000000); color: #fff; text-align: left;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">T. HENDO</h1>
          </div>

          <div style="background-color: #1a1a1a; background-image: linear-gradient(#1a1a1a,#1a1a1a); padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #fff; margin-top: 0;">Welcome to T. HENDO! 🎉</h2>
            
            <p style="color: #ccc; line-height: 1.6; margin-bottom: 25px;">
              Thank you for verifying your email and joining our newsletter! You're now part of the T. HENDO community and will receive updates about our latest products, news, and exclusive offers.
            </p>
            
            <div style="background-color: #2a2a2a; background-image: linear-gradient(#2a2a2a,#2a2a2a); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ffd700; margin-top: 0;">What to expect:</h3>
              <ul style="color: #ccc; line-height: 1.6;">
                <li>Latest product launches and updates</li>
                <li>Exclusive discounts and offers</li>
                <li>Behind-the-scenes content</li>
                <li>Community highlights</li>
              </ul>
            </div>
            
            <p style="color: #ccc; line-height: 1.6;">
              We're excited to have you on board! If you have any questions or feedback, feel free to reach out to us.
            </p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this email because you subscribed to the T. HENDO newsletter.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    throw error;
  }
}

/** Dark, on-brand contact-form notification (sent to the T. HENDO inbox). */
export function renderContactNotificationHtml(
  name: string,
  email: string,
  message: string,
  currentTime: string
): string {
  const headFont =
    "'Montserrat','Century Gothic','Trebuchet MS','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Montserrat','Century Gothic','Helvetica Neue',Arial,sans-serif";
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const initial = escapeHtml((name.trim().charAt(0) || '?').toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>New contact message</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap');
    body { margin:0; padding:0; background-color:#04050a; }
    @media (max-width:600px) {
      .container { width:100% !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
    }
  </style>
</head>
<body bgcolor="#04050a" style="margin:0;padding:0;background-color:#04050a;background-image:linear-gradient(#04050a,#04050a);">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">New message from ${safeName} via Dreamstation.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#04050a" style="background-color:#04050a;background-image:radial-gradient(circle at 18% 12%, rgba(0,85,255,0.20), transparent 42%), radial-gradient(circle at 85% 4%, rgba(0,85,255,0.12), transparent 38%), linear-gradient(#04050a,#04050a);">
    <tr>
      <td align="center" style="padding:34px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header -->
          <tr>
            <td align="center" class="px" style="padding:6px 40px 26px;">
              <div style="font-family:${headFont};color:#5e7cff;font-size:15px;letter-spacing:0.55em;">&#10022;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;<span style="color:#ffffff;font-size:26px;line-height:1;text-shadow:0 0 6px #ffffff,0 0 12px #5e7cff,0 0 20px #5e7cff;">&#10038;</span>&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#10022;</div>
              <div style="font-family:${headFont};color:#ffffff;font-size:36px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;margin-top:16px;">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:#5e7cff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.42em;margin-top:8px;">Dreamstation</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0d15" style="background-color:#0a0d15;background-image:linear-gradient(#0a0d15,#0a0d15);border:1px solid #1c2333;border-radius:16px;">

                <tr>
                  <td class="px" style="padding:38px 40px 6px;">
                    <div style="font-family:${headFont};color:#ffffff;font-size:25px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">New Message</div>
                    <p style="font-family:${bodyFont};color:#aab1c4;font-size:15px;line-height:1.7;margin:14px 0 0;">
                      A message from <strong style="color:#ffffff;">${safeName}</strong> has been received. Reply at your earliest convenience.
                    </p>
                  </td>
                </tr>

                <!-- Reply button -->
                <tr>
                  <td align="center" class="px" style="padding:26px 40px 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#0055ff" style="border-radius:10px;box-shadow:0 0 22px rgba(0,85,255,0.45);">
                          <a href="mailto:${safeEmail}?subject=Re: Your message to T. HENDO" style="display:inline-block;padding:16px 38px;font-family:${headFont};color:#ffffff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;border-radius:10px;">Reply to ${safeName}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Sender -->
                <tr>
                  <td class="px" style="padding:0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1c2333;border-bottom:1px solid #1c2333;">
                      <tr>
                        <td width="52" valign="top" style="padding:18px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" valign="middle" width="44" height="44" bgcolor="#0055ff" style="width:44px;height:44px;border-radius:50%;font-family:${headFont};color:#ffffff;font-size:18px;font-weight:800;">${initial}</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding:18px 0 18px 14px;">
                          <div style="font-family:${headFont};color:#ffffff;font-size:16px;font-weight:700;">${safeName}</div>
                          <div style="font-family:${bodyFont};font-size:14px;"><a href="mailto:${safeEmail}" style="color:#5e7cff;text-decoration:none;">${safeEmail}</a></div>
                          <div style="font-family:${bodyFont};color:#6b7280;font-size:12px;margin-top:2px;">${escapeHtml(currentTime)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td class="px" style="padding:24px 40px 34px;">
                    <div style="font-family:${headFont};color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;margin-bottom:10px;">Message</div>
                    <div style="font-family:${bodyFont};color:#cdd3e0;font-size:15px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(message)}</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="px" style="padding:28px 40px 8px;">
              <div style="font-family:${headFont};color:#3a4256;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.32em;">&#10022;&nbsp;&nbsp;The Legend of Hendo&nbsp;&nbsp;&#10022;</div>
              <p style="font-family:${bodyFont};color:#525a6e;font-size:11px;line-height:1.6;margin:14px 0 0;">
                Sent from the contact form at thelegendofhendo.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactEmail(name: string, email: string, message: string) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Proton Mail SMTP not configured');
    }

    // Where contact form notifications should be delivered.
    // Prefer a private server-side env var, then fall back to the authenticated Proton inbox.
    // (NEXT_PUBLIC_* is optional but not recommended for "owner" emails.)
    const ownerEmail = process.env.PROTON_SMTP_USER;
    const recipientEmail =
      process.env.CONTACT_EMAIL ||
      ownerEmail ||
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
      'thanzoproject@gmail.com';
    const currentTime = new Date().toLocaleString();

    const info = await transporter.sendMail({
      from: `${name} via Dreamstation (${email}) <${process.env.PROTON_SMTP_USER}>`,
      to: recipientEmail,
      // If the main recipient is not the Proton inbox, still send a private copy there.
      ...(ownerEmail && ownerEmail !== recipientEmail ? { bcc: ownerEmail } : {}),
      replyTo: email,
      subject: `Contact Us: ${name} <${email}>`,
      html: renderContactNotificationHtml(name, email, message, currentTime),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact email sending error:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Purchase confirmation (receipt + downloads)
// ---------------------------------------------------------------------------

export interface PurchaseConfirmationParams {
  to: string;
  customerName?: string;
  items: Array<{ trackTitle: string; price: number }>;
  /** Total actually charged, in the smallest currency unit (cents). Falls back to summing items. */
  amountTotal?: number | null;
  currency?: string | null;
  orderId: string;
  /** Where the buyer can always re-download (their dashboard). */
  dashboardUrl: string;
  /** Optional direct ZIP link (time-limited signed URL). */
  downloadUrl?: string;
}

export function renderPurchaseConfirmationHtml(params: PurchaseConfirmationParams): string {
  const {
    customerName,
    items,
    amountTotal,
    currency,
    orderId,
    dashboardUrl,
    downloadUrl,
  } = params;

  // LemonMilk-style: geometric, all-caps. Montserrat loads where allowed; the
  // rest of the stack keeps the geometric all-caps feel in Gmail/Outlook.
  const headFont =
    "'Montserrat','Century Gothic','Trebuchet MS','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Montserrat','Century Gothic','Helvetica Neue',Arial,sans-serif";

  const greetingName = customerName ? `, ${escapeHtml(customerName.split(' ')[0])}` : '';

  const totalCents =
    typeof amountTotal === 'number' && amountTotal > 0
      ? amountTotal
      : Math.round(items.reduce((sum, i) => sum + (Number(i.price) || 0), 0) * 100);
  const totalLabel = formatMoney(totalCents, currency || 'usd');

  const itemRows = items
    .map(
      (i) => `
            <tr>
              <td class="bd" style="font-family:${bodyFont};color:#cdd3e0;font-size:14px;padding:12px 0;border-bottom:1px solid #161b27;">${escapeHtml(
        i.trackTitle
      )}</td>
              <td class="bd" align="right" style="font-family:${bodyFont};color:#cdd3e0;font-size:14px;padding:12px 0;border-bottom:1px solid #161b27;white-space:nowrap;">${formatMoney(
        Math.round((Number(i.price) || 0) * 100),
        currency || 'usd'
      )}</td>
            </tr>`
    )
    .join('');

  const directDownloadLine = downloadUrl
    ? `<br><span style="color:#6b7280;">Direct download (link expires in 7 days): </span><a href="${downloadUrl}" style="color:#4d8bff;text-decoration:none;">Download .ZIP</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your T. HENDO order</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap');
    body { margin:0; padding:0; background-color:#04050a; }
    @media (max-width:600px) {
      .container { width:100% !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
    }
  </style>
</head>
<body bgcolor="#04050a" style="margin:0;padding:0;background-color:#04050a;background-image:linear-gradient(#04050a,#04050a);">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Payment confirmed — your beats are ready to download.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#04050a" style="background-color:#04050a;background-image:radial-gradient(circle at 18% 12%, rgba(0,85,255,0.20), transparent 42%), radial-gradient(circle at 85% 4%, rgba(0,85,255,0.12), transparent 38%), linear-gradient(#04050a,#04050a);">
    <tr>
      <td align="center" style="padding:34px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header: stars + wordmark (shining star in the middle of the diamonds) -->
          <tr>
            <td align="center" class="px" style="padding:6px 40px 26px;">
              <div style="font-family:${headFont};color:#5e7cff;font-size:15px;letter-spacing:0.55em;">&#10022;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;<span style="color:#ffffff;font-size:26px;line-height:1;text-shadow:0 0 6px #ffffff,0 0 12px #5e7cff,0 0 20px #5e7cff;">&#10038;</span>&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#10022;</div>
              <div style="font-family:${headFont};color:#ffffff;font-size:36px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;margin-top:16px;">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:#5e7cff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.42em;margin-top:8px;">Dreamstation</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0d15" style="background-color:#0a0d15;background-image:linear-gradient(#0a0d15,#0a0d15);border:1px solid #1c2333;border-radius:16px;">

                <tr>
                  <td class="px" style="padding:38px 40px 6px;">
                    <div style="font-family:${headFont};color:#ffffff;font-size:25px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Payment Confirmed</div>
                    <p class="bd" style="font-family:${bodyFont};color:#aab1c4;font-size:15px;line-height:1.7;margin:14px 0 0;">
                      Thank you${greetingName}. Your purchase is complete and your tracks are ready to download.
                    </p>
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" class="px" style="padding:26px 40px 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#0055ff" style="border-radius:10px;box-shadow:0 0 22px rgba(0,85,255,0.45);">
                          <a href="${dashboardUrl}" style="display:inline-block;padding:16px 38px;font-family:${headFont};color:#ffffff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;border-radius:10px;">Get Your Downloads</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order summary -->
                <tr>
                  <td class="px" style="padding:0 40px;">
                    <div style="font-family:${headFont};color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;padding-bottom:6px;border-bottom:1px solid #1c2333;">Order Summary</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${itemRows}
                      <tr>
                        <td class="bd" style="font-family:${headFont};color:#ffffff;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:16px 0 0;">Total</td>
                        <td class="bd" align="right" style="font-family:${headFont};color:#5e7cff;font-size:18px;font-weight:800;padding:16px 0 0;white-space:nowrap;">${totalLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Meta -->
                <tr>
                  <td class="px" style="padding:24px 40px 34px;">
                    <p class="bd" style="font-family:${bodyFont};color:#6b7280;font-size:12px;line-height:1.7;margin:0;">
                      Order reference: ${escapeHtml(orderId)}${directDownloadLine}
                    </p>
                    <p class="bd" style="font-family:${bodyFont};color:#6b7280;font-size:12px;line-height:1.7;margin:14px 0 0;">
                      You can re-download your tracks anytime from your dashboard.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="px" style="padding:28px 40px 8px;">
              <div style="font-family:${headFont};color:#3a4256;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.32em;">&#10022;&nbsp;&nbsp;The Legend of Hendo&nbsp;&nbsp;&#10022;</div>
              <p class="bd" style="font-family:${bodyFont};color:#525a6e;font-size:11px;line-height:1.6;margin:14px 0 0;">
                You received this email because you made a purchase at thelegendofhendo.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Alternative purchase-confirmation layout (V2) for comparison:
 *  - everything center-aligned
 *  - white decorative stars (instead of blue)
 *  - a starfield scattered across the whole card
 *
 * Email-client note: a real `position:absolute` overlay is not reliable in email
 * (Gmail strips it, Outlook ignores it). Instead the starfield is a TILED CSS
 * background (radial-gradient dots) on the card cell — it renders in Apple Mail,
 * iOS Mail and mostly Gmail, and gracefully falls back to the solid dark card in
 * Outlook. This is the closest email-safe equivalent of "stars all over the card".
 */
export function renderPurchaseConfirmationHtmlCentered(params: PurchaseConfirmationParams): string {
  const { customerName, items, amountTotal, currency, orderId, dashboardUrl, downloadUrl } = params;

  const headFont =
    "'Montserrat','Century Gothic','Trebuchet MS','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Montserrat','Century Gothic','Helvetica Neue',Arial,sans-serif";

  const greetingName = customerName ? `, ${escapeHtml(customerName.split(' ')[0])}` : '';

  const totalCents =
    typeof amountTotal === 'number' && amountTotal > 0
      ? amountTotal
      : Math.round(items.reduce((sum, i) => sum + (Number(i.price) || 0), 0) * 100);
  const totalLabel = formatMoney(totalCents, currency || 'usd');

  // Centered item blocks (title above price), instead of a left/right two-column row.
  const itemBlocks = items
    .map(
      (i) => `
            <div style="padding:13px 0;border-bottom:1px solid #161b27;">
              <div style="font-family:${bodyFont};color:#e6e9f2;font-size:15px;line-height:1.4;">${escapeHtml(
        i.trackTitle
      )}</div>
              <div style="font-family:${headFont};color:#5e7cff;font-size:14px;font-weight:700;margin-top:5px;">${formatMoney(
        Math.round((Number(i.price) || 0) * 100),
        currency || 'usd'
      )}</div>
            </div>`
    )
    .join('');

  const directDownloadLine = downloadUrl
    ? `<br><span style="color:#6b7280;">Direct download (link expires in 7 days): </span><a href="${downloadUrl}" style="color:#4d8bff;text-decoration:none;">Download .ZIP</a>`
    : '';

  // Tiled white-star background for the card. background-color is the Outlook fallback.
  const cardStarfield =
    'background-color:#0a0d15;' +
    'background-image:' +
    'radial-gradient(1.6px 1.6px at 25px 35px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1.2px 1.2px at 95px 110px,rgba(255,255,255,0.55) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 160px 60px,rgba(255,255,255,0.45) 50%,transparent 51%),' +
    'radial-gradient(2px 2px at 130px 165px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 55px 150px,rgba(255,255,255,0.4) 50%,transparent 51%),' +
    'radial-gradient(1.4px 1.4px at 182px 95px,rgba(255,255,255,0.6) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 15px 90px,rgba(255,255,255,0.35) 50%,transparent 51%),' +
    'linear-gradient(#0a0d15,#0a0d15);' +
    'background-size:200px 200px;background-repeat:repeat;' +
    'border:1px solid #1c2333;border-radius:16px;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your T. HENDO order</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap');
    body { margin:0; padding:0; background-color:#04050a; }
    @media (max-width:600px) {
      .container { width:100% !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
    }
  </style>
</head>
<body bgcolor="#04050a" style="margin:0;padding:0;background-color:#04050a;background-image:linear-gradient(#04050a,#04050a);">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Payment confirmed — your beats are ready to download.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#04050a" style="background-color:#04050a;background-image:radial-gradient(circle at 50% 0%, rgba(0,85,255,0.16), transparent 46%), linear-gradient(#04050a,#04050a);">
    <tr>
      <td align="center" style="padding:34px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header: white stars + wordmark -->
          <tr>
            <td align="center" class="px" style="padding:6px 40px 26px;text-align:center;">
              <div style="font-family:${headFont};color:#ffffff;font-size:15px;letter-spacing:0.55em;">&#10022;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#8902;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#10022;</div>
              <div style="font-family:${headFont};color:#ffffff;font-size:36px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;margin-top:16px;">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:#5e7cff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.42em;margin-top:8px;">Dreamstation</div>
            </td>
          </tr>

          <!-- Card with starfield -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${cardStarfield}">

                <tr>
                  <td class="px" align="center" style="padding:38px 40px 6px;text-align:center;">
                    <div style="font-family:${headFont};color:#ffffff;font-size:25px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Payment Confirmed</div>
                    <p class="bd" style="font-family:${bodyFont};color:#aab1c4;font-size:15px;line-height:1.7;margin:14px 0 0;">
                      Thank you${greetingName}. Your purchase is complete and your tracks are ready to download.
                    </p>
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" class="px" style="padding:26px 40px 30px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" bgcolor="#0055ff" style="border-radius:10px;box-shadow:0 0 22px rgba(0,85,255,0.45);">
                          <a href="${dashboardUrl}" style="display:inline-block;padding:16px 38px;font-family:${headFont};color:#ffffff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;border-radius:10px;">Get Your Downloads</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order summary (centered) -->
                <tr>
                  <td class="px" align="center" style="padding:0 40px;text-align:center;">
                    <div style="font-family:${headFont};color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;padding-bottom:6px;border-bottom:1px solid #1c2333;">Order Summary</div>
                    ${itemBlocks}
                    <div style="padding:16px 0 0;">
                      <div style="font-family:${headFont};color:#ffffff;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Total</div>
                      <div style="font-family:${headFont};color:#5e7cff;font-size:20px;font-weight:800;margin-top:4px;">${totalLabel}</div>
                    </div>
                  </td>
                </tr>

                <!-- Meta -->
                <tr>
                  <td class="px" align="center" style="padding:24px 40px 34px;text-align:center;">
                    <p class="bd" style="font-family:${bodyFont};color:#6b7280;font-size:12px;line-height:1.7;margin:0;">
                      Order reference: ${escapeHtml(orderId)}${directDownloadLine}
                    </p>
                    <p class="bd" style="font-family:${bodyFont};color:#6b7280;font-size:12px;line-height:1.7;margin:14px 0 0;">
                      You can re-download your tracks anytime from your dashboard.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="px" style="padding:28px 40px 8px;text-align:center;">
              <div style="font-family:${headFont};color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.32em;">&#10022;&nbsp;&nbsp;The Legend of Hendo&nbsp;&nbsp;&#10022;</div>
              <p class="bd" style="font-family:${bodyFont};color:#525a6e;font-size:11px;line-height:1.6;margin:14px 0 0;">
                You received this email because you made a purchase at thelegendofhendo.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Purchase-confirmation layout (V3): V2's centered design + card starfield, but
 *  - neon magenta accent (button, price, download link, footer stars) instead of blue
 *  - no decorative star row above the wordmark
 *  - brighter, slightly larger body/footer text for readability
 *  - resequenced: order summary first, then the download CTA
 */
export function renderPurchaseConfirmationHtmlNeon(params: PurchaseConfirmationParams): string {
  const { customerName, items, amountTotal, currency, orderId, dashboardUrl, downloadUrl } = params;

  const headFont =
    "'Montserrat','Century Gothic','Trebuchet MS','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Montserrat','Century Gothic','Helvetica Neue',Arial,sans-serif";

  // Neon magenta palette (replaces the blue accents).
  const neon = '#ff1fd0'; // button fill + glow
  const neonBright = '#ff66e6'; // price, stars, subtitle (brighter = readable on dark)
  const neonLink = '#ff8cec'; // download link

  const greetingName = customerName ? `, ${escapeHtml(customerName.split(' ')[0])}` : '';

  const totalCents =
    typeof amountTotal === 'number' && amountTotal > 0
      ? amountTotal
      : Math.round(items.reduce((sum, i) => sum + (Number(i.price) || 0), 0) * 100);
  const totalLabel = formatMoney(totalCents, currency || 'usd');

  const itemBlocks = items
    .map(
      (i) => `
            <div style="padding:13px 0;border-bottom:1px solid #1b2030;">
              <div style="font-family:${bodyFont};color:#eef1f8;font-size:15px;line-height:1.4;">${escapeHtml(
        i.trackTitle
      )}</div>
              <div style="font-family:${headFont};color:${neonBright};font-size:14px;font-weight:700;margin-top:5px;">${formatMoney(
        Math.round((Number(i.price) || 0) * 100),
        currency || 'usd'
      )}</div>
            </div>`
    )
    .join('');

  const directDownloadLine = downloadUrl
    ? `<br><span style="color:#9aa3b8;">Direct download (link expires in 7 days): </span><a href="${downloadUrl}" style="color:${neonLink};text-decoration:none;font-weight:700;">Download .ZIP</a>`
    : '';

  // Same loved white starfield from V2.
  const cardStarfield =
    'background-color:#0a0d15;' +
    'background-image:' +
    'radial-gradient(1.6px 1.6px at 25px 35px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1.2px 1.2px at 95px 110px,rgba(255,255,255,0.55) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 160px 60px,rgba(255,255,255,0.45) 50%,transparent 51%),' +
    'radial-gradient(2px 2px at 130px 165px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 55px 150px,rgba(255,255,255,0.4) 50%,transparent 51%),' +
    'radial-gradient(1.4px 1.4px at 182px 95px,rgba(255,255,255,0.6) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 15px 90px,rgba(255,255,255,0.35) 50%,transparent 51%),' +
    'linear-gradient(#0a0d15,#0a0d15);' +
    'background-size:200px 200px;background-repeat:repeat;' +
    'border:1px solid #241a30;border-radius:16px;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your T. HENDO order</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap');
    body { margin:0; padding:0; background-color:#04050a; }
    @media (max-width:600px) {
      .container { width:100% !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
    }
  </style>
</head>
<body bgcolor="#04050a" style="margin:0;padding:0;background-color:#04050a;background-image:linear-gradient(#04050a,#04050a);">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Payment confirmed — your beats are ready to download.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#04050a" style="background-color:#04050a;background-image:radial-gradient(circle at 50% 0%, rgba(255,31,208,0.16), transparent 46%), linear-gradient(#04050a,#04050a);">
    <tr>
      <td align="center" style="padding:34px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header: wordmark only (no star row) -->
          <tr>
            <td align="center" class="px" style="padding:14px 40px 26px;text-align:center;">
              <div style="font-family:${headFont};color:#ffffff;font-size:38px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:${neonBright};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.42em;margin-top:10px;">Dreamstation</div>
            </td>
          </tr>

          <!-- Card with starfield -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${cardStarfield}">

                <tr>
                  <td class="px" align="center" style="padding:38px 40px 6px;text-align:center;">
                    <div style="font-family:${headFont};color:#ffffff;font-size:25px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Payment Confirmed</div>
                    <p style="font-family:${bodyFont};color:#cdd5e6;font-size:15px;line-height:1.7;margin:14px 0 0;">
                      Thank you${greetingName}. Your purchase is complete and your tracks are ready to download.
                    </p>
                  </td>
                </tr>

                <!-- Order summary (centered) -->
                <tr>
                  <td class="px" align="center" style="padding:28px 40px 0;text-align:center;">
                    <div style="font-family:${headFont};color:#9aa3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;padding-bottom:6px;border-bottom:1px solid #241a30;">Order Summary</div>
                    ${itemBlocks}
                    <div style="padding:18px 0 0;">
                      <div style="font-family:${headFont};color:#ffffff;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Total</div>
                      <div style="font-family:${headFont};color:${neonBright};font-size:22px;font-weight:800;margin-top:4px;">${totalLabel}</div>
                    </div>
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" class="px" style="padding:28px 40px 34px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" bgcolor="${neon}" style="border-radius:10px;box-shadow:0 0 24px rgba(255,31,208,0.5);">
                          <a href="${dashboardUrl}" style="display:inline-block;padding:16px 40px;font-family:${headFont};color:#ffffff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;border-radius:10px;">Get Your Downloads</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Meta -->
                <tr>
                  <td class="px" align="center" style="padding:0 40px 34px;text-align:center;border-top:1px solid #1b2030;">
                    <p style="font-family:${bodyFont};color:#9aa3b8;font-size:13px;line-height:1.7;margin:22px 0 0;">
                      Order reference: ${escapeHtml(orderId)}${directDownloadLine}
                    </p>
                    <p style="font-family:${bodyFont};color:#9aa3b8;font-size:13px;line-height:1.7;margin:14px 0 0;">
                      You can re-download your tracks anytime from your dashboard.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="px" style="padding:28px 40px 8px;text-align:center;">
              <div style="font-family:${headFont};color:${neonBright};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.32em;">&#10022;&nbsp;&nbsp;The Legend of Hendo&nbsp;&nbsp;&#10022;</div>
              <p style="font-family:${bodyFont};color:#aab1c4;font-size:13px;line-height:1.6;margin:14px 0 0;">
                You received this email because you made a purchase at thelegendofhendo.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Purchase-confirmation layout (V4): a different concept.
 *  - The whole email background is a multi-colour starfield (white + violet +
 *    cyan), so the content "floats in the cosmos" rather than sitting in a box.
 *  - A glowing hero star emblem over the wordmark.
 *  - A translucent "glass" panel (with a solid bgcolor fallback for Outlook).
 *  - Violet neon accent + a sparkle divider.
 * Email-safe: starfield + glow degrade gracefully (Outlook shows the solid
 * dark fallbacks); no absolute positioning anywhere.
 */
export function renderPurchaseConfirmationHtmlCosmic(params: PurchaseConfirmationParams): string {
  const { customerName, items, amountTotal, currency, orderId, dashboardUrl, downloadUrl } = params;

  const headFont =
    "'Montserrat','Century Gothic','Trebuchet MS','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Montserrat','Century Gothic','Helvetica Neue',Arial,sans-serif";

  const violet = '#9d6bff'; // button + emblem
  const violetBright = '#b794ff'; // price / accents
  const cyan = '#5fe6ff'; // secondary sparkle
  const greetingName = customerName ? `, ${escapeHtml(customerName.split(' ')[0])}` : '';

  const totalCents =
    typeof amountTotal === 'number' && amountTotal > 0
      ? amountTotal
      : Math.round(items.reduce((sum, i) => sum + (Number(i.price) || 0), 0) * 100);
  const totalLabel = formatMoney(totalCents, currency || 'usd');

  const itemBlocks = items
    .map(
      (i) => `
            <div style="padding:13px 0;border-bottom:1px solid rgba(157,107,255,0.18);">
              <div style="font-family:${bodyFont};color:#edf0f8;font-size:15px;line-height:1.4;">${escapeHtml(
        i.trackTitle
      )}</div>
              <div style="font-family:${headFont};color:${violetBright};font-size:14px;font-weight:700;margin-top:5px;">${formatMoney(
        Math.round((Number(i.price) || 0) * 100),
        currency || 'usd'
      )}</div>
            </div>`
    )
    .join('');

  const directDownloadLine = downloadUrl
    ? `<br><span style="color:#9aa0b6;">Direct download (link expires in 7 days): </span><a href="${downloadUrl}" style="color:${cyan};text-decoration:none;font-weight:700;">Download .ZIP</a>`
    : '';

  // Full-email multi-colour starfield (the new "interesting" treatment).
  const cosmosBg =
    'background-color:#05060d;' +
    'background-image:' +
    'radial-gradient(1.6px 1.6px at 30px 40px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1.3px 1.3px at 110px 90px,rgba(157,107,255,0.75) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 185px 150px,rgba(95,230,255,0.6) 50%,transparent 51%),' +
    'radial-gradient(2px 2px at 70px 175px,#ffffff 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 150px 28px,rgba(255,255,255,0.5) 50%,transparent 51%),' +
    'radial-gradient(1.4px 1.4px at 225px 80px,rgba(157,107,255,0.6) 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 40px 120px,rgba(95,230,255,0.45) 50%,transparent 51%),' +
    'radial-gradient(1.2px 1.2px at 250px 185px,#ffffff 50%,transparent 51%),' +
    'linear-gradient(#05060d,#05060d);' +
    'background-size:260px 220px;background-repeat:repeat;';

  // Translucent glass panel — bgcolor attribute is the Outlook fallback.
  const glassPanel =
    'background-color:rgba(10,12,22,0.72);' +
    'border:1px solid rgba(157,107,255,0.35);' +
    'border-radius:18px;' +
    'box-shadow:0 0 40px rgba(157,107,255,0.22);';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your T. HENDO order</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap');
    body { margin:0; padding:0; background-color:#05060d; }
    @media (max-width:600px) {
      .container { width:100% !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
    }
  </style>
</head>
<body bgcolor="#05060d" style="margin:0;padding:0;background-color:#05060d;background-image:linear-gradient(#05060d,#05060d);">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Payment confirmed — your beats are ready to download.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#05060d" style="${cosmosBg}">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Hero: glowing star emblem + wordmark -->
          <tr>
            <td align="center" class="px" style="padding:6px 40px 30px;text-align:center;">
              <div style="font-family:${headFont};color:${violetBright};font-size:46px;line-height:1;text-shadow:0 0 22px rgba(157,107,255,0.85);">&#10022;</div>
              <div style="font-family:${headFont};color:#ffffff;font-size:38px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;margin-top:18px;text-shadow:0 0 26px rgba(157,107,255,0.45);">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:${cyan};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5em;margin-top:12px;">Dreamstation &#8226; Order Confirmed</div>
            </td>
          </tr>

          <!-- Glass panel floating in the starfield -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0c16" style="${glassPanel}">

                <tr>
                  <td class="px" align="center" style="padding:36px 40px 0;text-align:center;">
                    <div style="font-family:${headFont};color:#ffffff;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Payment Confirmed</div>
                    <p style="font-family:${bodyFont};color:#d4d9e8;font-size:15px;line-height:1.7;margin:14px 0 0;">
                      Thank you${greetingName}. Your purchase is complete and your tracks are ready to download.
                    </p>
                    <div style="font-family:${headFont};color:rgba(183,148,255,0.85);font-size:13px;letter-spacing:0.55em;padding:22px 0 4px;">&#8226;&nbsp;&#10022;&nbsp;&#8226;</div>
                  </td>
                </tr>

                <!-- Order summary -->
                <tr>
                  <td class="px" align="center" style="padding:6px 40px 0;text-align:center;">
                    <div style="font-family:${headFont};color:#9aa0b6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;padding-bottom:6px;border-bottom:1px solid rgba(157,107,255,0.25);">Order Summary</div>
                    ${itemBlocks}
                    <div style="padding:18px 0 0;">
                      <div style="font-family:${headFont};color:#ffffff;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Total</div>
                      <div style="font-family:${headFont};color:${violetBright};font-size:22px;font-weight:800;margin-top:4px;text-shadow:0 0 18px rgba(157,107,255,0.5);">${totalLabel}</div>
                    </div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" class="px" style="padding:30px 40px 34px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td align="center" bgcolor="${violet}" style="border-radius:40px;box-shadow:0 0 26px rgba(157,107,255,0.6);">
                          <a href="${dashboardUrl}" style="display:inline-block;padding:16px 42px;font-family:${headFont};color:#ffffff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;border-radius:40px;">Get Your Downloads</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Meta -->
                <tr>
                  <td class="px" align="center" style="padding:0 40px 34px;text-align:center;border-top:1px solid rgba(157,107,255,0.15);">
                    <p style="font-family:${bodyFont};color:#9aa0b6;font-size:13px;line-height:1.7;margin:22px 0 0;">
                      Order reference: ${escapeHtml(orderId)}${directDownloadLine}
                    </p>
                    <p style="font-family:${bodyFont};color:#9aa0b6;font-size:13px;line-height:1.7;margin:14px 0 0;">
                      You can re-download your tracks anytime from your dashboard.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="px" style="padding:30px 40px 8px;text-align:center;">
              <div style="font-family:${headFont};color:${violetBright};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.32em;">&#10022;&nbsp;&nbsp;The Legend of Hendo&nbsp;&nbsp;&#10022;</div>
              <p style="font-family:${bodyFont};color:#aab1c4;font-size:13px;line-height:1.6;margin:14px 0 0;">
                You received this email because you made a purchase at thelegendofhendo.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPurchaseConfirmationEmail(params: PurchaseConfirmationParams) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Proton Mail SMTP not configured');
    }

    if (!params.to) {
      throw new Error('No recipient email for purchase confirmation');
    }

    const trackCount = params.items.length;
    const subject =
      trackCount > 1
        ? `Your T. HENDO order — ${trackCount} tracks`
        : `Your T. HENDO order — ${params.items[0]?.trackTitle ?? 'your purchase'}`;

    const info = await transporter.sendMail({
      from: `T. HENDO <${process.env.PROTON_SMTP_USER}>`,
      to: params.to,
      subject,
      html: renderPurchaseConfirmationHtml(params),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Purchase confirmation email error:', error);
    throw error;
  }
}
