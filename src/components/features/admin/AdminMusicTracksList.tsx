'use client';

import { Plus, Edit, Trash2, Play, Pause, Home } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MusicTrack } from '@/hooks/useMusicTracks';
import './AdminMusicTracksList.css';

interface AdminMusicTracksListProps {
  tracks: MusicTrack[];
  onAddTrack: () => void;
  onEditTrack: (track: MusicTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  onRefreshTracks: () => void;
}

export default function AdminMusicTracksList({
  tracks,
  onAddTrack,
  onEditTrack,
  onDeleteTrack,
  onRefreshTracks
}: AdminMusicTracksListProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const playingTrackIdRef = useRef<string | null>(null);
  const [togglingHomeId, setTogglingHomeId] = useState<string | null>(null);

  const trackIds = useMemo(() => tracks.map(t => t.id), [tracks]);
  const homeCount = useMemo(() => tracks.filter(t => t.showToHome).length, [tracks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    audioRef.current.loop = false;

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      const id = playingTrackIdRef.current;
      if (!id) return;
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      setProgressById((prev) => ({
        ...prev,
        [id]: (audio.currentTime / audio.duration) * 100,
      }));
    };

    const onEnded = () => {
      const id = playingTrackIdRef.current;
      if (!id) return;
      setProgressById((prev) => ({ ...prev, [id]: 0 }));
      setPlayingTrackId(null);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    playingTrackIdRef.current = playingTrackId;
  }, [playingTrackId]);

  const togglePlay = async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (playingTrackId === track.id) {
        audio.pause();
        setPlayingTrackId(null);
        return;
      }

      // Stop any current audio
      audio.pause();

      // Reset previous progress display
      if (playingTrackId) {
        setProgressById((prev) => ({ ...prev, [playingTrackId]: 0 }));
      }

      audio.src = track.audioFileUrl;
      await audio.play();
      setPlayingTrackId(track.id);
    } catch (e) {
      console.error('Admin preview playback failed:', e);
    }
  };

  const seek = (trackId: string, percent: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingTrackId !== trackId) return;
    if (!audio.duration || Number.isNaN(audio.duration)) return;
    audio.currentTime = (percent / 100) * audio.duration;
  };

  const toggleHome = async (track: MusicTrack) => {
    if (togglingHomeId) return;

    const next = !track.showToHome;
    if (next && homeCount >= 3) {
      alert('You cannot add more than 3 music tracks to the home page. Please remove one.');
      return;
    }

    setTogglingHomeId(track.id);
    try {
      const res = await fetch(`/api/admin/music/${encodeURIComponent(track.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showToHome: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update home page setting');
        return;
      }

      await onRefreshTracks();
    } finally {
      setTogglingHomeId(null);
    }
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
        <h2 className="adminSectionTitle" data-text="Music">Music</h2>
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
                  <div className="adminTrackTitleRow">
                    <h4 className="adminTrackTitle">{track.title}</h4>
                  </div>
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

                {/* Quick preview player */}
                <div className="adminTrackPlayer">
                  <button
                    type="button"
                    className={`adminTrackPlayButton ${playingTrackId === track.id ? 'playing' : ''}`}
                    onClick={() => togglePlay(track)}
                    aria-label={playingTrackId === track.id ? 'Pause preview' : 'Play preview'}
                  >
                    {playingTrackId === track.id ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <div
                    className="adminTrackProgressBar"
                    onMouseDown={(e) => {
                      const target = e.currentTarget;
                      const rect = target.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      const percent = (x / rect.width) * 100;
                      seek(track.id, percent);
                    }}
                    role="slider"
                    aria-label="Preview progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressById[track.id] || 0)}
                  >
                    <div
                      className="adminTrackProgressFill"
                      style={{ width: `${progressById[track.id] || 0}%` }}
                    />
                  </div>
                </div>

                {!!track.audioFileName && (
                  <div className="adminTrackFilePath" title={track.audioFileName}>
                    File: {track.audioFileName}
                  </div>
                )}

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

                <div className="adminTrackFeaturedRow"   onClick={() => toggleHome(track)}>
                  <button
                    type="button"
                    className={`adminTrackHomeToggle ${track.showToHome ? 'active' : ''}`}
                  
                    disabled={togglingHomeId === track.id}
                    aria-label={track.showToHome ? 'Remove from home page' : 'Add to home page'}
                    title={track.showToHome ? 'Shown on Home page (click to remove)' : 'Not on Home page (click to add)'}
                  >
                    <Home size={16} fill={track.showToHome ? 'currentColor' : 'none'} />
                  </button>
                  <span className={`adminTrackFeaturedLabel ${track.showToHome ? 'active' : ''}`}>
                    {track.showToHome ? 'Featured Home' : 'Not Featured'}
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

