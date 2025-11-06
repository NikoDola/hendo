'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, LogOut } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import { usePurchases } from '@/hooks/usePurchases';
import { useDownload } from '@/hooks/useDownload';
import UserProfile from '@/components/features/user/UserProfile';
import UserPurchasesList from '@/components/features/user/UserPurchasesList';
import '@/components/pages/UserDashboard.css';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  ipAddress?: string;
  purchases: number;
}

export default function UserDashboard() {
  const { user, loading: isLoading, signOut } = useUserAuth();
  const { purchases, loading: loadingPurchases, loadPurchases } = usePurchases();
  const { download } = useDownload();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadUserData();
    }
  }, [user, isLoading, router]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUserData({
            id: data.user.id || user?.uid || '',
            email: data.user.email || user?.email || '',
            name: data.user.name || data.user.displayName || user?.displayName || '',
            role: data.user.role || user?.role || 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            purchases: purchases.length
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading only after hydration to avoid mismatch
  if (isLoading) {
    return (
      <div className="userLoadingContainer" suppressHydrationWarning>
        <div className="userSpinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="userDashboardContainer">
      <header className="userHeader">
        <div className="userHeaderContainer">
          <div className="userHeaderContent">
            <div className="userHeaderLeft">
              <Music size={32} className="userMusicIcon" />
              <h1 className="userTitle">Dashboard</h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="userLogoutButton"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="userMain">
        <UserProfile user={user} userData={userData || undefined} />
        <UserPurchasesList
          purchases={purchases}
          loading={loadingPurchases}
          onRefresh={loadPurchases}
          onDownload={download}
        />
      </main>
    </div>
  );
}

