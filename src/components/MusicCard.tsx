'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause, ChevronRight, ChevronDown, Star } from 'lucide-react';
import Image from 'next/image';
import { MusicTrack } from '@/lib/music';
import { useCart } from '@/context/CartContext';
import './MusicCard.css';
import Router from 'next/router';

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

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
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


  useEffect(() => {
    // Initialize AudioContext and analyser when playing starts
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

      const bassFreqs = Array.from(freqArray.slice(0, 8));
      const midFreqs = Array.from(freqArray.slice(8, 32));
      const trebleFreqs = Array.from(freqArray.slice(32, 64));

      const bassAverage = bassFreqs.reduce((sum, value) => sum + value, 0) / bassFreqs.length;
      const midAverage = midFreqs.reduce((sum, value) => sum + value, 0) / midFreqs.length;
      const trebleAverage = trebleFreqs.reduce((sum, value) => sum + value, 0) / trebleFreqs.length;

      setBassIntensity(bassAverage);
      setMidIntensity(midAverage);
      setTrebleIntensity(trebleAverage);

      if (bassAverage > 50 && !beatDetected) {
        setBeatDetected(true);
        setTimeout(() => setBeatDetected(false), 200);
      }

      animationRef.current = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying, beatDetected]);

  // Update progress
  useEffect(() => {
    if (!audio || !isPlaying || isDragging) return;

    const updateProgress = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
      }
    };

    const interval = setInterval(updateProgress, 100);
    audio.addEventListener('timeupdate', updateProgress);

    return () => {
      clearInterval(interval);
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [isPlaying, audio, isDragging]);

  // Sync audio playback with isPlaying prop
  useEffect(() => {
    if (!audio) return;

    const playAudio = async () => {
      if (isPlaying) {
        try {
          if (audio.src !== track.audioFileUrl) {
            audio.src = track.audioFileUrl;
            audio.load();

            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
              }, 10000);

              const cleanup = () => {
                clearTimeout(timeout);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('loadedmetadata', handleMetadata);
                audio.removeEventListener('error', handleError);
              };

              const handleMetadata = () => {
                if (audio.readyState >= 2) {
                  cleanup();
                  resolve(void 0);
                }
              };

              const handleCanPlay = () => {
                cleanup();
                resolve(void 0);
              };

              const handleError = () => {
                cleanup();
                const error = audio.error;
                reject(new Error(`Audio load failed: ${error?.message || 'Unknown error'}`));
              };

              audio.addEventListener('canplay', handleCanPlay, { once: true });
              audio.addEventListener('loadedmetadata', handleMetadata, { once: true });
              audio.addEventListener('error', handleError, { once: true });
            });
          }

          audio.volume = 1;
          audio.muted = false;

          const playPromise = audio.play();

          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          console.error('Error playing audio:', error);

          try {
            audio.play().catch((e) => {
              console.error('Direct play also failed:', e);
            });
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
      } else {
        audio.pause();
        setBassIntensity(0);
        setMidIntensity(0);
        setTrebleIntensity(0);
        setBeatDetected(false);
      }
    };

    playAudio();
  }, [isPlaying, audio, track.audioFileUrl]);

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
  }, [isDragging, audio, analyser]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

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

  return (
    <div className={`musicCard ${isPlaying ? 'musicCardPlaying' : ''} ${variant === 'home' ? 'musicCardHome' : ''}`}>
      <div className="musicCardTop">
        <div className="musicCardImageContainer">
          {track.imageFileUrl ? (
            <Image
              src={track.imageFileUrl}
              alt={track.title}
              width={600}
              height={600}

              className="musicCardImage"
            />
          ) : (
            <div className="musicCardImagePlaceholder">
              <span className="musicCardImagePlaceholderIcon">♪</span>
            </div>
          )}
        </div>

        {/* Title, Description, Hashtags */}
        <div className="musicCardInfo">
          <h3 className="musicCardTitle">{track.title}</h3>
          <p className="musicCardDescription">{track.description}</p>

          {/* Hashtags Toggle */}
          {track.hashtags.length > 0 && (
            <>
              <button
                onClick={() => setShowHashtags(!showHashtags)}
                className="musicCardHashtagsToggle"
              >
                {showHashtags ? (
                  <>
                    <ChevronDown size={16} />
                    <span>Hide Hashtags</span>
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} />
                    <span>View Hashtags ({track.hashtags.length})</span>
                  </>
                )}
              </button>
              {showHashtags && (
                <div className="musicCardTags">
                  {track.hashtags.map((tag, index) => (
                    <span key={index} className="musicCardTag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Price and Purchase section */}
        <div className="musicCardPurchaseSection">
          <span className="musicCardPrice">{formatPrice(track.price)}</span>
          <div className="musicCardActionsWrapper">
            <div className='userActionWrapper'>
              <button
                onClick={() => !isPurchased && onPurchase(track)}
                className={`musicCardPurchaseButton ${isPurchased ? 'musicCardPurchaseButtonPurchased' : ''}`}
                disabled={isPurchased}
              >
                <ShoppingCart size={20} />
                {isPurchased ? 'Purchased' : 'Purchase'}
              </button>

              <div className="musicCardIconActions">
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
                  className={`musicCardIconButton ${isInCart(track.id) ? 'active' : ''} ${isPurchased ? 'disabled' : ''}`}
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
                  className={`musicCardIconButton favorite ${isFavorite(track.id) ? 'active' : ''}`}
                  aria-label="Add to favorites"
                >
                  <Star size={20} className="musicCardFavoriteIcon" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Music Player Controls - Full Width Below */}
      <div className="musicCardPlayer">
        {/* Bouncing particles for visualization */}
        <div
          className={`musicCardParticle musicCardParticle1 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + bassIntensity / 80}) translate(${bassIntensity / 20}px, ${bassIntensity / 25}px)`,
            opacity: 0.3 + bassIntensity / 150,
          }}
        />
        <div
          className={`musicCardParticle musicCardParticle2 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + midIntensity / 60}) translate(${-midIntensity / 20}px, ${midIntensity / 30}px)`,
            opacity: 0.2 + midIntensity / 120,
          }}
        />
        <div
          className={`musicCardParticle musicCardParticle3 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + trebleIntensity / 50}) translate(${trebleIntensity / 15}px, ${-trebleIntensity / 20}px)`,
            opacity: 0.4 + trebleIntensity / 180,
          }}
        />

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
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              className="musicCardProgressFill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


