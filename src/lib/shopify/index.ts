// Shopify Customer API integration using Admin API
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// Store the working API version
let WORKING_API_VERSION = '2024-01';

export interface ShopifyCustomer {
  email: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing: boolean;
  tags?: string[];
  note?: string;
}

export interface ShopifyCustomerResponse {
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    acceptsMarketing: boolean;
    tags: string[];
    createdAt: string;
  };
  userErrors: Array<{
    field: string[];
    message: string;
  }>;
}

// Generate a secure random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Create a new customer in Shopify using Admin API
export async function createShopifyCustomer(customerData: ShopifyCustomer): Promise<ShopifyCustomerResponse> {
  console.log(`🔧 Creating Shopify customer with data:`, customerData);

  const randomPassword = generateRandomPassword();
  console.log(`🔑 Generated random password: ${randomPassword.substring(0, 4)}...`);

  const customerPayload = {
    customer: {
      email: customerData.email,
      password: randomPassword,
      password_confirmation: randomPassword,
      first_name: customerData.firstName || '',
      last_name: customerData.lastName || '',
      accepts_marketing: customerData.acceptsMarketing,
      tags: customerData.tags?.join(',') || 'newsletter-subscriber',
      note: customerData.note || `Newsletter signup from: ${process.env.NEXT_PUBLIC_BASE_URL || 'hendo-website'}`,
      send_email_invite: false, // This prevents Shopify from sending verification emails
      send_email_welcome: false  // This prevents Shopify from sending welcome emails
    }
  };

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${WORKING_API_VERSION}/customers.json`;
  console.log(`🌐 Making request to: ${url}`);
  console.log(`📦 Payload:`, JSON.stringify(customerPayload, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN!,
    },
    body: JSON.stringify(customerPayload)
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`❌ Shopify API error:`, errorData);
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log(`✅ Shopify API response:`, JSON.stringify(data, null, 2));

  if (data.errors) {
    console.error(`❌ Shopify customer creation errors:`, data.errors);
    throw new Error(`Shopify customer creation errors: ${JSON.stringify(data.errors)}`);
  }

  const result = {
    customer: {
      id: data.customer.id.toString(),
      email: data.customer.email,
      firstName: data.customer.first_name,
      lastName: data.customer.last_name,
      acceptsMarketing: data.customer.accepts_marketing,
      tags: data.customer.tags ? data.customer.tags.split(',').map((tag: string) => tag.trim()) : [],
      createdAt: data.customer.created_at
    },
    userErrors: []
  };

  console.log(`✅ Successfully created Shopify customer:`, result);
  return result;
}

// Test basic Shopify API connection
export async function testShopifyConnection(): Promise<{ success: boolean, error?: string, apiVersion?: string }> {
  const apiVersions = ['2024-01', '2023-10', '2023-07', '2023-04', '2023-01'];

  for (const version of apiVersions) {
    try {
      // Try to get shop info to test basic connection
      const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${version}/shop.json`;
      console.log(`🧪 Testing Shopify connection with API ${version}: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN!,
        }
      });

      console.log(`📡 API ${version} response: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Shopify connection successful with API ${version}:`, data);
        WORKING_API_VERSION = version; // Store the working version
        return { success: true, apiVersion: version };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ API ${version} failed: ${response.status} ${response.statusText}`, errorData);
      }
    } catch (error) {
      console.log(`❌ API ${version} error:`, error.message);
    }
  }

  return { success: false, error: 'No supported API version found. Tried: ' + apiVersions.join(', ') };
}

// Check if customer already exists in Shopify
export async function checkCustomerExists(email: string): Promise<boolean> {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${WORKING_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(email)}`;
    console.log(`🔍 Checking if customer exists: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN!,
      }
    });

    console.log(`📡 Customer search response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Shopify search error: ${response.status} ${response.statusText}`, errorData);
      return false;
    }

    const data = await response.json();
    console.log(`🔍 Customer search response:`, JSON.stringify(data, null, 2));

    const exists = data.customers && data.customers.length > 0;
    console.log(`ℹ️ Customer ${email} exists in Shopify: ${exists}`);
    return exists;
  } catch (error) {
    console.error('❌ Customer search error:', error);
    return false;
  }
}
