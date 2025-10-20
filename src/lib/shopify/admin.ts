// Shopify Admin API client for customer management
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'thelegendofhendo.com';

// Read the Admin token from server-side env only (do NOT use NEXT_PUBLIC_*)
function getAdminToken(): string {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    // Defer the error until a server-side call actually needs the token
    throw new Error('Missing Shopify Admin API access token');
  }
  return token;
}

const ADMIN_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01`;

// Admin API client
class ShopifyAdminClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    // Resolve the token lazily at runtime to avoid throws during build/prerender
    this.accessToken = accessToken || getAdminToken();
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${ADMIN_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify Admin API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorBody: errorText
      });
      throw new Error(`Shopify Admin API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

// Customer Management Functions
export async function createCustomer(customerData: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password?: string;
  accepts_marketing?: boolean;
  send_email_welcome?: boolean;
}) {
  const client = new ShopifyAdminClient();

  try {
    const response = await client.request('/customers.json', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          ...customerData,
          accepts_marketing: customerData.accepts_marketing || false,
          send_email_welcome: customerData.send_email_welcome || false, // Default to false - Firebase handles verification
          send_email_invite: false // Disable invitation emails
        }
      })
    });

    return response.customer;
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}

export async function getCustomer(customerId: string) {
  const client = new ShopifyAdminClient();

  try {
    const response = await client.request(`/customers/${customerId}.json`);
    return response.customer;
  } catch (error) {
    console.error('Get customer error:', error);
    throw error;
  }
}

export async function updateCustomer(customerId: string, customerData: Record<string, unknown>) {
  const client = new ShopifyAdminClient();

  try {
    const response = await client.request(`/customers/${customerId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ customer: customerData })
    });

    return response.customer;
  } catch (error) {
    console.error('Update customer error:', error);
    throw error;
  }
}

export async function searchCustomers(query: string) {
  const client = new ShopifyAdminClient();

  try {
    const response = await client.request(`/customers/search.json?query=${encodeURIComponent(query)}`);
    return response.customers;
  } catch (error) {
    console.error('Search customers error:', error);
    throw error;
  }
}

export { ShopifyAdminClient };
