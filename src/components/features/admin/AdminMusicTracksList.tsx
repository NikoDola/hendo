import { Plus, Edit, Trash2, Star, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { MusicTrack } from '@/hooks/useMusicTracks';
import AdminTrackStatsModal, { type StatsUserRow } from './AdminTrackStatsModal';
import './AdminMusicTracksList.css';

interface AdminMusicTracksListProps {
  tracks: MusicTrack[];
  onAddTrack: () => void;
  onEditTrack: (track: MusicTrack) => void;
  onDeleteTrack: (trackId: string) => void;
}

export default function AdminMusicTracksList({
  tracks,
  onAddTrack,
  onEditTrack,
  onDeleteTrack
}: AdminMusicTracksListProps) {
  const [statsById, setStatsById] = useState<Record<string, { favoriteCount: number; cartCount: number }>>({});
  const [statsLoaded, setStatsLoaded] = useState(false);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsModalKind, setStatsModalKind] = useState<'favorites' | 'carts'>('favorites');
  const [statsModalTrackId, setStatsModalTrackId] = useState<string>('');
  const [statsModalTrackTitle, setStatsModalTrackTitle] = useState<string>('');
  const [statsModalUsers, setStatsModalUsers] = useState<StatsUserRow[]>([]);
  const [statsModalLoading, setStatsModalLoading] = useState(false);

  const trackIds = useMemo(() => tracks.map(t => t.id), [tracks]);

  useEffect(() => {
    const loadStats = async () => {
      if (trackIds.length === 0) {
        setStatsById({});
        setStatsLoaded(true);
        return;
      }
      try {
        const res = await fetch('/api/admin/music/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackIds }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setStatsById(data.stats || {});
      } finally {
        setStatsLoaded(true);
      }
    };
    setStatsLoaded(false);
    loadStats();
  }, [trackIds]);

  const openStatsModal = async (track: MusicTrack, kind: 'favorites' | 'carts') => {
    setStatsModalOpen(true);
    setStatsModalKind(kind);
    setStatsModalTrackId(track.id);
    setStatsModalTrackTitle(track.title);
    setStatsModalUsers([]);
    setStatsModalLoading(true);
    try {
      const res = await fetch(`/api/admin/music/stats?trackId=${encodeURIComponent(track.id)}&kind=${kind}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatsModalUsers(Array.isArray(data.users) ? data.users : []);
    } finally {
      setStatsModalLoading(false);
    }
  };

  const closeStatsModal = () => {
    setStatsModalOpen(false);
    setStatsModalUsers([]);
    setStatsModalTrackId('');
    setStatsModalTrackTitle('');
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }
    onDeleteTrack(trackId);
  };

  return (
    <div>
      <div className="adminMusicTracksHeader">
        <h2 className="adminSectionTitle">Music</h2>
        <button
          onClick={onAddTrack}
          className="adminProductAddButton adminMusicTracksAddButton"
        >
          <Plus size={20} />
          Add Music
        </button>
      </div>

      <div className="adminTracksList">
        <h3 className="adminSectionTitle adminMusicTracksListTitle">
          All Tracks
        </h3>
        {tracks.length === 0 ? (
          <p className="adminTabContent">No tracks yet. Click &quot;Add Music&quot; to create one.</p>
        ) : (
          <div className="adminTracksGrid">
            {tracks.map((track) => (
              <div key={track.id} className="adminTrackCard">
                {/* Track Image Thumbnail */}
                <div className="adminTrackImageContainer">
                  {track.imageFileUrl ? (
                    <Image 
                      src={track.imageFileUrl} 
                      alt={track.title}
                      width={100}
                      height={100}
                      className="adminTrackImage"
                    />
                  ) : (
                    <div className="adminTrackImagePlaceholder">
                      <span className="adminTrackImagePlaceholderIcon">?</span>
                    </div>
                  )}
                </div>

                <div className="adminTrackHeader">
                  <h4 className="adminTrackTitle">{track.title}</h4>
                  <div className="adminTrackActions">
                    <button
                      onClick={() => onEditTrack(track)}
                      className="adminTrackActionButton adminTrackActionEdit"
                      aria-label="Edit track"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="adminTrackActionButton adminTrackActionDelete"
                      aria-label="Delete track"
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

                <div className="adminTrackStatsRow">
                  <button
                    type="button"
                    className="adminTrackStatButton"
                    onClick={() => openStatsModal(track, 'favorites')}
                    aria-label="View favorites users"
                  >
                    <Star size={16} />
                    <span className="adminTrackStatCount">
                      {statsLoaded ? (statsById[track.id]?.favoriteCount ?? 0) : '—'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="adminTrackStatButton"
                    onClick={() => openStatsModal(track, 'carts')}
                    aria-label="View cart users"
                  >
                    <ShoppingCart size={16} />
                    <span className="adminTrackStatCount">
                      {statsLoaded ? (statsById[track.id]?.cartCount ?? 0) : '—'}
                    </span>
                  </button>
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

      <AdminTrackStatsModal
        isOpen={statsModalOpen}
        kind={statsModalKind}
        trackTitle={statsModalTrackTitle}
        users={statsModalUsers}
        loading={statsModalLoading}
        onClose={closeStatsModal}
      />
    </div>
  );
}

