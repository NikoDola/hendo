import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import crypto from "crypto";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if email already exists
    const emailDoc = await getDoc(doc(collection(db, "newsletter"), email));
    if (emailDoc.exists()) {
      const data = emailDoc.data();
      if (data.verified) {
        return NextResponse.json({ error: "Email is already subscribed and verified" }, { status: 409 });
      } else {
        return NextResponse.json({ error: "Email is already subscribed but not verified. Please check your email for verification link." }, { status: 409 });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store email with verification token (not verified yet)
    await setDoc(doc(collection(db, "newsletter"), email), {
      email,
      verified: false,
      verificationToken,
      createdAt: new Date(),
    });

    // Generate verification link - use www version for SSL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    let verificationLink;
    if (baseUrl.includes('thelegendofhendo.com')) {
      // Use www version since SSL is configured for www.thelegendofhendo.com
      verificationLink = `https://www.thelegendofhendo.com/special/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    } else {
      verificationLink = `${baseUrl}/special/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    }

    console.log(`🔗 Generated verification link: ${verificationLink}`);

    // Send verification email using Resend
    try {
      await resend.emails.send({
        from: 'T.HENDO<noreply@thelegendofhendo.com>',
        to: [email],
        subject: 'Verify your T. HENDO DREAMSTATION subscription',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h1 style="color: #22C063; font-size: 2rem; margin: 0; font-family: 'LEMONMILK', 'Arial Black', Arial, sans-serif; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">T. HENDO DREAMSTATION</h1>
              <p style="color: #666; margin: 0.5rem 0;">Welcome to the family!</p>
            </div>
            
            <div style="background: #000000; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem; border: 2px solid #00FF00;">
              <h2 style="color: #22C063; margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 2px; font-family: 'LEMONMILK', 'Arial Black', Arial, sans-serif;">⭐ ALMOST THERE!</h2>
              <p style="color: #E0E0E0; margin: 0; line-height: 1.6; font-size: 1rem;">
                Click the button below to verify your email and start receiving exclusive updates:
              </p>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${verificationLink}" 
                 style="background: #22C063; color: #FFFFFF; padding: 1rem 2rem; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 1.1rem; font-family: 'LEMONMILK', 'Arial Black', Arial, sans-serif; letter-spacing: 1px;">
                ✅ Verify My Email
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 2rem 0;">
              <h3 style="color: #333; margin: 0 0 1rem 0; font-family: 'LEMONMILK', 'Arial Black', Arial, sans-serif; font-weight: 700; letter-spacing: 1px;">What you'll get:</h3>
              <ul style="color: #666; margin: 0; padding-left: 1.5rem;">
                <li>🎵 First access to new music releases</li>
                <li>👕 Exclusive clothing drops and merch</li>
                <li>🎬 Behind-the-scenes content and updates</li>
                <li>🚀 Early access when the site goes live</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 0.9rem; text-align: center; margin: 2rem 0 0 0;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${verificationLink}" style="color: #5227FF; word-break: break-all;">${verificationLink}</a>
            </p>
            
            <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 0.8rem; margin: 0;">
                Best regards,<br>
                <strong>The T. HENDO DREAMSTATION Team</strong>
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Verification email sent to ${email} via Resend`);
      return NextResponse.json({ message: "Verification email sent! Please check your inbox." });

    } catch (emailError) {
      console.error('Resend email failed:', emailError);
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

  } catch (err) {
    console.error("Newsletter save error:", err);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
