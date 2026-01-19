import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Eye, Trash2 } from 'lucide-react';
import type { User } from '@/hooks/useUsers';
import DeleteConfirmModal from './DeleteConfirmModal';

interface AdminUsersListProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
}

export default function AdminUsersList({ users, onDeleteUser }: AdminUsersListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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

  const handleView = (userId: string) => {
    setLoadingUserId(userId);
    router.push(`/admin/users/${userId}`);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
    }
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <div>
      <h2 className="adminSectionTitle" data-text="Users">Users</h2>
      
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="User">
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
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">
                  <span className={`adminRoleBadge ${user.role === 'admin' ? 'adminRoleBadgeAdmin' : 'adminRoleBadgeUser'}`}>
                    {user.role}
                  </span>
                </td>
                <td data-label="Purchases">
                  <div className="adminPurchasesCell">
                    <div className="adminPurchasesItem">
                      <span className="adminPurchasesLabel">Items:</span> {user.purchases}
                    </div>
                    <div className="adminPurchasesSpent">
                      <span className="adminPurchasesLabel">Spend:</span> ${(user.totalSpent || 0).toFixed(2)}
                    </div>
                  </div>
                </td>
                <td data-label="Actions">
                  <div className="adminActionsCell">
                    <button
                      onClick={() => handleView(user.id)}
                      className="adminActionButton adminActionButtonView"
                      aria-label="View user details"
                      disabled={loadingUserId === user.id}
                    >
                      {loadingUserId === user.id ? (
                        <div className="adminButtonSpinner"></div>
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="adminActionButton adminActionButtonDelete"
                      aria-label="Delete user"
                      disabled={loadingUserId !== null}
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

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        userName={userToDelete?.name || ''}
        userEmail={userToDelete?.email || ''}
      />
    </div>
  );
}

