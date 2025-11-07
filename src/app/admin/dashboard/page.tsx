'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/context/UserAuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useMusicTracks, type MusicTrack } from '@/hooks/useMusicTracks';
import AdminHeader from '@/components/features/admin/AdminHeader';
import AdminSidebar from '@/components/features/admin/AdminSidebar';
import AdminUsersList from '@/components/features/admin/AdminUsersList';
import AdminMusicTracksList from '@/components/features/admin/AdminMusicTracksList';
import AdminMusicTrackForm from '@/components/features/admin/AdminMusicTrackForm';
import '@/components/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const { user, loading: isLoading } = useUserAuth();
  const { users, loadUsers, deleteUser } = useUsers();
  const { tracks, loadTracks, deleteTrack } = useMusicTracks();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (activeTab === 'products') {
      loadTracks();
    }
  }, [activeTab, loadTracks]);

  const handleAddTrack = () => {
    setShowForm(true);
    setEditingTrack(undefined);
  };

  const handleEditTrack = (track: MusicTrack) => {
    setShowForm(true);
    setEditingTrack(track);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTrack(undefined);
  };

  const handleSubmitTrack = async (formData: Record<string, unknown>) => {
    const url = editingTrack ? `/api/admin/music/${editingTrack.id}` : '/api/admin/music';
    const method = editingTrack ? 'PUT' : 'POST';

    const payload: Record<string, unknown> = {
      title: String(formData.title || ''),
      description: String(formData.description || ''),
      hashtags: Array.isArray(formData.hashtags) ? formData.hashtags : [],
      price: parseFloat(String(formData.price || '0')),
    };

    if (formData.audioFileUrl && formData.audioFileName) {
      payload.audioFileUrl = String(formData.audioFileUrl);
      payload.audioFileName = String(formData.audioFileName);
    }

    if (formData.pdfFileUrl !== undefined) {
      payload.pdfFileUrl = formData.pdfFileUrl ? String(formData.pdfFileUrl) : null;
      payload.pdfFileName = formData.pdfFileName ? String(formData.pdfFileName) : null;
    }

    if (formData.imageFileUrl !== undefined) {
      payload.imageFileUrl = formData.imageFileUrl ? String(formData.imageFileUrl) : null;
      payload.imageFileName = formData.imageFileName ? String(formData.imageFileName) : null;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save track');
    }

    await loadTracks();
    handleCancelForm();
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      await loadUsers();
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    const success = await deleteTrack(trackId);
    if (success) {
      await loadTracks();
    }
  };

  // Show loading only after hydration to avoid mismatch
  if (isLoading) {
    return (
      <div className="adminLoadingContainer" suppressHydrationWarning>
        <div className="adminSpinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="adminDashboardContainer">
      <AdminHeader
        userName={user.displayName || ''}
        userEmail={user.email || ''}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="adminLayout">
        <AdminSidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="adminMain">
          {activeTab === 'users' && (
            <AdminUsersList users={users} onDeleteUser={handleDeleteUser} />
          )}

          {activeTab === 'products' && (
            <div>
              {showForm ? (
                <AdminMusicTrackForm
                  track={editingTrack}
                  onSubmit={handleSubmitTrack}
                  onCancel={handleCancelForm}
                />
              ) : (
                <AdminMusicTracksList
                  tracks={tracks}
                  onAddTrack={handleAddTrack}
                  onEditTrack={handleEditTrack}
                  onDeleteTrack={handleDeleteTrack}
                />
              )}
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

