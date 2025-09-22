"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCart, createCart, addToCart as addToCartAPI, removeFromCart as removeFromCartAPI } from '@/lib/shopify/storefront';

interface CartItem {
  id: string;
  quantity: number;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  merchandise: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    product: {
      id: string;
      title: string;
      handle: string;
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string;
          };
        }>;
      };
    };
  };
}

interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  lines: {
    edges: Array<{
      node: CartItem;
    }>;
  };
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineIds: string[]) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
  getCartId: () => string | null;
  setCartId: (cartId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get cart ID from localStorage
  const getCartId = () => {
    if (typeof window !== 'undefined') {
      const cartId = localStorage.getItem('shopify_cart_id');
      console.log('Retrieved cart ID from localStorage:', cartId);
      return cartId;
    }
    return null;
  };

  // Set cart ID in localStorage
  const setCartId = (cartId: string) => {
    if (typeof window !== 'undefined') {
      console.log('Saving cart ID to localStorage:', cartId);
      try {
        localStorage.setItem('shopify_cart_id', cartId);
        // Verify it was saved
        const saved = localStorage.getItem('shopify_cart_id');
        console.log('Verification - saved cart ID:', saved);
        if (saved !== cartId) {
          console.error('Cart ID was not saved correctly!');
        }
      } catch (error) {
        console.error('Error saving cart ID to localStorage:', error);
      }
    }
  };

  // Load cart on mount
  useEffect(() => {
    const cartId = getCartId();
    console.log('Loading cart on mount, cartId:', cartId);

    // Debug: Check all localStorage items
    if (typeof window !== 'undefined') {
      console.log('All localStorage items:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key || '');
        console.log(`  ${key}: ${value}`);
      }
    }

    if (cartId) {
      refreshCart();
    }
  }, []);

  // Save cart ID when cart is created
  useEffect(() => {
    if (cart?.id) {
      console.log('Cart created/updated, saving ID:', cart.id);
      setCartId(cart.id);
    }
  }, [cart?.id]);

  const refreshCart = async () => {
    const cartId = getCartId();
    console.log('Refreshing cart with ID:', cartId);
    if (!cartId) return;

    try {
      setIsLoading(true);
      const cartData = await getCart(cartId);
      console.log('Cart loaded successfully:', cartData);
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      console.log('🚨 CART LOAD FAILED - This will clear the cart ID!');
      // If cart doesn't exist, remove the ID and clear cart state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopify_cart_id');
      }
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (merchandiseId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      let cartId = getCartId();
      console.log('Adding to cart, existing cartId:', cartId);

      if (!cartId) {
        // Create new cart
        console.log('No existing cart, creating new one');
        const newCart = await createCart([{
          merchandiseId,
          quantity
        }]);
        console.log('New cart created:', newCart);
        setCart(newCart);
        setCartId(newCart.id);
      } else {
        try {
          // Try to add to existing cart
          console.log('Adding to existing cart:', cartId);
          const updatedCart = await addToCartAPI(cartId, merchandiseId, quantity);
          console.log('Cart updated:', updatedCart);
          setCart(updatedCart);
        } catch (error) {
          // If cart doesn't exist anymore, create a new one
          console.log('Cart not found, creating new cart');
          const newCart = await createCart([{
            merchandiseId,
            quantity
          }]);
          setCart(newCart);
          setCartId(newCart.id);
        }
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (lineIds: string[]) => {
    const cartId = getCartId();
    if (!cartId) return;

    try {
      setIsLoading(true);
      const updatedCart = await removeFromCartAPI(cartId, lineIds);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    console.log('🚨 CLEARING CART AND LOCALSTORAGE - This should not happen unless user logs out!');
    console.trace('Stack trace for clearCart call:');
    setCart(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopify_cart_id');
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      addToCart,
      removeFromCart,
      refreshCart,
      clearCart,
      getCartId,
      setCartId
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
