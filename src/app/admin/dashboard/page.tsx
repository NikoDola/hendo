'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Music,
  Users,
  BarChart3,
  Menu,
  X,
  Search,
  Filter,
  Trash2,
  Eye,
  Plus,
  Edit,
  Upload,
  FileText
} from 'lucide-react';

import { useUserAuth } from '@/context/UserAuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  price: number;
  audioFileUrl: string;
  audioFileName?: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user, loading: isLoading } = useUserAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Music form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hashtags: [] as string[],
    hashtagInput: '',
    price: '',
    audioFile: null as File | null,
    pdfFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    } else if (!isLoading && user && user.role === 'admin') {
      loadUsers();
      if (activeTab === 'products') {
        loadTracks();
      }
    }
  }, [user, isLoading, router, activeTab]);

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

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/admin/music');
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
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

  const handleHashtagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, hashtagInput: value });

    // If comma is entered, add hashtag
    if (value.includes(',')) {
      const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const newHashtags = [...formData.hashtags, ...tags];
      setFormData({ ...formData, hashtags: newHashtags, hashtagInput: '' });
    }
  };

  const handleRemoveHashtag = (index: number) => {
    const newHashtags = formData.hashtags.filter((_, i) => i !== index);
    setFormData({ ...formData, hashtags: newHashtags });
  };

  const handleAddTrack = () => {
    setShowForm(true);
    setIsEditing(false);
    setEditingTrackId(null);
    setError(null);
    setSuccess(null);
    setFormData({
      title: '',
      description: '',
      hashtags: [],
      hashtagInput: '',
      price: '',
      audioFile: null,
      pdfFile: null,
    });
  };

  const handleEditTrack = (track: MusicTrack) => {
    setShowForm(true);
    setIsEditing(true);
    setEditingTrackId(track.id);
    setError(null);
    setSuccess(null);
    setFormData({
      title: track.title,
      description: track.description,
      hashtags: track.hashtags,
      hashtagInput: '',
      price: track.price.toString(),
      audioFile: null,
      pdfFile: null,
    });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingTrackId(null);
    setError(null);
    setSuccess(null);
    setFormData({
      title: '',
      description: '',
      hashtags: [],
      hashtagInput: '',
      price: '',
      audioFile: null,
      pdfFile: null,
    });
  };

  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        setError('Title is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Price must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      if (!isEditing && !formData.audioFile) {
        setError('Audio file is required');
        setIsSubmitting(false);
        return;
      }

      // Upload files directly from client to Firebase Storage (with user's auth token)
      let audioFileUrl: string | undefined;
      let audioFileName: string | undefined;
      let pdfFileUrl: string | undefined;
      let pdfFileName: string | undefined;

      // If editing, get existing track to preserve file URLs if not updating
      let existingTrack: MusicTrack | null = null;
      if (isEditing && editingTrackId) {
        try {
          const trackResponse = await fetch(`/api/admin/music/${editingTrackId}`);
          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            existingTrack = trackData.track;
          }
        } catch (err) {
          console.error('Error fetching existing track:', err);
        }
      }

      // Upload audio file if provided
      if (formData.audioFile) {
        try {
          const timestamp = Date.now();
          audioFileName = `music/${timestamp}_${formData.audioFile.name}`;
          const audioStorageRef = ref(storage, audioFileName);
          await uploadBytes(audioStorageRef, formData.audioFile);
          audioFileUrl = await getDownloadURL(audioStorageRef);
        } catch (uploadError: unknown) {
          console.error('Error uploading audio file:', uploadError);
          const error = uploadError as { code?: string; message?: string };
          if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
            setError('Permission denied: Firebase Storage rules do not allow uploads. Please check your Storage security rules allow admin uploads.');
          } else {
            setError(`Failed to upload audio file: ${error.message || error.code || 'Unknown error'}`);
          }
          setIsSubmitting(false);
          return;
        }
      } else if (isEditing && existingTrack) {
        // If editing and no new file, keep existing
        audioFileUrl = existingTrack.audioFileUrl;
        audioFileName = existingTrack.audioFileName;
      }

      // Upload PDF file if provided
      if (formData.pdfFile) {
        try {
          const timestamp = Date.now();
          pdfFileName = `music/pdfs/${timestamp}_${formData.pdfFile.name}`;
          const pdfStorageRef = ref(storage, pdfFileName);
          await uploadBytes(pdfStorageRef, formData.pdfFile);
          pdfFileUrl = await getDownloadURL(pdfStorageRef);
        } catch (uploadError: unknown) {
          console.error('Error uploading PDF file:', uploadError);
          // PDF upload failure is non-critical, we can continue without it
          console.warn('PDF upload failed, continuing without PDF');
        }
      } else if (isEditing && existingTrack) {
        // If editing and no new PDF, keep existing (or null if none existed)
        pdfFileUrl = existingTrack.pdfFileUrl;
        pdfFileName = existingTrack.pdfFileName;
      }

      // Now send metadata (with file URLs) to API
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue)) {
        setError('Price must be a valid number');
        setIsSubmitting(false);
        return;
      }

      const payload: {
        title: string;
        description: string;
        hashtags: string[];
        price: number;
        audioFileUrl?: string;
        audioFileName?: string;
        pdfFileUrl?: string | null;
        pdfFileName?: string | null;
      } = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        hashtags: Array.isArray(formData.hashtags) ? formData.hashtags : [],
        price: priceValue,
      };

      // Only include file URLs if we have them (for create, audioFileUrl is required)
      if (audioFileUrl && audioFileName) {
        payload.audioFileUrl = String(audioFileUrl);
        payload.audioFileName = String(audioFileName);
      }
      if (pdfFileUrl !== undefined) {
        payload.pdfFileUrl = pdfFileUrl ? String(pdfFileUrl) : null;
        payload.pdfFileName = pdfFileName ? String(pdfFileName) : null;
      }

      // Validate payload can be serialized to JSON
      let payloadString: string;
      try {
        // Log the payload object before stringifying
        console.log('Payload object:', payload);
        console.log('Payload keys:', Object.keys(payload));
        console.log('Payload values:', Object.values(payload));

        payloadString = JSON.stringify(payload);
        console.log('Sending payload string (full):', payloadString);
        console.log('Payload string length:', payloadString.length);
        console.log('Payload string first 50 chars:', payloadString.substring(0, 50));

        // Validate the JSON string is valid by parsing it back
        JSON.parse(payloadString);
      } catch (stringifyError: unknown) {
        const error = stringifyError as Error;
        console.error('Failed to stringify/validate payload:', payload, stringifyError);
        setError(`Failed to prepare request: ${error.message}. Please check all fields are filled correctly.`);
        setIsSubmitting(false);
        return;
      }

      const url = isEditing ? `/api/admin/music/${editingTrackId}` : '/api/admin/music';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: payloadString,
      });

      let data;
      try {
        const text = await response.text();

        // Check if response is empty or invalid
        if (!text || text.trim().length === 0) {
          throw new Error(`Server returned empty response (${response.status})`);
        }

        // Trim whitespace before parsing
        const trimmedText = text.trim();

        try {
          data = JSON.parse(trimmedText);
        } catch {
          // If not valid JSON, show the raw response as error
          console.error('Failed to parse JSON response:', trimmedText);
          throw new Error(`Server error (${response.status}): ${trimmedText.substring(0, 200) || 'Invalid response format'}`);
        }
      } catch (error: unknown) {
        // If we couldn't read the response at all
        if (error instanceof Error && error.message) {
          throw error;
        }
        throw new Error(`Server error (${response.status}): Unable to read response`);
      }

      if (response.ok) {
        setSuccess(isEditing ? 'Track updated successfully!' : 'Track created successfully!');
        await loadTracks();
        // Reset form after a short delay to show success message
        setTimeout(() => {
          handleCancelForm();
        }, 1500);
      } else {
        // Get error message from response
        const errorMessage = data?.error || data?.message || `Failed to ${isEditing ? 'update' : 'create'} track.`;

        // Don't add duplicate context if the error message already contains it
        let fullErrorMessage = errorMessage;
        if (!errorMessage.includes('Please ensure') && !errorMessage.includes('Check your') && !errorMessage.includes('Please check all')) {
          if (response.status === 401) {
            fullErrorMessage = errorMessage + ' Please ensure you are logged in as an admin.';
          } else if (response.status === 403) {
            fullErrorMessage = errorMessage + ' Check your Firebase Storage security rules.';
          } else if (response.status === 400) {
            fullErrorMessage = errorMessage + ' Please check all required fields are filled correctly.';
          } else if (response.status === 507) {
            fullErrorMessage = errorMessage + ' Your Firebase Storage quota has been exceeded.';
          }
        }

        setError(fullErrorMessage);

        // Scroll to error after a brief delay to ensure it's rendered
        setTimeout(() => {
          const errorElement = document.querySelector('.adminFormError');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    } catch (error: unknown) {
      console.error('Submit track error:', error);
      // If it's a network error or fetch failed
      const err = error as Error & { name?: string };
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/music/${trackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTracks(tracks.filter(t => t.id !== trackId));
      } else {
        alert('Failed to delete track');
      }
    } catch (error) {
      console.error('Delete track error:', error);
      alert('Failed to delete track');
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
                              onClick={() => {/* View user details */ }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="adminSectionTitle">Products</h2>
                <button
                  onClick={handleAddTrack}
                  className="adminProductAddButton"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={20} />
                  Add Music
                </button>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="adminProductForm">
                  <h3 className="adminProductFormTitle">{isEditing ? 'Edit Track' : 'Add New Track'}</h3>
                  <form onSubmit={handleSubmitTrack}>
                    <div className="adminFormGroup">
                      <label className="adminFormLabel">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="adminFormInput"
                        required
                      />
                    </div>

                    <div className="adminFormGroup">
                      <label className="adminFormLabel">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="adminFormTextarea"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="adminFormGroup">
                      <label className="adminFormLabel">Hashtags</label>
                      <input
                        type="text"
                        value={formData.hashtagInput}
                        onChange={handleHashtagInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (formData.hashtagInput.trim()) {
                              setFormData({
                                ...formData,
                                hashtags: [...formData.hashtags, formData.hashtagInput.trim()],
                                hashtagInput: ''
                              });
                            }
                          }
                        }}
                        placeholder="Type hashtags separated by commas"
                        className="adminFormInput"
                      />
                      {formData.hashtags.length > 0 && (
                        <div className="adminHashtagsList">
                          {formData.hashtags.map((tag, index) => (
                            <span key={index} className="adminHashtag">
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveHashtag(index)}
                                className="adminHashtagRemove"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="adminFormGroup">
                      <label className="adminFormLabel">Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="adminFormInput"
                        required
                      />
                    </div>

                    <div className="adminFormGroup">
                      <label className="adminFormLabel">
                        Audio File {isEditing ? '(optional, leave empty to keep current)' : '*'}
                      </label>
                      <label className="adminFileInputLabel">
                        <Upload size={16} />
                        <span>{formData.audioFile?.name || 'Choose audio file...'}</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                          className="adminFileInput"
                        />
                      </label>
                    </div>

                    <div className="adminFormGroup">
                      <label className="adminFormLabel">
                        PDF Rights File (optional) {isEditing && '(leave empty to keep current)'}
                      </label>
                      <label className="adminFileInputLabel">
                        <FileText size={16} />
                        <span>{formData.pdfFile?.name || 'Choose PDF file...'}</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setFormData({ ...formData, pdfFile: e.target.files?.[0] || null })}
                          className="adminFileInput"
                        />
                      </label>
                    </div>

                    {error && (
                      <div className="adminFormError" role="alert">
                        <strong>Error:</strong> {error}
                      </div>
                    )}
                    {success && (
                      <div className="adminFormSuccess" role="status">
                        {success}
                      </div>
                    )}
                    <div className="adminFormActions">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="adminFormSubmitButton"
                      >
                        {isSubmitting ? 'Saving...' : isEditing ? 'Update Track' : 'Create Track'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="adminFormCancelButton"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tracks List */}
              <div className="adminTracksList">
                <h3 className="adminSectionTitle" style={{ marginTop: '2rem', marginBottom: '1rem' }}>All Tracks</h3>
                {tracks.length === 0 ? (
                  <p className="adminTabContent">No tracks yet. Click &quot;Add Music&quot; to create one.</p>
                ) : (
                  <div className="adminTracksGrid">
                    {tracks.map((track) => (
                      <div key={track.id} className="adminTrackCard">
                        <div className="adminTrackHeader">
                          <h4 className="adminTrackTitle">{track.title}</h4>
                          <div className="adminTrackActions">
                            <button
                              onClick={() => handleEditTrack(track)}
                              className="adminTrackActionButton adminTrackActionEdit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTrack(track.id)}
                              className="adminTrackActionButton adminTrackActionDelete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="adminTrackDescription">{track.description}</p>
                        <div className="adminTrackTags">
                          {track.hashtags.map((tag, idx) => (
                            <span key={idx} className="adminTrackTag">#{tag}</span>
                          ))}
                        </div>
                        <div className="adminTrackFooter">
                          <span className="adminTrackPrice">${track.price.toFixed(2)}</span>
                          <span className="adminTrackDate">
                            {new Date(track.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
