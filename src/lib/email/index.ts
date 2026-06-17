import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Small helpers (shared by templates)
// ---------------------------------------------------------------------------

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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">T. HENDO</h1>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #333;">
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
      `,
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">T. HENDO</h1>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #fff; margin-top: 0;">Welcome to T. HENDO! 🎉</h2>
            
            <p style="color: #ccc; line-height: 1.6; margin-bottom: 25px;">
              Thank you for verifying your email and joining our newsletter! You're now part of the T. HENDO community and will receive updates about our latest products, news, and exclusive offers.
            </p>
            
            <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
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
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    throw error;
  }
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <!-- Quick Reply Button at the top -->
            <div style="text-align: center; margin: 20px 0;">
              <a href="mailto:${email}?subject=Re: Your message to T. HENDO" 
                 style="background-color: #4a90e2; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reply to ${name}
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              A message by <strong>${name}</strong> (${email}) has been received. Kindly respond at your earliest convenience.
            </p>
            
            <hr style="border: none; border-top: 1px dashed #ddd; margin: 25px 0;">
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 40px; height: 40px; background-color: #4a90e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                  <span style="color: #fff; font-weight: bold; font-size: 18px;">${name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div style="font-weight: bold; color: #333; font-size: 16px;">${name}</div>
                  <div style="color: #4a90e2; font-size: 14px;">${email}</div>
                  <div style="color: #999; font-size: 12px; margin-top: 2px;">${currentTime}</div>
                </div>
              </div>
              
              <div style="color: #333; line-height: 1.8; white-space: pre-wrap;">${message}</div>
            </div>
            
            <hr style="border: none; border-top: 1px dashed #ddd; margin: 25px 0;">
            
            <div style="background-color: #f0f7ff; padding: 15px; border-radius: 6px; border-left: 4px solid #4a90e2;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Sender's Email:</strong> <a href="mailto:${email}" style="color: #4a90e2; text-decoration: none; font-weight: bold;">${email}</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #888; font-size: 12px;">
                Click the email above or use the "Reply to ${name}" button to respond directly.
              </p>
            </div>
          </div>
        </div>
      `,
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

function renderPurchaseConfirmationHtml(params: PurchaseConfirmationParams): string {
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
<body style="margin:0;padding:0;background-color:#04050a;">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Payment confirmed — your beats are ready to download.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#04050a;background-image:radial-gradient(circle at 18% 12%, rgba(0,85,255,0.20), transparent 42%), radial-gradient(circle at 85% 4%, rgba(0,85,255,0.12), transparent 38%);">
    <tr>
      <td align="center" style="padding:34px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header: stars + wordmark -->
          <tr>
            <td align="center" class="px" style="padding:6px 40px 26px;">
              <div style="font-family:${headFont};color:#5e7cff;font-size:15px;letter-spacing:0.55em;">&#10022;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#8902;&nbsp;&nbsp;&#10023;&nbsp;&nbsp;&#10022;</div>
              <div style="font-family:${headFont};color:#ffffff;font-size:36px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;margin-top:16px;">T.&nbsp;HENDO</div>
              <div style="font-family:${headFont};color:#5e7cff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.42em;margin-top:8px;">Dreamstation</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0d15;border:1px solid #1c2333;border-radius:16px;">

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
