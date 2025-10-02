import { NextResponse } from "next/server";
import { createShopifyCustomer, checkCustomerExists, testShopifyConnection } from "@/lib/shopify";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'test@example.com';

    console.log(`🧪 Testing Shopify integration for email: ${email}`);

    // Check environment variables
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const shopifyToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    const envStatus = {
      SHOPIFY_STORE_DOMAIN: shopifyDomain ? 'SET' : 'MISSING',
      SHOPIFY_ADMIN_ACCESS_TOKEN: shopifyToken ? 'SET' : 'MISSING'
    };

    console.log(`🔧 Environment variables:`, envStatus);

    if (!shopifyDomain || !shopifyToken) {
      return NextResponse.json({
        error: 'Shopify environment variables not configured',
        envStatus
      }, { status: 400 });
    }

    // Test basic connection first
    console.log(`🧪 Testing basic Shopify connection...`);
    const connectionTest = await testShopifyConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        email,
        envStatus,
        connectionTest,
        message: `Shopify connection failed: ${connectionTest.error}`
      });
    }

    // Test customer search
    console.log(`🔍 Testing customer search...`);
    const customerExists = await checkCustomerExists(email);

    // Test customer creation (only if doesn't exist)
    let creationResult = null;
    if (!customerExists) {
      console.log(`🆕 Testing customer creation...`);
      try {
        creationResult = await createShopifyCustomer({
          email: email,
          acceptsMarketing: true,
          tags: ['test-customer'],
          note: `Test customer created on ${new Date().toISOString()}`
        });
      } catch (error) {
        console.error(`❌ Customer creation failed:`, error);
        creationResult = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      email,
      envStatus,
      connectionTest,
      customerExists,
      creationResult,
      message: customerExists
        ? 'Customer already exists in Shopify'
        : creationResult && 'error' in creationResult
          ? `Customer creation failed: ${creationResult.error}`
          : 'Customer created successfully'
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
