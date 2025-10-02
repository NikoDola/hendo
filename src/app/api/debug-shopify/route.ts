import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const shopifyToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    console.log(`🔍 Debugging Shopify connection...`);
    console.log(`🏪 Store domain: ${shopifyDomain}`);
    console.log(`🔑 Token (first 10 chars): ${shopifyToken?.substring(0, 10)}...`);

    // Test 1: Check if domain format is correct
    const domainTests = [
      `https://${shopifyDomain}/admin/api/2023-01/shop.json`,
      `https://${shopifyDomain}/admin/api/2023-04/shop.json`,
      `https://${shopifyDomain}/admin/api/2023-07/shop.json`,
      `https://${shopifyDomain}/admin/api/2023-10/shop.json`,
      `https://${shopifyDomain}/admin/api/2024-01/shop.json`
    ];

    const results = [];

    for (const url of domainTests) {
      try {
        console.log(`🧪 Testing: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyToken!,
          }
        });

        const status = response.status;
        const statusText = response.statusText;

        let responseData = null;
        try {
          responseData = await response.json();
        } catch {
          responseData = { error: 'Could not parse JSON response' };
        }

        results.push({
          url,
          status,
          statusText,
          response: responseData,
          success: response.ok
        });

        console.log(`📡 ${url} -> ${status} ${statusText}`);

        if (response.ok) {
          console.log(`✅ SUCCESS with ${url}`);
          break; // Found working version
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error testing ${url}:`, errorMessage);
        results.push({
          url,
          error: errorMessage,
          success: false
        });
      }
    }

    // Test 2: Check if it's a permissions issue by trying a simpler endpoint
    let permissionsTest = null;
    try {
      const simpleUrl = `https://${shopifyDomain}/admin/api/2023-01/shop.json`;
      console.log(`🔐 Testing permissions with: ${simpleUrl}`);

      const response = await fetch(simpleUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken!,
        }
      });

      permissionsTest = {
        url: simpleUrl,
        status: response.status,
        statusText: response.statusText,
        response: await response.json().catch(() => ({ error: 'Could not parse JSON' })),
        success: response.ok
      };

    } catch (error) {
      permissionsTest = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }

    // Test 3: Check if domain is accessible at all
    let domainTest = null;
    try {
      const baseUrl = `https://${shopifyDomain}`;
      console.log(`🌐 Testing domain accessibility: ${baseUrl}`);

      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Shopify-Test/1.0)'
        }
      });

      domainTest = {
        url: baseUrl,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      };

    } catch (error) {
      domainTest = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }

    return NextResponse.json({
      success: true,
      debug: {
        environment: {
          SHOPIFY_STORE_DOMAIN: shopifyDomain,
          SHOPIFY_ADMIN_ACCESS_TOKEN: shopifyToken ? 'SET' : 'MISSING'
        },
        domainTest,
        permissionsTest,
        apiVersionTests: results,
        summary: {
          domainAccessible: domainTest?.success,
          hasValidToken: !!shopifyToken,
          workingApiVersion: results.find(r => r.success)?.url || 'None found'
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
