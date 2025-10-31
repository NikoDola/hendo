'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Music, 
  Users, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Search,
  Filter,
  Trash2,
  Eye
} from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import '@/components/pages/AdminDashboard.css';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  ipAddress?: string;
  purchases: number;
}

export default function AdminDashboard() {
  const { user, loading: isLoading, signOut } = useUserAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    } else if (!isLoading && user && user.role === 'admin') {
      loadUsers();
    }
  }, [user, isLoading, router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy as keyof User];
      const bValue = b[sortBy as keyof User];
      
      if (sortBy === 'createdAt' || sortBy === 'lastLoginAt') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  if (isLoading) {
    return (
      <div className="adminLoadingContainer">
        <div className="adminSpinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="adminDashboardContainer">
      {/* Header */}
      <header className="adminHeader">
        <div className="adminHeaderContainer">
          <div className="adminHeaderContent">
            <div className="adminHeaderLeft">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="adminMobileMenuButton"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Music size={32} style={{ color: 'white' }} />
              <h1 className="adminTitle">Admin Dashboard</h1>
            </div>
            
            <div className="adminHeaderRight">
              <span className="adminWelcomeText">Welcome, {user.displayName || user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="adminLayout">
        {/* Sidebar */}
        <div className={sidebarOpen ? 'adminSidebar adminSidebarVisible' : 'adminSidebar'}>
          <nav className="adminSidebarNav">
            <button
              onClick={() => setActiveTab('users')}
              className={`adminSidebarButton ${activeTab === 'users' ? 'adminSidebarButtonActive' : ''}`}
            >
              <Users size={20} />
              Users
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`adminSidebarButton ${activeTab === 'products' ? 'adminSidebarButtonActive' : ''}`}
            >
              <Music size={20} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`adminSidebarButton ${activeTab === 'statistics' ? 'adminSidebarButtonActive' : ''}`}
            >
              <BarChart3 size={20} />
              Statistics
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <main className="adminMain">
          {activeTab === 'users' && (
            <div>
              <h2 className="adminSectionTitle">Users</h2>
              <div className="adminUsersControls">
                <div className="adminSearchWrapper">
                  <Search className="adminSearchIcon" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="adminSearchInput"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="adminSortSelect"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="purchases">Purchases</option>
                  <option value="lastLoginAt">Last Login</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="adminFilterButton"
                >
                  <Filter size={20} />
                </button>
              </div>

              <div className="adminTableWrapper">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Purchases</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="adminUserCell">
                            <div className="adminUserAvatar">
                              <span>{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="adminUserInfo">
                              <div className="adminUserName">{user.name}</div>
                              <div className="adminUserId">ID: {user.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`adminRoleBadge ${user.role === 'admin' ? 'adminRoleBadgeAdmin' : 'adminRoleBadgeUser'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.purchases}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="adminActionsCell">
                            <button
                              onClick={() => {/* View user details */}}
                              className="adminActionButton adminActionButtonView"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="adminActionButton adminActionButtonDelete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 className="adminSectionTitle">Products</h2>
              <p className="adminTabContent">Music management will be available here.</p>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div>
              <h2 className="adminSectionTitle">Statistics</h2>
              <p className="adminTabContent">Analytics and statistics will be available here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
