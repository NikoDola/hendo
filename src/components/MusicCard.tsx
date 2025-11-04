'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Play, Pause } from 'lucide-react';
import { MusicTrack } from '@/lib/music';
import './MusicCard.css';

interface MusicCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  onPlayPause: (track: MusicTrack) => void;
  onPurchase: (track: MusicTrack) => void;
  isPurchased?: boolean;
}

export default function MusicCard({
  track,
  isPlaying,
  onPlayPause,
  onPurchase,
  isPurchased = false
}: MusicCardProps) {
  const [audio] = useState(() => {
    const audioEl = new Audio();
    audioEl.loop = false;
    audioEl.volume = 1;
    // Don't set crossOrigin initially - Firebase Storage URLs may not support it
    // We'll set it only if needed for AudioContext
    audioEl.preload = 'none'; // Don't preload - load on demand
    return audioEl;
  });
  
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [intensity, setIntensity] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Initialize AudioContext and analyser when playing starts (optional - for visualizations)
  // NOTE: This must happen AFTER audio starts playing, not before
  useEffect(() => {
    if (!isPlaying || !audio.src || audio.paused) return;

    const initAudioAnalysis = async () => {
      try {
        if (audio.dataset.audioConnected === 'true') {
          console.log('🎵 AudioContext already connected');
          return;
        }

        console.log('🎵 Initializing AudioContext for visualizations...');
        
        // Set crossOrigin only when needed for AudioContext
        if (!audio.crossOrigin) {
          audio.crossOrigin = 'anonymous';
        }

        const AudioContextCtor: typeof AudioContext = 
          (window as any).AudioContext || 
          (window as any).webkitAudioContext;
        const context = new AudioContextCtor();
        
        if (context.state === 'suspended') {
          console.log('🎵 AudioContext suspended, resuming...');
          await context.resume();
        }
        
        // IMPORTANT: createMediaElementSource disconnects audio from default output
        // We MUST connect: source -> analyser -> destination to hear sound
        const source = context.createMediaElementSource(audio);
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        // Connect to destination so audio can be heard
        source.connect(analyserNode);
        analyserNode.connect(context.destination);
        
        console.log('🎵 AudioContext connected - audio should still play through destination');

        audio.dataset.audioConnected = 'true';
        setAudioContext(context);
        setAnalyser(analyserNode);
      } catch (error) {
        console.error('🎵 AudioContext initialization failed (will continue without visualizations):', error);
        // Don't throw - audio can still play without visualizations
      }
    };

    // Wait a bit for audio to start playing first
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

      const average = freqArray.reduce((sum, value) => sum + value, 0) / freqArray.length;
      setIntensity(average);

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
          console.log('🎵 MusicCard: Attempting to play audio');
          console.log('🎵 URL:', track.audioFileUrl);
          console.log('🎵 Current audio src:', audio.src);
          console.log('🎵 Audio volume:', audio.volume);
          console.log('🎵 Audio muted:', audio.muted);
          
          // Always set source fresh when playing
          if (audio.src !== track.audioFileUrl) {
            console.log('🎵 Setting new audio source');
            audio.src = track.audioFileUrl;
            audio.load();
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.error('🎵 Audio load timeout');
                reject(new Error('Audio load timeout'));
              }, 10000);
              
              const cleanup = () => {
                clearTimeout(timeout);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('loadedmetadata', handleMetadata);
                audio.removeEventListener('error', handleError);
                audio.removeEventListener('loadstart', handleLoadStart);
              };
              
              const handleLoadStart = () => {
                console.log('🎵 Audio load started');
              };
              
              const handleMetadata = () => {
                console.log('🎵 Audio metadata loaded, readyState:', audio.readyState);
                console.log('🎵 Audio duration:', audio.duration);
                if (audio.readyState >= 2) {
                  cleanup();
                  resolve(void 0);
                }
              };
              
              const handleCanPlay = () => {
                console.log('🎵 Audio can play, readyState:', audio.readyState);
                cleanup();
                resolve(void 0);
              };
              
              const handleError = (e: Event) => {
                cleanup();
                const error = audio.error;
                console.error('🎵 Audio load error:', {
                  code: error?.code,
                  message: error?.message,
                  url: track.audioFileUrl
                });
                reject(new Error(`Audio load failed: ${error?.message || 'Unknown error'}`));
              };
              
              audio.addEventListener('loadstart', handleLoadStart, { once: true });
              audio.addEventListener('canplay', handleCanPlay, { once: true });
              audio.addEventListener('loadedmetadata', handleMetadata, { once: true });
              audio.addEventListener('error', handleError, { once: true });
            });
          }
          
          // Ensure volume is set
          audio.volume = 1;
          audio.muted = false;
          
          console.log('🎵 Calling audio.play()...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('🎵 Audio playback started successfully!');
            console.log('🎵 Audio playing:', !audio.paused);
            console.log('🎵 Audio currentTime:', audio.currentTime);
            
            // Verify it's actually playing
            setTimeout(() => {
              console.log('🎵 After 500ms - Playing:', !audio.paused, 'CurrentTime:', audio.currentTime);
            }, 500);
          }
        } catch (error: any) {
          console.error('🎵 Error playing audio:', error);
          console.error('🎵 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          // Try direct play as fallback
          try {
            console.log('🎵 Trying direct play fallback...');
            audio.play().catch((e) => {
              console.error('🎵 Direct play also failed:', e);
            });
          } catch (fallbackError) {
            console.error('🎵 Fallback also failed:', fallbackError);
          }
        }
      } else {
        console.log('🎵 Pausing audio');
        audio.pause();
        setIntensity(0);
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
    <div className="musicCard">
      <div className="musicCardContent">
        <h3 className="musicCardTitle">{track.title}</h3>
        <p className="musicCardDescription">{track.description}</p>
        
        <div className="musicCardTags">
          {track.hashtags.map((tag, index) => (
            <span key={index} className="musicCardTag">
              #{tag}
            </span>
          ))}
        </div>

        <div className="musicCardFooter">
          <span className="musicCardPrice">{formatPrice(track.price)}</span>
        </div>

        {/* Bit-style player with bouncing particles */}
        <div className="musicCardPlayer">
          {/* Bouncing particles */}
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

          {/* Controls */}
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
              onClick={handleProgressClick}
            >
              <div
                className="musicCardProgressFill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => !isPurchased && onPurchase(track)}
          className={`musicCardPurchaseButton ${isPurchased ? 'musicCardPurchaseButtonPurchased' : ''}`}
          disabled={isPurchased}
        >
          <ShoppingCart size={20} />
          {isPurchased ? 'Already Purchased' : 'Purchase Track'}
        </button>
      </div>
    </div>
  );
}

