'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause, ChevronRight, ChevronDown } from 'lucide-react';
import { MusicTrack } from '@/lib/music';
import './HorizontalMusicCard.css';

interface HorizontalMusicCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  onPlayPause: (track: MusicTrack) => void;
  onPurchase: (track: MusicTrack) => void;
  isPurchased?: boolean;
}

export default function HorizontalMusicCard({
  track,
  isPlaying,
  onPlayPause,
  onPurchase,
  isPurchased = false
}: HorizontalMusicCardProps) {
  const [audio] = useState(() => {
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
    if (!isPlaying || !audio.src || audio.paused) return;

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
    if (!isPlaying) return;

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
  }, [isPlaying, audio]);

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audio.duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = (clickX / rect.width) * 100;
    const newTime = (clickPercent / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(clickPercent);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  useEffect(() => {
    return () => {
      audio.pause();
      audio.src = '';
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audio, audioContext]);

  return (
    <div className={`horizontalMusicCard ${isPlaying ? 'horizontalMusicCardPlaying' : ''}`}>
      <div className="horizontalMusicCardTop">
        {/* Image on the left */}
        <div className="horizontalMusicCardImageContainer">
          {track.imageFileUrl ? (
            <img 
              src={track.imageFileUrl} 
              alt={track.title}
              className="horizontalMusicCardImage"
            />
          ) : (
            <div className="horizontalMusicCardImagePlaceholder">
              <span className="horizontalMusicCardImagePlaceholderIcon">♪</span>
            </div>
          )}
        </div>

        {/* Title, Description, Hashtags */}
        <div className="horizontalMusicCardInfo">
          <h3 className="horizontalMusicCardTitle">{track.title}</h3>
          <p className="horizontalMusicCardDescription">{track.description}</p>
          
          {/* Hashtags Toggle */}
          {track.hashtags.length > 0 && (
            <>
              <button
                onClick={() => setShowHashtags(!showHashtags)}
                className="horizontalMusicCardHashtagsToggle"
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
                <div className="horizontalMusicCardTags">
                  {track.hashtags.map((tag, index) => (
                    <span key={index} className="horizontalMusicCardTag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Price and Purchase section */}
        <div className="horizontalMusicCardPurchaseSection">
          <span className="horizontalMusicCardPrice">{formatPrice(track.price)}</span>
          <button
            onClick={() => !isPurchased && onPurchase(track)}
            className={`horizontalMusicCardPurchaseButton ${isPurchased ? 'horizontalMusicCardPurchaseButtonPurchased' : ''}`}
            disabled={isPurchased}
          >
            <ShoppingCart size={20} />
            {isPurchased ? 'Purchased' : 'Purchase'}
          </button>
        </div>
      </div>

      {/* Music Player Controls - Full Width Below */}
      <div className="horizontalMusicCardPlayer">
        {/* Bouncing particles for visualization */}
        <div
          className={`horizontalMusicCardParticle horizontalMusicCardParticle1 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + bassIntensity / 80}) translate(${bassIntensity / 20}px, ${bassIntensity / 25}px)`,
            opacity: 0.3 + bassIntensity / 150,
          }}
        />
        <div
          className={`horizontalMusicCardParticle horizontalMusicCardParticle2 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + midIntensity / 60}) translate(${-midIntensity / 20}px, ${midIntensity / 30}px)`,
            opacity: 0.2 + midIntensity / 120,
          }}
        />
        <div
          className={`horizontalMusicCardParticle horizontalMusicCardParticle3 ${beatDetected ? 'beatPulse' : ''}`}
          style={{
            transform: `scale(${1 + trebleIntensity / 50}) translate(${trebleIntensity / 15}px, ${-trebleIntensity / 20}px)`,
            opacity: 0.4 + trebleIntensity / 180,
          }}
        />

        <div className="horizontalMusicCardPlayerControls">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause(track);
            }}
            className={`horizontalMusicCardPlayButton ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div
            className="horizontalMusicCardProgressBar"
            onClick={handleProgressClick}
          >
            <div
              className="horizontalMusicCardProgressFill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

