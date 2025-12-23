'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause, ChevronRight, ChevronDown, Star } from 'lucide-react';
import Image from 'next/image';
import { MusicTrack } from '@/lib/music';
import { useCart } from '@/context/CartContext';
import './MusicCard.css';

interface MusicCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  onPlayPause: (track: MusicTrack) => void;
  onPurchase: (track: MusicTrack) => void;
  isPurchased?: boolean;
  variant?: 'default' | 'home';
}

export default function MusicCard({
  track,
  isPlaying,
  onPlayPause,
  onPurchase,
  isPurchased = false,
  variant = 'default'
}: MusicCardProps) {
  const { addToCart, toggleFavorite, isInCart, isFavorite } = useCart();

  const [audio] = useState<HTMLAudioElement | null>(() => {
    if (typeof window === 'undefined') return null;
    const el = new Audio();
    el.loop = false;
    el.volume = 1;
    el.preload = 'none';
    return el;
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);

  const [progress, setProgress] = useState(0);
  const [showHashtags, setShowHashtags] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const animationRef = useRef<number | null>(null);
  useEffect(() => {
    if (!audio || !isPlaying || !audio.src || audio.paused) return;

    const initAudioAnalysis = async () => {
      if (audio.dataset.audioConnected === 'true') return;

      try {
        audio.crossOrigin = 'anonymous';

        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        const context = new Ctx();
        if (context.state === 'suspended') await context.resume();

        const source = context.createMediaElementSource(audio);
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        source.connect(analyserNode);
        analyserNode.connect(context.destination);

        audio.dataset.audioConnected = 'true';
        setAudioContext(context);
        setAnalyser(analyserNode);
      } catch (err) {
        console.error(err);
      }
    };

    const t = setTimeout(initAudioAnalysis, 100);
    return () => clearTimeout(t);
  }, [audio, isPlaying]);

useEffect(() => {
  if (!analyser || !isPlaying) {
    return undefined;
  }

  const analyze = () => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
    const mid = data.slice(8, 32).reduce((a, b) => a + b, 0) / 24;
    const treble = data.slice(32, 64).reduce((a, b) => a + b, 0) / 32;

    setBassIntensity(bass);
    setMidIntensity(mid);
    setTrebleIntensity(treble);

    if (bass > 50 && !beatDetected) {
      setBeatDetected(true);
      setTimeout(() => setBeatDetected(false), 200);
    }

    animationRef.current = requestAnimationFrame(analyze);
  };

  analyze();

  return () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, [analyser, isPlaying, beatDetected]);


  useEffect(() => {
    if (!audio || !isPlaying) return;

    const update = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', update);
    return () => audio.removeEventListener('timeupdate', update);
  }, [audio, isPlaying]);
  useEffect(() => {
    if (!audio) return;

    if (isPlaying) {
      if (audio.src !== track.audioFileUrl) {
        audio.src = track.audioFileUrl;
        audio.load();
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
      setBassIntensity(0);
      setMidIntensity(0);
      setTrebleIntensity(0);
      setBeatDetected(false);
    }
  }, [isPlaying, audio, track.audioFileUrl]);

  const updateProgressFromPointer = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!audio || !audio.duration) return;

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(Math.max(x / rect.width, 0), 1);

    audio.currentTime = ratio * audio.duration;
    setProgress(ratio * 100);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);

  useEffect(() => {
    return () => {
      audio?.pause();
      audio && (audio.src = '');
      audioContext?.close();
    };
  }, [audio, audioContext]);
  return (
    <div className={`musicCard ${isPlaying ? 'musicCardPlaying' : ''} ${variant === 'home' ? 'musicCardHome' : ''}`}>
      <div className="musicCardTop">
        <div className="musicCardImageContainer">
          {track.imageFileUrl ? (
            <Image src={track.imageFileUrl} alt={track.title} width={120} height={120} className="musicCardImage" />
          ) : (
            <div className="musicCardImagePlaceholder">
              <span className="musicCardImagePlaceholderIcon">♪</span>
            </div>
          )}
        </div>

        <div className="musicCardInfo">
          <h3 className="musicCardTitle">{track.title}</h3>
          <p className="musicCardDescription">{track.description}</p>

          {track.hashtags.length > 0 && (
            <>
              <button onClick={() => setShowHashtags(!showHashtags)} className="musicCardHashtagsToggle">
                {showHashtags ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>{showHashtags ? 'Hide Hashtags' : `View Hashtags (${track.hashtags.length})`}</span>
              </button>

              {showHashtags && (
                <div className="musicCardTags">
                  {track.hashtags.map((t, i) => (
                    <span key={i} className="musicCardTag">#{t}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="musicCardPurchaseSection">
          <span className="musicCardPrice">{formatPrice(track.price)}</span>

          <div className="userActionWrapper">
            <button
              onClick={() => !isPurchased && onPurchase(track)}
              disabled={isPurchased}
              className="musicCardPurchaseButton"
            >
              <ShoppingCart size={20} />
              {isPurchased ? 'Purchased' : 'Purchase'}
            </button>

            <div className="musicCardIconActions">
              <button
                onClick={() => addToCart({ id: track.id, title: track.title, price: track.price, imageFileUrl: track.imageFileUrl })}
                className={`musicCardIconButton ${isInCart(track.id) ? 'active' : ''}`}
              >
                <ShoppingCart size={20} />
              </button>

              <button
                onClick={() => toggleFavorite(track.id, track)}
                className={`musicCardIconButton ${isFavorite(track.id) ? 'active' : ''}`}
              >
                <Star size={20} fill={isFavorite(track.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="musicCardPlayer">
        <div className="musicCardPlayerControls">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause(track);
            }}
            className={`musicCardPlayButton ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div
            className="musicCardProgressBar"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
              updateProgressFromPointer(e);
            }}
            onPointerMove={(e) => {
              if (!isDragging) return;
              updateProgressFromPointer(e);
            }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          >
            <div className="musicCardProgressFill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
