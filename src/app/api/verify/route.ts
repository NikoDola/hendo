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

    // Update Shopify customer note to reflect verification (customer already exists from signup)
    console.log(`🚀 UPDATING SHOPIFY CUSTOMER FOR VERIFIED ${email}`);
    try {
      // Check if customer already has Shopify ID (created during signup)
      if (data.shopifyCustomerId) {
        console.log(`✅ Customer ${email} already has Shopify ID: ${data.shopifyCustomerId}`);
        console.log(`ℹ️ Customer was already subscribed to marketing during signup`);
      } else {
        console.log(`⚠️ Customer ${email} doesn't have Shopify ID, creating now...`);
        
        // Check if customer already exists in Shopify
        const customerExists = await checkCustomerExists(email);

        if (customerExists) {
          console.log(`ℹ️ Customer ${email} exists in Shopify but not linked, updating Firebase record`);
          // We can't easily get the Shopify ID without more API calls, so just note it exists
          await updateDoc(doc(collection(db, "newsletter"), email), {
            shopifyNote: 'Customer exists in Shopify but ID not linked'
          });
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
      }

    } catch (shopifyError) {
      console.error(`⚠️ Failed to update Shopify customer for ${email}:`, shopifyError);
      // Don't fail the verification if Shopify update fails
      // The user is still verified in Firebase
    }

    return NextResponse.json({ message: "Email verified successfully! You're now subscribed to HENDO Music updates." });
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
