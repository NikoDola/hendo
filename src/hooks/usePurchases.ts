import { useState, useEffect, useCallback } from 'react';

export interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
  price: number;
  zipUrl: string;
  pdfUrl: string;
  purchasedAt: string;
  expiresAt: string;
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/purchases');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch purchases');
      }
      
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
      console.error('Failed to load purchases:', err);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  return {
    purchases,
    loading,
    error,
    loadPurchases
  };
}

