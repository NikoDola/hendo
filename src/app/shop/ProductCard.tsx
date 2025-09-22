"use client";

import { useState } from "react";
import { ShopifyProduct } from "@/lib/shopify";
import { useShopifyAuth } from "@/context/ShopifyAuthContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: ShopifyProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [cartMessage, setCartMessage] = useState("");
  const { customer } = useShopifyAuth();
  const { addToCart, isLoading } = useCart();
  const mainImage = product.images[0];
  const price = product.variants[0]?.price || '0';
  const comparePrice = product.variants[0]?.compare_at_price;
  const variantId = product.variants[0]?.id;

  const handleAddToCart = async () => {
    if (!customer) {
      setCartMessage("Please login to add items to cart");
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    if (!variantId) {
      setCartMessage("Product variant not available");
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    setCartMessage("");

    try {
      await addToCart(`gid://shopify/ProductVariant/${variantId}`, 1);
      setCartMessage("Added to cart! 🎉");
      setTimeout(() => setCartMessage(""), 3000);
    } catch (error) {
      console.error('Add to cart error:', error);
      setCartMessage("Failed to add to cart");
      setTimeout(() => setCartMessage(""), 3000);
    }
  };

  return (
    <div style={{
      backgroundColor: '#2c2c2c',
      borderRadius: '1rem',
      padding: '1.5rem',
      borderTop: 'solid rgb(225, 225, 225, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
      {mainImage && (
        <div style={{
          width: '100%',
          height: '200px',
          marginBottom: '1rem',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <img
            src={mainImage.src}
            alt={mainImage.alt || product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      <h3 style={{
        fontSize: '1.25rem',
        marginBottom: '0.5rem',
        color: 'var(--background)'
      }}>
        {product.title}
      </h3>

      <p style={{
        color: 'gray',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {product.description ? product.description.replace(/<[^>]*>/g, '') : 'No description available'}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: 'var(--theme-color)'
        }}>
          ${(parseFloat(price) / 100).toFixed(2)}
        </span>
        {comparePrice && (
          <span style={{
            fontSize: '0.9rem',
            color: 'gray',
            textDecoration: 'line-through'
          }}>
            ${(parseFloat(comparePrice) / 100).toFixed(2)}
          </span>
        )}
      </div>

      {cartMessage && (
        <div style={{
          color: cartMessage.includes('🎉') ? 'green' : 'red',
          marginBottom: '1rem',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {cartMessage}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: isLoading ? 'gray' : 'var(--theme-color)',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-lemonmilk)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease, box-shadow 1s ease'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'var(--foreground)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.boxShadow = '0 0 20px var(--theme-color)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'var(--theme-color)';
            e.currentTarget.style.color = 'var(--foreground)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}>
        {isLoading ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}
