import nodemailer from 'nodemailer';

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
      from: `HENDO <${process.env.PROTON_SMTP_USER}>`,
      to: email,
      subject: 'Verify your email - HENDO Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">HENDO</h1>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #fff; margin-top: 0;">Welcome to HENDO Newsletter!</h2>
            
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
              This email was sent because you subscribed to the HENDO newsletter. If you didn't subscribe, you can safely ignore this email.
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
      from: `HENDO <${process.env.PROTON_SMTP_USER}>`,
      to: email,
      subject: 'Welcome to HENDO Newsletter! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 32px; margin: 0;">HENDO</h1>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #fff; margin-top: 0;">Welcome to HENDO! 🎉</h2>
            
            <p style="color: #ccc; line-height: 1.6; margin-bottom: 25px;">
              Thank you for verifying your email and joining our newsletter! You're now part of the HENDO community and will receive updates about our latest products, news, and exclusive offers.
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
              You're receiving this email because you subscribed to the HENDO newsletter.
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
      from: `${name} via Dreamtation (${email}) <${process.env.PROTON_SMTP_USER}>`,
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
              <a href="mailto:${email}?subject=Re: Your message to HENDO" 
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
