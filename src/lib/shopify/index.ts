// Shopify API integration
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY;

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description: string;
  price: string;
  compare_at_price?: string;
  images: {
    id: number;
    src: string;
    alt: string;
  }[];
  variants: {
    id: number;
    title: string;
    price: string;
    available: boolean;
  }[];
  tags: string[];
  product_type: string;
  vendor: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// Fetch all products from Shopify
export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify access token not found. Please add NEXT_PUBLIC_SHOPIFY to your .env.local file.');
  }

  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error('Shopify store domain not found. Please add NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN to your .env.local file.');
  }

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/products.json?limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data: ShopifyProductsResponse = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

// Fetch a single product by handle
export async function getShopifyProduct(handle: string): Promise<ShopifyProduct | null> {
  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify access token not found. Please add NEXT_PUBLIC_SHOPIFY to your .env.local file.');
  }

  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error('Shopify store domain not found. Please add NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN to your .env.local file.');
  }

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/products.json?handle=${handle}`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data: ShopifyProductsResponse = await response.json();
    return data.products[0] || null;
  } catch (error) {
    console.error('Error fetching Shopify product:', error);
    throw error;
  }
}
