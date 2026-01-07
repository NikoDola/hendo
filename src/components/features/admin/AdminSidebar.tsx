import { Users, Music } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Music', icon: Music },
];

export default function AdminSidebar({ isOpen, activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <div className={isOpen ? 'adminSidebar adminSidebarVisible' : 'adminSidebar'}>
      <nav className="adminSidebarNav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`adminSidebarButton ${activeTab === tab.id ? 'adminSidebarButtonActive' : ''}`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

