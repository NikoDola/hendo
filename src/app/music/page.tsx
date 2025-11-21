'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MusicTrack } from '@/lib/music';
import { Music } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import MusicListCard from '@/components/MusicListCard';
import SkeletonMusicCard from '@/components/SkeletonMusicCard';
import MusicFilterBar, { FilterOptions } from '@/components/MusicFilterBar';
import PurchaseWarningPopup from '@/components/PurchaseWarningPopup';
import '@/components/pages/MusicStore.css';

interface Purchase {
  id: string;
  trackId: string;
  trackTitle: string;
}

const ITEMS_PER_PAGE = 5;

export default function MusicStore() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [warningPopup, setWarningPopup] = useState<{ isOpen: boolean; trackTitle: string }>({
    isOpen: false,
    trackTitle: ''
  });
  const [filters, setFilters] = useState<FilterOptions>({
    genre: '',
    priceOrder: 'none',
    dateOrder: 'newest',
    searchQuery: ''
  });
  const { user, loading: authLoading } = useUserAuth();
  const router = useRouter();
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      loadPurchases();
    }
  }, [user, authLoading]);

  // Get available genres from tracks
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    tracks.forEach(track => {
      if (track.genre) {
        genres.add(track.genre);
      }
    });
    return Array.from(genres).sort();
  }, [tracks]);

  // Filter and sort tracks
  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];

    // Filter by search query (title, description, or hashtags)
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      result = result.filter(track => {
        const titleMatch = track.title.toLowerCase().includes(searchLower);
        const descriptionMatch = track.description.toLowerCase().includes(searchLower);
        const hashtagMatch = track.hashtags.some(tag => tag.toLowerCase().includes(searchLower));
        return titleMatch || descriptionMatch || hashtagMatch;
      });
    }

    // Filter by genre
    if (filters.genre) {
      result = result.filter(track => track.genre === filters.genre);
    }

    // Apply sorting - price takes priority over date if specified
    if (filters.priceOrder !== 'none') {
      // Sort by price
      if (filters.priceOrder === 'low-high') {
        result.sort((a, b) => a.price - b.price);
      } else if (filters.priceOrder === 'high-low') {
        result.sort((a, b) => b.price - a.price);
      }
    } else {
      // Sort by date only if price sorting is not active
      if (filters.dateOrder === 'newest') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (filters.dateOrder === 'oldest') {
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }

    return result;
  }, [tracks, filters]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [filters]);

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (displayedCount >= filteredAndSortedTracks.length) return;

    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredAndSortedTracks.length));
      setIsLoadingMore(false);
    }, 500);
  }, [displayedCount, filteredAndSortedTracks.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedCount < filteredAndSortedTracks.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, isLoadingMore, displayedCount, filteredAndSortedTracks.length]);

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
      <div className="musicStoreContainer">
        <header className="musicStoreHeader">
          <div className="musicStoreHeaderContent">
            <Music className="musicStoreHeaderIcon" size={40} />
            <h1 className="musicStoreHeaderTitle">Music Store</h1>
          </div>
        </header>

        <main className="musicStoreMain">
          <div className="musicStoreList">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <SkeletonMusicCard key={index} />
            ))}
          </div>
        </main>
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

      <section className="section-regular">
        <header className="musicStoreHeader">
          <div className="musicStoreHeaderContent">
            <Music className="musicStoreHeaderIcon" size={40} />
            <h1 className="musicStoreHeaderTitle">Music Store</h1>
          </div>
        </header>

        <div>
          {/* Filter Bar */}
          <MusicFilterBar
            filters={filters}
            availableGenres={availableGenres}
            onFilterChange={setFilters}
          />

          <div className="musicStoreList">
            {filteredAndSortedTracks.slice(0, displayedCount).map((track) => (
              <MusicListCard
                key={track.id}
                track={track}
                isPlaying={playingTrack === track.id}
                onPlayPause={handlePlayPause}
                onPurchase={handlePurchase}
                isPurchased={isTrackPurchased(track.id)}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {displayedCount < filteredAndSortedTracks.length && (
            <div ref={observerTarget} className="musicStoreLoadingMore">
              {isLoadingMore && (
                <>
                  {Array.from({ length: Math.min(ITEMS_PER_PAGE, filteredAndSortedTracks.length - displayedCount) }).map((_, index) => (
                    <SkeletonMusicCard key={`skeleton-${index}`} />
                  ))}
                </>
              )}
            </div>
          )}

          {filteredAndSortedTracks.length === 0 && !isLoading && tracks.length > 0 && (
            <div className="musicStoreEmpty">
              <Music className="musicStoreEmptyIcon" size={64} />
              <h3 className="musicStoreEmptyTitle">No Tracks Found</h3>
              <p className="musicStoreEmptyText">Try adjusting your filters!</p>
            </div>
          )}

          {tracks.length === 0 && !isLoading && (
            <div className="musicStoreEmpty">
              <Music className="musicStoreEmptyIcon" size={64} />
              <h3 className="musicStoreEmptyTitle">No Music Available</h3>
              <p className="musicStoreEmptyText">Check back later for new tracks!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
