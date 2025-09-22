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
      return cartId;
    }
    return null;
  };

  // Set cart ID in localStorage
  const setCartId = (cartId: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shopify_cart_id', cartId);
      } catch (error) {
        console.error('Error saving cart ID to localStorage:', error);
      }
    }
  };

  // Load cart on mount
  useEffect(() => {
    const cartId = getCartId();

    if (cartId) {
      refreshCart();
    } else {
      // Create a new empty cart if no cart ID exists
      refreshCart();
    }
  }, []);

  // Save cart ID when cart is created
  useEffect(() => {
    if (cart?.id) {
      setCartId(cart.id);
    }
  }, [cart?.id]);

  const refreshCart = async () => {
    const cartId = getCartId();

    if (!cartId) {
      // Create a new empty cart if no cart ID exists
      try {
        setIsLoading(true);
        const newCart = await createCart([]);
        setCart(newCart);
        setCartId(newCart.id);
      } catch (error) {
        console.error('Failed to create new cart:', error);
        setCart(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const cartData = await getCart(cartId);
      setCart(cartData);
    } catch (error) {
      // If cart doesn't exist (expired), create a new one instead of clearing
      try {
        const newCart = await createCart([]);
        setCart(newCart);
        setCartId(newCart.id);
      } catch (createError) {
        console.error('Failed to create new cart after expiration:', createError);
        setCart(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (merchandiseId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      let cartId = getCartId();

      if (!cartId) {
        // Create new cart with the item
        const newCart = await createCart([{
          merchandiseId,
          quantity
        }]);
        setCart(newCart);
        setCartId(newCart.id);
      } else {
        try {
          // Try to add to existing cart
          const updatedCart = await addToCartAPI(cartId, merchandiseId, quantity);
          setCart(updatedCart);
        } catch (error) {
          // If cart doesn't exist anymore (expired), create a new one with the item
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
    if (!cartId) {
      return;
    }

    try {
      setIsLoading(true);
      const updatedCart = await removeFromCartAPI(cartId, lineIds);
      setCart(updatedCart);
    } catch (error) {
      // If cart doesn't exist anymore, refresh the cart to create a new one
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
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
