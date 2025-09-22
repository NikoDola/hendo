"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCustomer } from '@/lib/shopify/storefront';

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  defaultAddress?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
}

interface AuthContextType {
  customer: Customer | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
  updateCustomer: (customer: Customer) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ShopifyAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load customer data on mount if access token exists
  useEffect(() => {
    const token = localStorage.getItem('shopify_access_token');
    if (token) {
      setAccessToken(token);
      loadCustomer(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadCustomer = async (token: string) => {
    try {
      setIsLoading(true);
      const customerData = await getCustomer(token);
      setCustomer(customerData);
    } catch (error) {
      console.error('Failed to load customer:', error);
      // If token is invalid, remove it
      localStorage.removeItem('shopify_access_token');
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string) => {
    setAccessToken(token);
    localStorage.setItem('shopify_access_token', token);
    loadCustomer(token);
  };

  const logout = () => {
    setCustomer(null);
    setAccessToken(null);
    localStorage.removeItem('shopify_access_token');

    // Clear cart when user logs out
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopify_cart_id');
    }
  };

  const updateCustomer = (customerData: Customer) => {
    setCustomer(customerData);
  };

  return (
    <AuthContext.Provider value={{
      customer,
      accessToken,
      isLoading,
      login,
      logout,
      updateCustomer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useShopifyAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useShopifyAuth must be used within a ShopifyAuthProvider');
  }
  return context;
}
