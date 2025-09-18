import { getShopifyProducts, ShopifyProduct } from "@/lib/shopify";
import "@/components/pages/Form.css";
import ProductCard from "./ProductCard";

export default async function ShopPage() {
  let products: ShopifyProduct[] = [];
  let error: string | null = null;

  try {
    products = await getShopifyProducts();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load products';
    console.error('Error loading products:', err);
  }

  return (
    <section className="section-regular">
      <div className="formWrapper">
        <h1>Shop</h1>

        {error && (
          <div style={{
            color: 'red',
            padding: '1rem',
            backgroundColor: '#2c2c2c',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <p>Error loading products: {error}</p>
            <p>Please check your Shopify configuration in the .env.local file.</p>
          </div>
        )}

        {products.length === 0 && !error && (
          <div style={{
            color: 'gray',
            padding: '1rem',
            backgroundColor: '#2c2c2c',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <p>No products found in your Shopify store.</p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
