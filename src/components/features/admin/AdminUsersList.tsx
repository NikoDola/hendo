import { useState } from 'react';
import { Search, Filter, Eye, Trash2 } from 'lucide-react';
import type { User } from '@/hooks/useUsers';

interface AdminUsersListProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
}

export default function AdminUsersList({ users, onDeleteUser }: AdminUsersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    onDeleteUser(userId);
  };

  return (
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
          aria-label="Toggle sort order"
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
                      onClick={() => {/* View user details */ }}
                      className="adminActionButton adminActionButtonView"
                      aria-label="View user"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="adminActionButton adminActionButtonDelete"
                      aria-label="Delete user"
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
  );
}

