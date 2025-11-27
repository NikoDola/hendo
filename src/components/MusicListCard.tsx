'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause, ChevronRight, ChevronDown, Star } from 'lucide-react';
import Image from 'next/image';
import { MusicTrack } from '@/lib/music';
import { useCart } from '@/context/CartContext';
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
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useCart();
  const [audio] = useState(() => {
    // Only create Audio in browser environment
    if (typeof window === 'undefined') return null;
    const audioEl = new Audio();
    audioEl.loop = false;
    audioEl.volume = 1;
    audioEl.preload = 'none';
    return audioEl;
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHashtags, setShowHashtags] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Initialize AudioContext and analyser when playing starts
  useEffect(() => {
    if (!audio || !isPlaying || !audio.src || audio.paused) return;

    const initAudioAnalysis = async () => {
      try {
        if (audio.dataset.audioConnected === 'true') {
          return;
        }

        if (!audio.crossOrigin) {
          audio.crossOrigin = 'anonymous';
        }

        const AudioContextCtor: typeof AudioContext =
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
        const context = new AudioContextCtor();

        if (context.state === 'suspended') {
          await context.resume();
        }

        const source = context.createMediaElementSource(audio);
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        source.connect(analyserNode);
        analyserNode.connect(context.destination);

        audio.dataset.audioConnected = 'true';
        setAudioContext(context);
        setAnalyser(analyserNode);
      } catch (error) {
        console.error('AudioContext initialization failed:', error);
      }
    };

    const timer = setTimeout(() => {
      initAudioAnalysis();
    }, 100);

    return () => clearTimeout(timer);
  }, [isPlaying, audio]);

  // Audio analysis for visualizations
  useEffect(() => {
    if (!analyser || !isPlaying) return;

    const analyzeAudio = () => {
      const freqArray = new Uint8Array(analyser.frequencyBinCount);
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

      animationRef.current = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  // Audio progress tracking
  useEffect(() => {
    if (!audio) return;
    
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, [audio]);

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

  // Cleanup
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audio, audioContext]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const glowIntensity = (bassIntensity + midIntensity + trebleIntensity) / 3;

  return (
    <div className={`musicListCard ${isPlaying ? 'musicListCardPlaying' : ''}`}>
      {/* Top Section: Image + Info (Horizontal) */}
      <div className="musicListCardTop">
        {/* Album Cover */}
        <div className="musicListCardImageContainer">
          <Image
            src={track.imageFileUrl || '/images/hendo/4.png'}
            alt={track.title}
            width={150}
            height={150}
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
                boxShadow: `0 0 ${30 + glowIntensity * 50}px var(--theme-color)`,
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
              onClick={() => addToCart({
                id: track.id,
                title: track.title,
                price: track.price,
                imageFileUrl: track.imageFileUrl
              })}
              className={`musicListCardIconButton ${isInCart(track.id) ? 'active' : ''}`}
              aria-label="Add to cart"
            >
              <ShoppingCart size={20} />
            </button>
            <button
              onClick={() => toggleFavorite(track.id, {
                id: track.id,
                title: track.title,
                price: track.price,
                imageFileUrl: track.imageFileUrl
              })}
              className={`musicListCardIconButton ${isFavorite(track.id) ? 'active' : ''}`}
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
          <div className="musicListCardProgressBar">
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

