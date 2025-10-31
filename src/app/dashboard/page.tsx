'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, User, Mail, Calendar, LogOut } from 'lucide-react';
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

export default function UserDashboard() {
  const { user, loading: isLoading, signOut } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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
                  <p className="userProfileValue">{user.name}</p>
                </div>
              </div>
              
              <div className="userProfileItem">
                <Mail className="userProfileItemIcon" size={20} />
                <div className="userProfileItemContent">
                  <p className="userProfileLabel">Email</p>
                  <p className="userProfileValue">{user.email}</p>
                </div>
              </div>
              
              <div className="userProfileItem">
                <Calendar className="userProfileItemIcon" size={20} />
                <div className="userProfileItemContent">
                  <p className="userProfileLabel">Member Since</p>
                  <p className="userProfileValue">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
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
                    <span className="userStatsValue">{user.purchases}</span>
                  </div>
                  <div className="userStatsItem">
                    <span className="userStatsLabel">Last Login:</span>
                    <span className="userStatsValue">
                      {new Date(user.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {user.ipAddress && (
                <div className="userStatsCard">
                  <h3 className="userStatsTitle">Connection Info</h3>
                  <p className="userStatsText">IP Address: {user.ipAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}