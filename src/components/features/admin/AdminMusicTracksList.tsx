import { Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { MusicTrack } from '@/hooks/useMusicTracks';
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
  const handleDelete = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }
    onDeleteTrack(trackId);
  };

  return (
    <div>
      <div className="adminMusicTracksHeader">
        <h2 className="adminSectionTitle">Products</h2>
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
  );
}

