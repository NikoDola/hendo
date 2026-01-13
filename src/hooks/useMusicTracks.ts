import { useState, useEffect, useCallback } from 'react';

export interface MusicTrack {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: number;
  audioFileUrl: string;
  audioFileName?: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  imageFileUrl?: string;
  imageFileName?: string;
  stems?: boolean;
  showToHome?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useMusicTracks(enabled: boolean = true) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTracks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/music');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/music/${trackId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete track');
      }

      setTracks(prevTracks => prevTracks.filter(t => t.id !== trackId));
      return true;
    } catch (err) {
      console.error('Delete track error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete track');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Avoid spamming admin endpoints (and avoid console noise) when not on the admin music tab.
      setLoading(false);
      return;
    }
    loadTracks();
  }, [enabled, loadTracks]);

  return {
    tracks,
    loading,
    error,
    loadTracks,
    deleteTrack
  };
}

