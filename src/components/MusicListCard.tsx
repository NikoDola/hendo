'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause, ChevronRight, ChevronDown, Star } from 'lucide-react';
import Image from 'next/image';
import { MusicTrack } from '@/lib/music';
import { useCart } from '@/context/CartContext';
import { getMediaElementSource } from '@/lib/audioContext';
import './MusicListCard.css';

interface MusicListCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  onPlayPause: (track: MusicTrack) => void;
  onPurchase: (track: MusicTrack) => void;
  isPurchased?: boolean;
}

export default function MusicListCard({
  track,
  isPlaying,
  onPlayPause,
  onPurchase,
  isPurchased = false
}: MusicListCardProps) {
  const { addToCart, removeFromCart, toggleFavorite, isInCart, isFavorite } = useCart();
  const [audio] = useState(() => {
    // Only create Audio in browser environment
    if (typeof window === 'undefined') return null;
    const audioEl = new Audio();
    audioEl.loop = false;
    audioEl.volume = 1;
    audioEl.preload = 'none';
    return audioEl;
  });

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHashtags, setShowHashtags] = useState(false);
  const animationRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const seekProgressRef = useRef(0);
  const initialTouchX = useRef(0);
  const initialTouchY = useRef(0);
  const touchDirectionDetermined = useRef(false);

  // Connect this card's audio to the shared AudioContext when playback starts.
  // We reuse a single analyser per card and never create a new AudioContext,
  // so memory stays bounded no matter how many tracks the user plays.
  useEffect(() => {
    if (!audio || !isPlaying || !audio.src || audio.paused) return;

    let cancelled = false;

    const initAudioAnalysis = async () => {
      try {
        if (!audio.crossOrigin) {
          audio.crossOrigin = 'anonymous';
        }

        const result = getMediaElementSource(audio);
        if (!result || cancelled) return;

        const { context, source } = result;
        if (context.state === 'suspended') {
          await context.resume();
        }
        if (cancelled) return;

        if (!analyserRef.current) {
          const analyserNode = context.createAnalyser();
          analyserNode.fftSize = 256;
          analyserNode.smoothingTimeConstant = 0.8;

          source.connect(analyserNode);
          analyserNode.connect(context.destination);
          analyserRef.current = analyserNode;
        }

        setAnalyser(analyserRef.current);
      } catch (error) {
        console.error('AudioContext initialization failed:', error);
      }
    };

    const timer = setTimeout(() => {
      initAudioAnalysis();
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isPlaying, audio]);

  // Audio analysis for visualizations
  useEffect(() => {
    if (!analyser || !isPlaying) return;

    const freqArray = new Uint8Array(analyser.frequencyBinCount);

    // Throttle the React state updates to ~12/sec. At 60fps each update
    // re-renders the card and repaints the animated glow + image brightness
    // filter, which pins the GPU and overheats phones. 12/sec looks identical
    // for a background visualizer but does ~5x less work.
    const UPDATE_INTERVAL = 80;
    let lastUpdate = 0;

    const analyzeAudio = (now: number) => {
      animationRef.current = requestAnimationFrame(analyzeAudio);
      if (now - lastUpdate < UPDATE_INTERVAL) return;
      lastUpdate = now;

      analyser.getByteFrequencyData(freqArray);

      const bassEnd = Math.floor(freqArray.length * 0.15);
      const midEnd = Math.floor(freqArray.length * 0.5);

      const bassSum = freqArray.slice(0, bassEnd).reduce((a, b) => a + b, 0);
      const midSum = freqArray.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0);
      const trebleSum = freqArray.slice(midEnd).reduce((a, b) => a + b, 0);

      const bass = bassSum / bassEnd / 255;
      const mid = midSum / (midEnd - bassEnd) / 255;
      const treble = trebleSum / (freqArray.length - midEnd) / 255;

      setBassIntensity(bass);
      setMidIntensity(mid);
      setTrebleIntensity(treble);

      const beat = bass > 0.7 || mid > 0.6;
      setBeatDetected(beat);
    };

    animationRef.current = requestAnimationFrame(analyzeAudio);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  // Audio progress tracking
  useEffect(() => {
    if (!audio || !isPlaying || isDragging) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, [audio, isPlaying, isDragging]);

  // Handle play/pause
  useEffect(() => {
    if (!audio) return;

    if (isPlaying) {
      if (audio.src !== track.audioFileUrl) {
        audio.src = track.audioFileUrl;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Playback failed:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, track.audioFileUrl, audio]);

  // Cleanup. We intentionally do NOT close the AudioContext here — it is shared
  // across the whole app (see lib/audioContext). We just release this element.
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    };
  }, [audio]);

  const handleSeek = (clientX: number) => {
    if (!audio || !audio.duration || !progressBarRef.current) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const seekX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const seekPercent = (seekX / rect.width) * 100;
    seekProgressRef.current = (seekPercent / 100) * audio.duration; // Store the seek time
    setProgress(seekPercent); // Update visual progress immediately
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (audio) {
      audio.currentTime = seekProgressRef.current;
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      initialTouchX.current = e.touches[0].clientX;
      initialTouchY.current = e.touches[0].clientY;
      touchDirectionDetermined.current = false;
      // Immediately seek to touch position (works for tap)
      handleSeek(e.touches[0].clientX);
      // Set dragging state optimistically - we'll cancel if vertical movement detected
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const deltaX = Math.abs(touchX - initialTouchX.current);
      const deltaY = Math.abs(touchY - initialTouchY.current);

      const MIN_DRAG_DISTANCE = 5; // Lower threshold for faster detection

      // Determine direction on first significant movement
      if (!touchDirectionDetermined.current && (deltaX > MIN_DRAG_DISTANCE || deltaY > MIN_DRAG_DISTANCE)) {
        touchDirectionDetermined.current = true;

        if (deltaX > deltaY) {
          // Horizontal drag - keep seeking enabled
          handleSeek(touchX);
          if (e.cancelable) {
            e.preventDefault();
          }
        } else {
          // Vertical movement detected - cancel dragging to allow scrolling
          setIsDragging(false);
          // Don't prevent default - allow scrolling
        }
      } else if (touchDirectionDetermined.current) {
        if (isDragging) {
          // Continue horizontal drag
          handleSeek(touchX);
          if (e.cancelable) {
            e.preventDefault();
          }
        }
        // If not dragging (vertical), allow default scrolling behavior
      } else {
        // Small movement, still seeking to follow touch
        handleSeek(touchX);
      }
    }
  };

  const handleTouchEnd = () => {
    // Always update audio position if we were dragging
    if (audio && isDragging) {
      audio.currentTime = seekProgressRef.current;
    }
    setIsDragging(false);
    touchDirectionDetermined.current = false;
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, audio]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const glowIntensity = (bassIntensity + midIntensity + trebleIntensity) / 3;

  return (
    <div className={`musicListCard ${isPlaying ? 'musicListCardPlaying' : ''}`}>
      <div className="musicListCardThemeRing" aria-hidden="true" />
      {/* Top Section: Image + Info (Horizontal) */}
      <div className="musicListCardTop">
        {/* Album Cover */}
        <div className="musicListCardImageContainer">
          <Image
            src={track.imageFileUrl || '/images/hendo/4.png'}
            alt={track.title}
            width={360}
            height={360}
            sizes="(max-width: 768px) 100vw, 180px"
            className="musicListCardImage"
            style={{
              filter: isPlaying ? `brightness(${1 + glowIntensity * 0.3})` : 'brightness(1)',
              transform: beatDetected ? 'scale(1.02)' : 'scale(1)',
            }}
          />
          {isPlaying && (
            <div
              className="musicListCardGlow"
              style={{
                opacity: glowIntensity * 0.6,
              }}
            />
          )}
        </div>

        {/* Track Info */}
        <div className="musicListCardInfo">
          <div className="musicListCardHeader">
            <h3 className="musicListCardTitle">{track.title}</h3>
            <p className="musicListCardArtist">{track.genre}</p>
          </div>

          <div className="musicListCardDetails">
          </div>

          {track.description && (
            <p className="musicListCardDescription">{track.description}</p>
          )}

          {/* Hashtags */}
          <div className="musicListCardHashtagsSection">
            <button
              className="musicListCardHashtagsToggle"
              onClick={() => setShowHashtags(!showHashtags)}
            >
              {showHashtags ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>{track.hashtags.length} tags</span>
            </button>
            {showHashtags && (
              <div className="musicListCardHashtags">
                {track.hashtags.map((tag, index) => (
                  <span key={index} className="musicListCardHashtag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Purchase Button */}
        <div className="musicListCardActions">
          <button
            className={`musicListCardPurchaseBtn ${isPurchased ? 'purchased' : ''}`}
            onClick={() => onPurchase(track)}
            disabled={isPurchased}
          >
            <ShoppingCart size={20} />
            {isPurchased ? 'Purchased' : `$${track.price.toFixed(2)}`}
          </button>
          <div className="musicListCardIconActions">
            <button
              onClick={() => {
                if (isPurchased) return;
                if (isInCart(track.id)) {
                  removeFromCart(track.id);
                  return;
                }
                addToCart({
                  id: track.id,
                  title: track.title,
                  price: track.price,
                  imageFileUrl: track.imageFileUrl
                });
              }}
              className={`musicListCardIconButton ${isInCart(track.id) ? 'active' : ''} ${isPurchased ? 'disabled' : ''}`}
              aria-label="Add to cart"
              disabled={isPurchased}
            >
              <ShoppingCart size={20} />
            </button>
            <button
              onClick={() =>
                toggleFavorite(track.id, {
                  id: track.id,
                  title: track.title,
                  price: track.price,
                  imageFileUrl: track.imageFileUrl
                })
              }
              className={`musicListCardIconButton favorite ${isFavorite(track.id) ? 'active' : ''}`}
              aria-label="Add to favorites"
            >
              <Star size={20} fill={isFavorite(track.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Music Player */}
      <div className="musicListCardPlayer">
        <button
          className="musicListCardPlayButton"
          onClick={() => onPlayPause(track)}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <div className="musicListCardProgressContainer">
          <div
            className="musicListCardProgressBar"
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              className="musicListCardProgressFill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="musicListCardProgressGlow"
              style={{
                width: `${progress}%`,
                opacity: isPlaying ? glowIntensity * 0.8 : 0,
              }}
            />
          </div>
          <div className="musicListCardProgressTime">
            <span>{audio?.currentTime ? formatDuration(audio.currentTime) : '0:00'}</span>
            <span>{audio?.duration ? formatDuration(audio.duration) : '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
