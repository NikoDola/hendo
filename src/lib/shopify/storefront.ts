// Shopify Storefront API client for customer authentication and cart management
import { syncShopifyCustomerToFirebase } from '@/lib/firebase-shopify-sync';


// NOTE: Do not validate Storefront envs at module import time to avoid
// prerender errors on pages that don't need Shopify yet. We resolve lazily.
function getStorefrontConfig() {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) {
    throw new Error('Missing Shopify Storefront API configuration');
  }
  return { domain, token } as const;
}

// GraphQL client
class ShopifyStorefrontClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || '';
  }

  async request(query: string, variables: Record<string, unknown> = {}) {
    const { domain, token } = getStorefrontConfig();
    const apiUrl = `https://${domain}/api/2024-01/graphql.json`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
        ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        errorBody: errorText
      });
      throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }
}

// Customer Authentication Mutations
const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        acceptsMarketing
        createdAt
        updatedAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_LOGIN_MUTATION = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_QUERY = `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      phone
      acceptsMarketing
      createdAt
      updatedAt
      defaultAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        country
        zip
        phone
      }
    }
  }
`;

// Cart Mutations
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_ADD_ITEMS_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_QUERY = `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  id
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Customer Authentication Functions
export async function registerCustomer(customerData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CUSTOMER_CREATE_MUTATION, {
      input: customerData
    });

    if (response.customerCreate.customerUserErrors.length > 0) {
      throw new Error(response.customerCreate.customerUserErrors[0].message);
    }

    const customer = response.customerCreate.customer;

    // Sync to Firebase
    try {
      await syncShopifyCustomerToFirebase({
        email: customer.email,
        first_name: customer.firstName || 'Customer',
        last_name: customer.lastName || 'User',
        id: customer.id
      });
      console.log('Successfully synced Shopify customer to Firebase');
    } catch (syncError) {
      console.error('Failed to sync to Firebase, but continuing with Shopify registration:', syncError);
      // Don't fail the Shopify registration if Firebase sync fails
    }

    return customer;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginCustomer(email: string, password: string) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CUSTOMER_LOGIN_MUTATION, {
      input: { email, password }
    });

    if (response.customerAccessTokenCreate.customerUserErrors.length > 0) {
      throw new Error(response.customerAccessTokenCreate.customerUserErrors[0].message);
    }

    return response.customerAccessTokenCreate.customerAccessToken;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getCustomer(accessToken: string) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CUSTOMER_QUERY, {
      customerAccessToken: accessToken
    });
    return response.customer;
  } catch (error) {
    console.error('Fetch customer error:', error);
    throw error;
  }
}

// Cart Functions
export async function createCart(items?: Array<{ merchandiseId: string; quantity: number }>) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CART_CREATE_MUTATION, {
      input: {
        lines: items || []
      }
    });

    if (response.cartCreate.userErrors.length > 0) {
      throw new Error(response.cartCreate.userErrors[0].message);
    }

    return response.cartCreate.cart;
  } catch (error) {
    console.error('Create cart error:', error);
    throw error;
  }
}

export async function addToCart(cartId: string, merchandiseId: string, quantity: number = 1) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CART_ADD_ITEMS_MUTATION, {
      cartId,
      lines: [{
        merchandiseId,
        quantity
      }]
    });

    if (response.cartLinesAdd.userErrors.length > 0) {
      throw new Error(response.cartLinesAdd.userErrors[0].message);
    }

    return response.cartLinesAdd.cart;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
}

export async function getCart(cartId: string) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CART_QUERY, {
      cartId
    });

    return response.cart;
  } catch (error) {
    console.error('Get cart error:', error);
    throw error;
  }
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const client = new ShopifyStorefrontClient();

  try {
    const response = await client.request(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds
    });

    if (response.cartLinesRemove.userErrors.length > 0) {
      throw new Error(response.cartLinesRemove.userErrors[0].message);
    }

    return response.cartLinesRemove.cart;
  } catch (error) {
    console.error('Remove from cart error:', error);
    throw error;
  }
}

export { ShopifyStorefrontClient };
