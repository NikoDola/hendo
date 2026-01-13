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
        } else {
          // Fallback: restore cart from sessionStorage backup (useful after Stripe redirects/back navigation)
          try {
            const backup = sessionStorage.getItem('hendo_cart_backup');
            if (backup) {
              const items = JSON.parse(backup) as CartItem[];
              if (Array.isArray(items) && items.length > 0) {
                setCartItems(items);
                const restored: CartData = { items, expiry: Date.now() + TWO_WEEKS_MS };
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(restored));
              }
            }
          } catch {
            // ignore
          }
        }

        // Load favorites (no expiry)
        const favData = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (favData) {
          const parsed = JSON.parse(favData) as { ids?: unknown; items?: unknown };
          const rawIds = Array.isArray(parsed?.ids) ? (parsed.ids as unknown[]) : [];
          const uniqueIds = Array.from(
            new Set(rawIds.map((v) => String(v)).filter((id) => id.length > 0))
          );

          const rawItems = Array.isArray(parsed?.items) ? (parsed.items as unknown[]) : [];
          const itemsById = new Map<string, CartItem>();
          for (const it of rawItems) {
            if (!it || typeof it !== 'object') continue;
            const obj = it as Record<string, unknown>;
            const id = String(obj.id || '');
            if (!id) continue;
            // Keep the first occurrence; duplicates in storage caused React key warnings.
            if (!itemsById.has(id)) {
              itemsById.set(id, {
                id,
                title: String(obj.title || ''),
                price: typeof obj.price === 'number' ? obj.price : Number(obj.price || 0),
                imageFileUrl: obj.imageFileUrl ? String(obj.imageFileUrl) : undefined,
              });
            }
          }

          // Ensure items list aligns with ids list
          const uniqueItems = uniqueIds.map((id) => itemsById.get(id)).filter(Boolean) as CartItem[];
          setFavorites(uniqueIds);
          setFavoriteItems(uniqueItems);
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
      const uniqueIds = Array.from(new Set(favorites));
      const itemsById = new Map<string, CartItem>();
      for (const it of favoriteItems) {
        if (!it?.id) continue;
        if (!itemsById.has(it.id)) itemsById.set(it.id, it);
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({
        ids: uniqueIds,
        items: uniqueIds.map((id) => itemsById.get(id)).filter(Boolean)
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
        setFavoriteItems((favItems) => (favItems.some((i) => i.id === itemId) ? favItems : [...favItems, item]));
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

