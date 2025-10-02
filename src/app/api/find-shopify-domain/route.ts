import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testDomain = searchParams.get('domain') || 'nebulacloudco';

    console.log(`🔍 Testing Shopify domain: ${testDomain}`);

    // Test different possible domain formats
    const possibleDomains = [
      `${testDomain}.myshopify.com`,
      `${testDomain}-store.myshopify.com`,
      `${testDomain}-shop.myshopify.com`,
      `${testDomain}-co.myshopify.com`,
      `nebula-cloud-co.myshopify.com`,
      `nebulacloudco.myshopify.com`
    ];

    const results = [];

    for (const domain of possibleDomains) {
      try {
        console.log(`🧪 Testing domain: ${domain}`);

        // Test basic domain accessibility
        const baseUrl = `https://${domain}`;
        const baseResponse = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Shopify-Test/1.0)'
          }
        });

        // Test admin API
        const adminUrl = `https://${domain}/admin/api/2023-01/shop.json`;
        const adminResponse = await fetch(adminUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
          }
        });

        results.push({
          domain,
          baseUrl: {
            status: baseResponse.status,
            statusText: baseResponse.statusText,
            accessible: baseResponse.ok
          },
          adminApi: {
            status: adminResponse.status,
            statusText: adminResponse.statusText,
            accessible: adminResponse.ok
          },
          success: baseResponse.ok && adminResponse.ok
        });

        console.log(`📡 ${domain} -> Base: ${baseResponse.status}, Admin: ${adminResponse.status}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error testing ${domain}:`, errorMessage);
        results.push({
          domain,
          error: errorMessage,
          success: false
        });
      }
    }

    const workingDomains = results.filter(r => r.success);

    return NextResponse.json({
      success: true,
      testDomain,
      results,
      workingDomains,
      recommendation: workingDomains.length > 0
        ? `Use domain: ${workingDomains[0].domain}`
        : 'No working domains found. Check your Shopify admin URL.',
      instructions: [
        '1. Go to your Shopify admin dashboard',
        '2. Look at the URL in your browser',
        '3. The domain should be something like: your-store.myshopify.com',
        '4. Update your .env.local with the correct domain'
      ]
    });

  } catch (error) {
    console.error('❌ Domain test failed:', error);
    return NextResponse.json({
      error: 'Domain test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
