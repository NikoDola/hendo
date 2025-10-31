'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MusicTrack, CreateMusicData, UpdateMusicData } from '@/lib/music';
import MusicList from '@/components/admin/MusicList';
import MusicUploadForm from '@/components/admin/MusicUploadForm';
import { Plus, LogOut, Music } from 'lucide-react';

export default function AdminPanel() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        setAdminEmail(data.admin?.email);
        loadTracks();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    }
  };

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/music');
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: CreateMusicData) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('hashtags', data.hashtags.join(','));
      formData.append('price', data.price.toString());
      formData.append('audioFile', data.audioFile);
      if (data.pdfFile) {
        formData.append('pdfFile', data.pdfFile);
      }

      const response = await fetch('/api/admin/music', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setTracks(prev => [result.track, ...prev]);
        setShowUploadForm(false);
        setEditingTrack(null);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (track: MusicTrack) => {
    setEditingTrack(track);
    setShowUploadForm(true);
  };

  const handleUpdate = async (data: CreateMusicData) => {
    if (!editingTrack) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      if (data.title !== editingTrack.title) formData.append('title', data.title);
      if (data.description !== editingTrack.description) formData.append('description', data.description);
      if (JSON.stringify(data.hashtags) !== JSON.stringify(editingTrack.hashtags)) {
        formData.append('hashtags', data.hashtags.join(','));
      }
      if (data.price !== editingTrack.price) formData.append('price', data.price.toString());
      if (data.audioFile) formData.append('audioFile', data.audioFile);
      if (data.pdfFile) formData.append('pdfFile', data.pdfFile);

      const response = await fetch(`/api/admin/music/${editingTrack.id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setTracks(prev => prev.map(track =>
          track.id === editingTrack.id ? result.track : track
        ));
        setShowUploadForm(false);
        setEditingTrack(null);
      } else {
        const error = await response.json();
        alert(`Update failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Update failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/music/${trackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTracks(prev => prev.filter(track => track.id !== trackId));
      } else {
        const error = await response.json();
        alert(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCancel = () => {
    setShowUploadForm(false);
    setEditingTrack(null);
  };

  if (showUploadForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <MusicUploadForm
            onSubmit={editingTrack ? handleUpdate : handleUpload}
            onCancel={handleCancel}
            isLoading={isUploading}
            initialData={editingTrack ? {
              title: editingTrack.title,
              description: editingTrack.description,
              hashtags: editingTrack.hashtags,
              price: editingTrack.price
            } : undefined}
            mode={editingTrack ? 'edit' : 'create'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Music className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-800">Music Admin Panel</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {adminEmail}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Music Tracks</h2>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Upload New Track
          </button>
        </div>

        <MusicList
          tracks={tracks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}