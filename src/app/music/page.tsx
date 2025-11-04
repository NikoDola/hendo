'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MusicTrack } from '@/lib/music';
import { Music } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import MusicCard from '@/components/MusicCard';
import PurchaseWarningPopup from '@/components/PurchaseWarningPopup';
import '@/components/pages/MusicStore.css';

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
}

export default function MusicStore() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [warningPopup, setWarningPopup] = useState<{ isOpen: boolean; trackTitle: string }>({
    isOpen: false,
    trackTitle: ''
  });
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
      const response = await fetch('/api/music');
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
      // Pause current track - BitPlayer will handle stopping
      setPlayingTrack(null);
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
    } else {
      // Stop current track and play new one - BitPlayer will handle starting
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setPlayingTrack(track.id);
    }
  };

  const handlePurchase = async (track: MusicTrack) => {
    // Check if user is logged in
    if (!user) {
      const confirmLogin = confirm('You need to be logged in to purchase music. Would you like to go to the login page?');
      if (confirmLogin) {
        router.push('/login');
      }
      return;
    }

    // Check if track is already purchased
    if (isTrackPurchased(track.id)) {
      setWarningPopup({
        isOpen: true,
        trackTitle: track.title
      });
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
    return (
      <div className="musicStoreLoading">
        <div className="musicStoreSpinner"></div>
      </div>
    );
  }

  return (
    <>
      <PurchaseWarningPopup
        isOpen={warningPopup.isOpen}
        onClose={() => setWarningPopup({ isOpen: false, trackTitle: '' })}
        trackTitle={warningPopup.trackTitle}
      />
      
      <div className="musicStoreContainer">
        <header className="musicStoreHeader">
          <div className="musicStoreHeaderContent">
            <Music className="musicStoreHeaderIcon" size={40} />
            <h1 className="musicStoreHeaderTitle">Music Store</h1>
          </div>
        </header>

        <main className="musicStoreMain">
          <div className="musicStoreGrid">
            {tracks.map((track) => (
              <MusicCard
                key={track.id}
                track={track}
                isPlaying={playingTrack === track.id}
                onPlayPause={handlePlayPause}
                onPurchase={handlePurchase}
                isPurchased={isTrackPurchased(track.id)}
              />
            ))}
          </div>

          {tracks.length === 0 && (
            <div className="musicStoreEmpty">
              <Music className="musicStoreEmptyIcon" size={64} />
              <h3 className="musicStoreEmptyTitle">No Music Available</h3>
              <p className="musicStoreEmptyText">Check back later for new tracks!</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
