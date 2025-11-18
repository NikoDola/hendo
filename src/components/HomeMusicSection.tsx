'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/context/UserAuthContext';
import MusicCard from '@/components/MusicCard';
import type { MusicTrack } from '@/lib/music';
import './HomeMusicSection.css';

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
}

interface MusicTrackResponse {
  id: string;
  title: string;
  artist: string;
  price: number;
  duration: string;
  releaseDate: string;
  coverUrl: string;
  previewUrl: string;
  fullTrackUrl: string;
  genres: string[];
  mood: string;
  bpm: number;
  key: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HomeMusicSection() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { user, loading: authLoading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      loadPurchases();
    }
  }, [user, authLoading]);

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/music/home');
      if (response.ok) {
        const data = await response.json();
        // Convert date strings to Date objects to match MusicTrack type
        const tracksWithDates = data.tracks.map((track: MusicTrackResponse) => ({
          ...track,
          createdAt: new Date(track.createdAt),
          updatedAt: new Date(track.updatedAt)
        }));
        setTracks(tracksWithDates);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await fetch('/api/user/purchases');
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    }
  };

  const isTrackPurchased = (trackId: string): boolean => {
    return purchases.some(p => p.trackId === trackId);
  };

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrack === track.id) {
      setPlayingTrack(null);
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setPlayingTrack(track.id);
    }
  };

  const handlePurchase = async (track: MusicTrack) => {
    if (!user) {
      const confirmLogin = confirm('You need to be logged in to purchase music. Would you like to go to the login page?');
      if (confirmLogin) {
        router.push('/login');
      }
      return;
    }

    if (isTrackPurchased(track.id)) {
      alert(`You already own "${track.title}". Check your dashboard to download it.`);
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicTrackId: track.id,
          musicTitle: track.title,
          price: track.price
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to get checkout URL');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to start checkout process. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  if (isLoading) {
    return null;
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="homeMusicSection">
      <header className="homeMusicHeader">
        <div className="homeMusicHeaderContent">
      
          <h2 className="homeMusicHeaderTitle">Featured BITS</h2>
        </div>
      </header>

      <main className="homeMusicMain">
        <div className="homeMusicList">
          {tracks.slice(0, 3).map((track) => (
            <MusicCard
              key={track.id}
              track={track}
              isPlaying={playingTrack === track.id}
              onPlayPause={handlePlayPause}
              onPurchase={handlePurchase}
              isPurchased={isTrackPurchased(track.id)}
              variant="home"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

