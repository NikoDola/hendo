import { useState, useEffect, useCallback, useRef } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  ipAddress?: string;
  purchases: number;
  totalSpent?: number;
}

const PAGE_SIZE = 10;

// Lazy-loads users PAGE_SIZE at a time. `users` accumulates loaded pages;
// call `loadMore()` to append the next page while `hasMore` is true.
export function useUsers(enabled: boolean = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guards against double-fires (StrictMode, rapid clicks) without stale state.
  const inFlight = useRef(false);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set('cursor', cursor);

    // If the session cookie is still being created, the admin endpoint can
    // briefly 401. In that case, retry once and then fail silently.
    let response = await fetch(`/api/admin/users?${params}`);
    if (response.status === 401) {
      await new Promise((r) => setTimeout(r, 600));
      response = await fetch(`/api/admin/users?${params}`);
    }
    return response;
  }, []);

  const loadUsers = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setLoading(true);
      setError(null);

      const response = await fetchPage(null);
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated as admin (or cookie not present). Not an error here.
          setUsers([]);
          setNextCursor(null);
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setNextCursor(data.nextCursor || null);
      setTotal(typeof data.total === 'number' ? data.total : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Failed to load users:', err);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !nextCursor) return;
    inFlight.current = true;
    try {
      setLoadingMore(true);
      setError(null);

      const response = await fetchPage(nextCursor);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers((prev) => {
        // Dedupe on id in case a page boundary shifted between requests.
        const seen = new Set(prev.map((u) => u.id));
        const fresh = (data.users || []).filter((u: User) => !seen.has(u.id));
        return [...prev, ...fresh];
      });
      setNextCursor(data.nextCursor || null);
      if (typeof data.total === 'number') setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Failed to load more users:', err);
    } finally {
      inFlight.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, nextCursor]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      setTotal((t) => (typeof t === 'number' ? Math.max(0, t - 1) : t));
      return true;
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Avoid calling admin-only endpoints when not on the admin users tab.
      setLoading(false);
      return;
    }
    loadUsers();
  }, [enabled, loadUsers]);

  return {
    users,
    total,
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    error,
    loadUsers,
    loadMore,
    deleteUser
  };
}
