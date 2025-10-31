'use client';

import { useState, useEffect } from 'react';
import { MusicTrack } from '@/lib/music';
import { Play, Pause, ShoppingCart, Download } from 'lucide-react';

export default function MusicStore() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadTracks();
  }, []);

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

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrack === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setPlayingTrack(null);
    } else {
      // Stop current track and play new one
      if (audioElement) {
        audioElement.pause();
      }
      
      const audio = new Audio(track.audioFileUrl);
      audio.play();
      setAudioElement(audio);
      setPlayingTrack(track.id);
      
      audio.onended = () => {
        setPlayingTrack(null);
        setAudioElement(null);
      };
    }
  };

  const handlePurchase = async (track: MusicTrack) => {
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
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout process');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <h1 className="text-2xl font-bold text-gray-800">Music Store</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{track.title}</h3>
                <p className="text-gray-600 mb-4">{track.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {track.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(track.price)}
                  </span>
                  <button
                    onClick={() => handlePlayPause(track)}
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title={playingTrack === track.id ? 'Pause' : 'Play'}
                  >
                    {playingTrack === track.id ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                </div>

                <button
                  onClick={() => handlePurchase(track)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart size={20} />
                  Purchase Track
                </button>
              </div>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12">
            <Music className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Music Available</h3>
            <p className="text-gray-600">Check back later for new tracks!</p>
          </div>
        )}
      </main>
    </div>
  );
}
