// Shopify Customer API integration
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

export interface ShopifyCustomer {
  email: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing: boolean;
  tags?: string[];
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

// Create a new customer in Shopify using Storefront API
export async function createShopifyCustomer(customerData: ShopifyCustomer): Promise<ShopifyCustomerResponse> {
  // Storefront API has limited customer creation capabilities
  // Let's use a simpler approach with customerCreate mutation
  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          acceptsMarketing
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: customerData.email,
      password: Math.random().toString(36).slice(-12), // Generate random password
      acceptsMarketing: customerData.acceptsMarketing
    }
  };

  const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.customerCreate;
}

// Note: Storefront API doesn't support querying customers
// We'll handle duplicates by catching the error from customerCreate
