import { User, Mail, Calendar } from 'lucide-react';
import type { SessionUser } from '@/context/UserAuthContext';

interface UserProfileProps {
  user: SessionUser;
  userData?: {
    createdAt: string;
    lastLoginAt: string;
    purchases: number;
    ipAddress?: string;
  };
}

export default function UserProfile({ user, userData }: UserProfileProps) {
  return (
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
                <span className="userStatsValue">{userData?.purchases || 0}</span>
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
  );
}

