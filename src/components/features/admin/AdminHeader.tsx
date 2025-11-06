import { Music, Menu, X } from 'lucide-react';
import './AdminHeader.css';

interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function AdminHeader({ 
  userName, 
  userEmail, 
  sidebarOpen, 
  onToggleSidebar 
}: AdminHeaderProps) {
  return (
    <header className="adminHeader">
      <div className="adminHeaderContainer">
        <div className="adminHeaderContent">
          <div className="adminHeaderLeft">
            <button
              onClick={onToggleSidebar}
              className="adminMobileMenuButton"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Music size={32} className="adminHeaderMusicIcon" />
            <h1 className="adminTitle">Admin Dashboard</h1>
          </div>

          <div className="adminHeaderRight">
            <span className="adminWelcomeText">
              Welcome, {userName || userEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

