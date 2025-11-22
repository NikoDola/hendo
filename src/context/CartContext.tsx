'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageFileUrl?: string;
}

interface CartData {
  items: CartItem[];
  expiry: number;
}

interface CartContextType {
  cartItems: CartItem[];
  favorites: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleFavorite: (itemId: string, item?: CartItem) => void;
  removeFavorite: (itemId: string) => void;
  isInCart: (itemId: string) => boolean;
  isFavorite: (itemId: string) => boolean;
  cartCount: number;
  cartTotal: number;
  favoriteItems: CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hendo_cart';
const FAVORITES_STORAGE_KEY = 'hendo_favorites';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        // Load cart with expiry check
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
          const parsed: CartData = JSON.parse(cartData);
          if (Date.now() < parsed.expiry) {
            setCartItems(parsed.items);
          } else {
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        }

        // Load favorites (no expiry)
        const favData = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (favData) {
          const parsed = JSON.parse(favData);
          setFavorites(parsed.ids || []);
          setFavoriteItems(parsed.items || []);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };

    loadFromStorage();
  }, []);

  // Save cart to localStorage with expiry
  useEffect(() => {
    if (cartItems.length > 0) {
      const cartData: CartData = {
        items: cartItems,
        expiry: Date.now() + TWO_WEEKS_MS
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cartItems]);

  // Save favorites to localStorage (no expiry)
  useEffect(() => {
    if (favorites.length > 0 || favoriteItems.length > 0) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({
        ids: favorites,
        items: favoriteItems
      }));
    } else {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
  }, [favorites, favoriteItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const toggleFavorite = (itemId: string, item?: CartItem) => {
    setFavorites((prev) => {
      if (prev.includes(itemId)) {
        setFavoriteItems((favItems) => favItems.filter((i) => i.id !== itemId));
        return prev.filter((id) => id !== itemId);
      }
      if (item) {
        setFavoriteItems((favItems) => [...favItems, item]);
      }
      return [...prev, itemId];
    });
  };

  const removeFavorite = (itemId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== itemId));
    setFavoriteItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const isInCart = (itemId: string) => {
    return cartItems.some((item) => item.id === itemId);
  };

  const isFavorite = (itemId: string) => {
    return favorites.includes(itemId);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favorites,
        addToCart,
        removeFromCart,
        clearCart,
        toggleFavorite,
        removeFavorite,
        isInCart,
        isFavorite,
        cartCount: cartItems.length,
        cartTotal,
        favoriteItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

