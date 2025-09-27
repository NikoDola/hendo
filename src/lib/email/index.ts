import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, verificationToken: string) {
  try {
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const { data, error } = await resend.emails.send({
      from: 'HENDO <noreply@hendo.com>', // You'll need to configure this domain
      to: [email],
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

    if (error) {
      console.error('Resend email error:', error);
      throw new Error('Failed to send verification email');
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string) {
  try {
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const { data, error } = await resend.emails.send({
      from: 'HENDO <noreply@hendo.com>',
      to: [email],
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

    if (error) {
      console.error('Resend welcome email error:', error);
      throw new Error('Failed to send welcome email');
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    throw error;
  }
}
