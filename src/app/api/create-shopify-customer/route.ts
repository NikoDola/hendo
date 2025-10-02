import { NextResponse } from "next/server";
import { createShopifyCustomer, checkCustomerExists } from "@/lib/shopify";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`🆕 Creating Shopify customer for: ${email}`);

    // Check if customer already exists
    const customerExists = await checkCustomerExists(email);

    if (customerExists) {
      return NextResponse.json({
        message: `Customer ${email} already exists in Shopify`,
        email,
        exists: true
      });
    }

    // Create new customer
    const shopifyCustomer = await createShopifyCustomer({
      email: email,
      acceptsMarketing: true,
      tags: ['newsletter-subscriber', 'hendo-fan'],
      note: `Newsletter subscriber created on ${new Date().toISOString()}`
    });

    console.log(`✅ Shopify customer created: ${shopifyCustomer.customer.id} for ${email}`);

    return NextResponse.json({
      success: true,
      message: `Customer ${email} created successfully in Shopify`,
      customer: {
        id: shopifyCustomer.customer.id,
        email: shopifyCustomer.customer.email,
        tags: shopifyCustomer.customer.tags
      }
    });

  } catch (error) {
    console.error('❌ Failed to create Shopify customer:', error);
    return NextResponse.json({
      error: 'Failed to create Shopify customer',
      details: error.message
    }, { status: 500 });
  }
}
