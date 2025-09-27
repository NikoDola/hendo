// Shopify Admin API client for customer management
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'thelegendofhendo.com';
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY;

if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
  console.error('Missing Shopify Admin API access token. Please check your .env.local file.');
  throw new Error('Missing Shopify Admin API access token');
}

// Type assertion to tell TypeScript that this is now guaranteed to be defined
const ADMIN_TOKEN = SHOPIFY_ADMIN_ACCESS_TOKEN as string;

const ADMIN_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01`;

// Admin API client
class ShopifyAdminClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || ADMIN_TOKEN;
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
          send_email_welcome: customerData.send_email_welcome || true
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
