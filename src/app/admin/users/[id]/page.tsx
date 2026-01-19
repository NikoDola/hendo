'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserAuth } from '@/context/UserAuthContext';
import { ArrowLeft, User as UserIcon, Mail, Shield, Calendar, Clock, DollarSign } from 'lucide-react';
import '@/components/pages/AdminUserDetail.css';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  ipAddress?: string;
}

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
  price: number;
  purchasedAt: string;
}

export default function AdminUserDetailPage() {
  const { user, loading: authLoading } = useUserAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/users/${userId}/details`);
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUserDetails(data.user);
        setPurchases(data.purchases);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (authLoading || loading) {
    return (
      <div className="adminUserDetailLoadingContainer">
        <div className="adminUserDetailLoadingContent">
          <div className="adminSpinner"></div>
          <p className="adminUserDetailLoadingText">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="adminUserDetailContainer">
        <div className="adminUserDetailError">
          <h2 data-text="Error">Error</h2>
          <p>{error || 'User not found'}</p>
          <button onClick={() => router.push('/admin/dashboard')} className="adminUserDetailBackButton">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="adminUserDetailContainer">
      <div className="adminUserDetailContent">
        {/* Header */}
        <div className="adminUserDetailHeader">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="adminUserDetailBackButton"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="adminUserDetailTitle" data-text="User Details">User Details</h1>
        </div>

        {/* User Info Card */}
        <div className="adminUserDetailCard glass-effect">
          <h2 data-text="Account Information" className="adminUserDetailCardTitle">Account Information</h2>
          
          <div className="adminUserDetailGrid">
            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <UserIcon size={16} />
                <span>Name</span>
              </div>
              <div className="adminUserDetailValue">{userDetails.name}</div>
            </div>

            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <Mail size={16} />
                <span>Email</span>
              </div>
              <div className="adminUserDetailValue">{userDetails.email}</div>
            </div>

            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <Shield size={16} />
                <span>Role</span>
              </div>
              <div className="adminUserDetailValue">
                <span className={`adminUserDetailRoleBadge ${userDetails.role === 'admin' ? 'admin' : 'user'}`}>
                  {userDetails.role}
                </span>
              </div>
            </div>

            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <Calendar size={16} />
                <span>User ID</span>
              </div>
              <div className="adminUserDetailValue adminUserDetailId">{userDetails.id}</div>
            </div>

            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <Calendar size={16} />
                <span>Account Created</span>
              </div>
              <div className="adminUserDetailValue">
                {new Date(userDetails.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="adminUserDetailField">
              <div className="adminUserDetailLabel">
                <Clock size={16} />
                <span>Last Login</span>
              </div>
              <div className="adminUserDetailValue">
                {new Date(userDetails.lastLoginAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase History Card */}
        <div className="adminUserDetailCard glass-effect">
          <div className="adminUserDetailCardHeader">
            <h2 className="adminUserDetailCardTitle" data-text="Purchase History">Purchase History</h2>
            <div className="adminUserDetailStats">
              <div className="adminUserDetailStat">
                <span className="adminUserDetailStatLabel">Total Items:</span>
                <span className="adminUserDetailStatValue">{purchases.length}</span>
              </div>
              <div className="adminUserDetailStat">
                <span className="adminUserDetailStatLabel">Total Spent:</span>
                <span className="adminUserDetailStatValue">
                  <DollarSign size={14} />
                  {totalSpent.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {purchases.length === 0 ? (
            <div className="adminUserDetailEmpty">
              <p>No purchases yet</p>
            </div>
          ) : (
            <div className="adminUserDetailPurchasesList">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="adminUserDetailPurchaseItem">
                  <div className="adminUserDetailPurchaseInfo">
                    <h3 className="adminUserDetailPurchaseTitle">{purchase.trackTitle}</h3>
                    <div className="adminUserDetailPurchaseMeta">
                      <span className="adminUserDetailPurchaseDate">
                        <Clock size={14} />
                        {new Date(purchase.purchasedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="adminUserDetailPurchasePrice">
                    ${purchase.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

