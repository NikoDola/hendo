'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/context/UserAuthContext';
import MusicCard from '@/components/MusicCard';
import type { MusicTrack } from '@/lib/music';
import '@/components/HomeMusicSection.css';

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
}

export default function HomeMusicClientFetcher() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useUserAuth();
  const router = useRouter();

  // Fetch featured tracks via API (uses client-side Firebase SDK)
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch('/api/music/home');
        if (response.ok) {
          const data = await response.json();
          // Take only first 3 tracks for home page
          setTracks((data.tracks || []).slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to load featured tracks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      loadPurchases();
    }
  }, [user, authLoading]);

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

  // Loading skeleton
  if (loading) {
    return (
      <div className="homeMusicSection">
        <header className="homeMusicHeader">
          <div className="homeMusicHeaderContent">
            <h2 className="homeMusicHeaderTitle">Featured BITS</h2>
          </div>
        </header>
        <main className="homeMusicMain">
          <div className="homeMusicList">
            {[1, 2, 3].map((i) => (
              <div key={i} className="homeMusicSkeleton" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // No tracks found
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
          {tracks.map((track) => (
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
