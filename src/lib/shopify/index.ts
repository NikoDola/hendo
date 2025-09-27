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

// Create a new customer in Shopify
export async function createShopifyCustomer(customerData: ShopifyCustomer): Promise<ShopifyCustomerResponse> {
  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          acceptsMarketing
          tags
          createdAt
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
      firstName: customerData.firstName || "",
      lastName: customerData.lastName || "",
      acceptsMarketing: customerData.acceptsMarketing,
      tags: customerData.tags || ["newsletter-subscriber"]
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

// Check if customer already exists
export async function checkCustomerExists(email: string): Promise<boolean> {
  const query = `
    query getCustomer($email: String!) {
      customers(first: 1, query: $email) {
        edges {
          node {
            id
            email
          }
        }
      }
    }
  `;

  const variables = {
    email: `email:${email}`
  };

  const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({
      query: query,
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

  return data.data.customers.edges.length > 0;
}
