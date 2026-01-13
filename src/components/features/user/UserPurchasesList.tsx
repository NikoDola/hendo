
'use client';

import { Download, Music, Pause, Play } from 'lucide-react';
import type { Purchase } from '@/hooks/usePurchases';
import './UserPurchasesList.css';
import { useEffect, useRef, useState } from 'react';

interface UserPurchasesListProps {
  purchases: Purchase[];
  loading: boolean;
  onRefresh: () => void;
  onDownload: (purchaseId: string, type: 'zip' | 'pdf', filename: string) => void;
}

export default function UserPurchasesList({
  purchases,
  loading,
  onRefresh,
  onDownload
}: UserPurchasesListProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const activePurchaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    audioRef.current.loop = false;

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      const id = activePurchaseIdRef.current;
      if (!id) return;
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      setProgressById((prev) => ({
        ...prev,
        [id]: (audio.currentTime / audio.duration) * 100,
      }));
    };

    const onEnded = () => {
      const id = activePurchaseIdRef.current;
      if (!id) return;
      setProgressById((prev) => ({ ...prev, [id]: 0 }));
      setIsPlaying(false);
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
    activePurchaseIdRef.current = activePurchaseId;
  }, [activePurchaseId]);

  const togglePlay = async (purchase: Purchase) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!purchase.audioFileUrl) return;

    try {
      // Same track loaded: toggle pause/resume without resetting currentTime.
      if (activePurchaseId === purchase.id) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
        }
        return;
      }

      // Switching to a different track: stop current and start from beginning.
      audio.pause();

      // Reset previous progress display
      if (activePurchaseId) {
        setProgressById((prev) => ({ ...prev, [activePurchaseId]: 0 }));
      }

      audio.src = purchase.audioFileUrl;
      audio.currentTime = 0;
      await audio.play();
      setActivePurchaseId(purchase.id);
      setIsPlaying(true);
    } catch (e) {
      console.error('Dashboard playback failed:', e);
    }
  };

  const seek = (purchaseId: string, percent: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activePurchaseId !== purchaseId) return;
    if (!audio.duration || Number.isNaN(audio.duration)) return;
    audio.currentTime = (percent / 100) * audio.duration;
  };

  return (
    <div className="userProfileCard userPurchasesListContainer">
      <div className="userPurchasesListHeader">
        <div>
        <h2 className="userProfileTitle userPurchasesListTitle">My Purchased Tracks</h2>
        <p className='bold'>total {purchases.length} tracks </p>
        </div>

        <button
          onClick={onRefresh}
          className="userPurchasesRefreshButton"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="userPurchasesLoading">
          Loading your tracks...
        </div>
      ) : purchases.length === 0 ? (
        <div className="userPurchasesEmpty">
          <Music size={48} className="userPurchasesEmptyIcon" />
          <p>You haven&apos;t purchased any tracks yet.</p>
          <a href="/music" className="userPurchasesEmptyLink">
            Browse Music Store
          </a>
        </div>
      ) : (
        <div className="userPurchasesGrid">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="userPurchaseCard">
              <div className="userPurchaseHeader">
                <Music size={24} className="userPurchaseIcon" />
                <div className="userPurchaseInfo">
                  <h3 className="userPurchaseTitle">{purchase.trackTitle}</h3>
                  <p className="userPurchaseDate">
                    Purchased: {new Date(purchase.purchasedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick player (same UX pattern as admin music tab) */}
              <div className="userPurchasePlayer">
                <button
                  type="button"
                  className={`userPurchasePlayButton ${isPlaying && activePurchaseId === purchase.id ? 'playing' : ''}`}
                  onClick={() => togglePlay(purchase)}
                  aria-label={isPlaying && activePurchaseId === purchase.id ? 'Pause track' : 'Play track'}
                  disabled={!purchase.audioFileUrl}
                  title={!purchase.audioFileUrl ? 'Audio unavailable for this purchase' : undefined}
                >
                  {isPlaying && activePurchaseId === purchase.id ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <div
                  className="userPurchaseProgressBar"
                  onMouseDown={(e) => {
                    const target = e.currentTarget;
                    const rect = target.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const percent = (x / rect.width) * 100;
                    seek(purchase.id, percent);
                  }}
                  role="slider"
                  aria-label="Track progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progressById[purchase.id] || 0)}
                >
                  <div
                    className="userPurchaseProgressFill"
                    style={{ width: `${progressById[purchase.id] || 0}%` }}
                  />
                </div>
              </div>

              <div className="userPurchaseActions">
                <button
                  onClick={() =>
                    onDownload(
                      purchase.id,
                      'zip',
                      purchase.zipUrl?.includes('Hendo-Beats-Collection')
                        ? 'Hendo-Beats-Collection.zip'
                        : `${purchase.trackTitle}.zip`
                    )
                  }
                  className="userPurchaseButton userPurchaseButtonPrimary"
                >
                  <Download size={18} />
                  Download ZIP (Includes Rights PDFs)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

