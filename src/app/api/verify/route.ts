import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { createShopifyCustomer, checkCustomerExists } from "@/lib/shopify";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ error: "Invalid verification link" }, { status: 400 });
    }

    // Get the email document
    const emailDoc = await getDoc(doc(collection(db, "newsletter"), email));
    if (!emailDoc.exists()) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const data = emailDoc.data();

    // Check if token matches and email is not already verified
    if (data.verificationToken !== token) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    if (data.verified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    // Mark email as verified - NOW the email is actually stored in Firestore
    await updateDoc(doc(collection(db, "newsletter"), email), {
      verified: true,
      verifiedAt: new Date(),
      verificationToken: null, // Clear the token
    });

    console.log(`✅ Email ${email} verified and stored in Firestore`);

    // Create Shopify customer after successful Firebase verification
    console.log(`🚀 ABOUT TO START SHOPIFY INTEGRATION FOR ${email}`);
    try {
      console.log(`🔍 Starting Shopify integration for ${email}`);

      // Check environment variables
      const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const shopifyToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

      if (!shopifyDomain || !shopifyToken) {
        console.error(`❌ Missing Shopify environment variables:`, {
          SHOPIFY_STORE_DOMAIN: shopifyDomain ? 'SET' : 'MISSING',
          SHOPIFY_ADMIN_ACCESS_TOKEN: shopifyToken ? 'SET' : 'MISSING'
        });
        throw new Error('Shopify environment variables not configured');
      }

      console.log(`✅ Shopify environment variables found`);

      // Check if customer already exists in Shopify
      console.log(`🔍 Checking if customer ${email} exists in Shopify...`);
      const customerExists = await checkCustomerExists(email);

      if (customerExists) {
        console.log(`ℹ️ Customer ${email} already exists in Shopify, skipping creation`);
      } else {
        console.log(`🆕 Creating new Shopify customer for ${email}...`);
        const shopifyCustomer = await createShopifyCustomer({
          email: email,
          acceptsMarketing: true,
          tags: ['newsletter-subscriber', 'hendo-fan'],
          note: `Newsletter subscriber verified on ${new Date().toISOString()}`
        });

        console.log(`✅ Shopify customer created: ${shopifyCustomer.customer.id} for ${email}`);

        // Update Firebase record with Shopify customer ID
        await updateDoc(doc(collection(db, "newsletter"), email), {
          shopifyCustomerId: shopifyCustomer.customer.id,
          shopifyCreatedAt: shopifyCustomer.customer.createdAt
        });

        console.log(`✅ Firebase record updated with Shopify customer ID`);
      }

    } catch (shopifyError) {
      console.error(`⚠️ Failed to create Shopify customer for ${email}:`, shopifyError);
      console.error(`⚠️ Error details:`, {
        message: shopifyError.message,
        stack: shopifyError.stack
      });
      // Don't fail the verification if Shopify creation fails
      // The user is still verified in Firebase
    }

    return NextResponse.json({ message: "Email verified successfully! You're now subscribed to HENDO Music updates." });
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
