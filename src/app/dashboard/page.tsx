'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, User, Mail, Calendar, LogOut, Download, FileText } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
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

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
  price: number;
  zipUrl: string;
  pdfUrl: string;
  purchasedAt: string;
  expiresAt: string;
}

export default function UserDashboard() {
  const { user, loading: isLoading, signOut } = useUserAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadUserData();
      loadPurchases();
    }
  }, [user, isLoading, router]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          // Fetch additional user info if needed
          setUserData({
            id: data.user.id || user?.uid || '',
            email: data.user.email || user?.email || '',
            name: data.user.name || data.user.displayName || user?.displayName || '',
            role: data.user.role || user?.role || 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            purchases: 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      console.log('Loading purchases...');
      const response = await fetch('/api/user/purchases');
      if (response.ok) {
        const data = await response.json();
        console.log('Purchases data received:', data);
        setPurchases(data.purchases || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load purchases:', errorData);
        // Even if there's an error, set empty array so UI shows "no purchases"
        setPurchases([]);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    // Try fetch first (may fail due to CORS with signed URLs)
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        return; // Success, exit early
      }
    } catch (fetchError) {
      // Fetch failed - expected with signed URLs, will use fallback (silent)
    }
    
    // Fallback: direct link download (signed URLs work when clicked directly)
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="userLoadingContainer">
        <div className="userSpinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="userDashboardContainer">
      {/* Header */}
      <header className="userHeader">
        <div className="userHeaderContainer">
          <div className="userHeaderContent">
            <div className="userHeaderLeft">
              <Music size={32} style={{ color: 'white' }} />
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

      {/* Main Content */}
      <main className="userMain">
        <div className="userProfileCard">
          <h2 className="userProfileTitle">Your Profile</h2>
          
          <div className="userProfileGrid">
            <div className="userProfileSection">
                  <div className="userProfileItem">
                    <User className="userProfileItemIcon" size={20} />
                    <div className="userProfileItemContent">
                      <p className="userProfileLabel">Name</p>
                      <p className="userProfileValue">{user.displayName || user.email || 'User'}</p>
                    </div>
                  </div>
                  
                  <div className="userProfileItem">
                    <Mail className="userProfileItemIcon" size={20} />
                    <div className="userProfileItemContent">
                      <p className="userProfileLabel">Email</p>
                      <p className="userProfileValue">{user.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {userData && (
                    <div className="userProfileItem">
                      <Calendar className="userProfileItemIcon" size={20} />
                      <div className="userProfileItemContent">
                        <p className="userProfileLabel">Member Since</p>
                        <p className="userProfileValue">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
            </div>
            
            <div className="userProfileSection">
              <div className="userStatsCard">
                <h3 className="userStatsTitle">Account Stats</h3>
                <div className="userStatsList">
                  <div className="userStatsItem">
                    <span className="userStatsLabel">Role:</span>
                    <span className="userStatsValue">{user.role}</span>
                  </div>
                  <div className="userStatsItem">
                    <span className="userStatsLabel">Purchases:</span>
                    <span className="userStatsValue">{purchases.length}</span>
                  </div>
                  {userData && (
                    <div className="userStatsItem">
                      <span className="userStatsLabel">Last Login:</span>
                      <span className="userStatsValue">
                        {new Date(userData.lastLoginAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {userData?.ipAddress && (
                <div className="userStatsCard">
                  <h3 className="userStatsTitle">Connection Info</h3>
                  <p className="userStatsText">IP Address: {userData.ipAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchased Tracks Section */}
        <div className="userProfileCard" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="userProfileTitle" style={{ margin: 0 }}>My Purchased Tracks</h2>
            <button
              onClick={loadPurchases}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              disabled={loadingPurchases}
            >
              {loadingPurchases ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {loadingPurchases ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading your tracks...
            </div>
          ) : purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              <Music size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>You haven't purchased any tracks yet.</p>
              <a href="/music" style={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'underline', marginTop: '0.5rem', display: 'inline-block' }}>
                Browse Music Store
              </a>
            </div>
          ) : (
            <div className="userPurchasesGrid">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="userPurchaseCard">
                  <div className="userPurchaseHeader">
                    <Music size={24} className="userPurchaseIcon" />
                    <div className="userPurchaseInfo">
                      <h3 className="userPurchaseTitle">{purchase.trackTitle}</h3>
                      <p className="userPurchaseDate">
                        Purchased: {new Date(purchase.purchasedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="userPurchaseActions">
                    <button
                      onClick={() => handleDownload(purchase.zipUrl, `${purchase.trackTitle}.zip`)}
                      className="userPurchaseButton userPurchaseButtonPrimary"
                    >
                      <Download size={18} />
                      Download Track
                    </button>
                    <button
                      onClick={() => handleDownload(purchase.pdfUrl, `${purchase.trackTitle}_rights.pdf`)}
                      className="userPurchaseButton userPurchaseButtonSecondary"
                    >
                      <FileText size={18} />
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}