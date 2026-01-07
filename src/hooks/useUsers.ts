import { useState, useEffect, useCallback } from 'react';

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

export function useUsers(enabled: boolean = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If the session cookie is still being created, the admin endpoint can briefly 401.
      // In that case, retry once and then fail silently to avoid console spam.
      const fetchUsers = async () => fetch('/api/admin/users');

      let response = await fetchUsers();
      if (response.status === 401) {
        await new Promise((r) => setTimeout(r, 600));
        response = await fetchUsers();
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated as admin (or cookie not present). Don't treat as an error here.
          setUsers([]);
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
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
    loading,
    error,
    loadUsers,
    deleteUser
  };
}

