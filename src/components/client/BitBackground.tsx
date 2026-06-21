"use client";
import { useEffect, useState, useRef } from "react";
import "./BitBackground.css";

interface BitBackgroundProps {
  showPlayButton?: boolean;
}

export default function BitBackground({ showPlayButton = true }: BitBackgroundProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const animationRef = useRef<number | null>(null);
  const [beatDetected, setBeatDetected] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(1); // Start with second song (index 1)
  const [isAtTop, setIsAtTop] = useState(true);
  const [progress, setProgress] = useState(0);

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent click from reaching play button
    if (!audio) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    const clickPercent = (clickX / progressBarWidth) * 100;

    // Calculate the new time position
    const newTime = (clickPercent / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(clickPercent);

    // Don't change the playing state - keep it as it was
    // If it was playing, it continues playing
    // If it was paused, it stays paused
  };

  // Music files array with cool song names
  const musicFiles = [
    {
      path: '/music/WhatsApp Audio 2025-10-18 at 1.12.24 PM.mp4',
      name: 'Neon Dreams'
    },
    {
      path: '/music/WhatsApp Audio 2025-10-18 at 1.12.32 PM.mp4',
      name: 'Cyber Pulse'
    },
    {
      path: '/music/WhatsApp Audio 2025-10-18 at 9.14.31 AM.mp4',
      name: 'Digital Sunset'
    }
  ];

  // Initialize audio with current song
  useEffect(() => {
    const audioElement = new Audio(musicFiles[currentSongIndex].path);
    audioElement.loop = false; // We'll handle looping manually to cycle through songs
    setAudio(audioElement);

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [currentSongIndex]);

  // Update progress bar
  useEffect(() => {
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
      }
    };

    const interval = setInterval(updateProgress, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [audio, isPlaying]);

  // Handle song end and cycle to next song
  useEffect(() => {
    if (!audio) return;

    const handleSongEnd = () => {
      const nextIndex = (currentSongIndex + 1) % musicFiles.length;
      setCurrentSongIndex(nextIndex);
    };

    const handleSongLoad = () => {
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('ended', handleSongEnd);
    audio.addEventListener('canplay', handleSongLoad);

    return () => {
      audio.removeEventListener('ended', handleSongEnd);
      audio.removeEventListener('canplay', handleSongLoad);
    };
  }, [audio, currentSongIndex, isPlaying]);

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audio) return;

    const initAudioAnalysis = async () => {
      try {
        // Check if audio element is already connected to prevent duplicate connections
        if (audio.dataset.audioConnected === 'true') {
          return;
        }

        const AudioContextCtor: typeof AudioContext = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext as unknown as typeof AudioContext;
        const context = new AudioContextCtor();
        const source = context.createMediaElementSource(audio);
        const analyserNode = context.createAnalyser();

        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        source.connect(analyserNode);
        analyserNode.connect(context.destination);

        // Mark audio element as connected
        audio.dataset.audioConnected = 'true';

        setAudioContext(context);
        setAnalyser(analyserNode);
        setDataArray(new Uint8Array(analyserNode.frequencyBinCount));
      } catch (error) {
        console.error('Audio analysis initialization error:', error);
      }
    };

    initAudioAnalysis();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      // Reset connection flag when cleaning up
      if (audio) {
        audio.dataset.audioConnected = 'false';
      }
    };
  }, [audio]);

  // Audio analysis
  useEffect(() => {
    if (!analyser || !dataArray || !isPlaying) return;

    // Throttle to ~30fps — on ProMotion (120Hz) iPhones an uncapped rAF loop
    // doubles the per-frame work vs a 60Hz device, a real trigger for Safari's
    // memory-pressure tab reload. Reuse the pre-allocated dataArray buffer
    // instead of allocating a fresh Uint8Array every frame.
    const TARGET_FPS = 30;
    const frameInterval = 1000 / TARGET_FPS;
    let lastFrameTime = 0;

    const analyzeAudio = (now: number) => {
      animationRef.current = requestAnimationFrame(analyzeAudio);
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      const freqArray = dataArray;
      analyser.getByteFrequencyData(freqArray);

      let overallSum = 0;
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;
      for (let i = 0; i < freqArray.length; i++) {
        const value = freqArray[i];
        overallSum += value;
        if (i < 8) bassSum += value;
        else if (i < 32) midSum += value;
        else if (i < 64) trebleSum += value;
      }

      const average = overallSum / freqArray.length;
      setIntensity(average);

      const bassAverage = bassSum / 8;
      const midAverage = midSum / 24;
      const trebleAverage = trebleSum / 32;

      setBassIntensity(bassAverage);
      setMidIntensity(midAverage);
      setTrebleIntensity(trebleAverage);

      // Beat detection
      if (bassAverage > 50 && !beatDetected) {
        setBeatDetected(true);
        setTimeout(() => setBeatDetected(false), 200);
      }
    };

    animationRef.current = requestAnimationFrame(analyzeAudio);

    // Pause the visualization loop (not audio playback) while the tab is hidden.
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else if (animationRef.current === null) {
        lastFrameTime = 0;
        animationRef.current = requestAnimationFrame(analyzeAudio);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, dataArray, isPlaying, beatDetected]);

  // Scroll detection - hide beat indicator when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsAtTop(scrollTop === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const togglePlayPause = async () => {

    if (audio) {
      try {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
          setIntensity(0);
          setBassIntensity(0);
          setMidIntensity(0);
          setTrebleIntensity(0);
          setBeatDetected(false);
        } else {
          await audio.play();
          setIsPlaying(true);

          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
        }
      } catch (error) {
        console.error('Audio play error:', error);
      }
    } else {
      console.error('No audio element found');
    }
  };

  return (
    <>
      <div className="bit-background">

        {/* Animated particles that respond to music */}
        <div
          className={`bit-particle bit-1 ${beatDetected ? 'beat-pulse' : ''}`}
          style={{
            transform: `scale(${1 + bassIntensity / 50}) translate(${bassIntensity / 10}px, ${bassIntensity / 15}px)`,
            opacity: 0.3 + bassIntensity / 100,
            filter: `blur(${bassIntensity / 50}px)`
          }}
        />
        <div
          className={`bit-particle bit-2 ${beatDetected ? 'beat-pulse' : ''}`}
          style={{
            transform: `scale(${1 + midIntensity / 40}) translate(${-midIntensity / 12}px, ${midIntensity / 20}px)`,
            opacity: 0.2 + midIntensity / 80,
            filter: `blur(${midIntensity / 60}px)`
          }}
        />
        <div
          className={`bit-particle bit-3 ${beatDetected ? 'beat-pulse' : ''}`}
          style={{
            transform: `scale(${1 + trebleIntensity / 30}) translate(${trebleIntensity / 8}px, ${-trebleIntensity / 10}px)`,
            opacity: 0.4 + trebleIntensity / 125,
            filter: `blur(${trebleIntensity / 40}px)`
          }}
        />
        <div
          className={`bit-particle bit-4 ${beatDetected ? 'beat-pulse' : ''}`}
          style={{
            transform: `scale(${1 + intensity / 45}) translate(${-intensity / 15}px, ${-intensity / 18}px)`,
            opacity: 0.1 + intensity / 50,
            filter: `blur(${intensity / 55}px)`
          }}
        />

        {/* Beat indicator - only visible when at top of page */}
        {beatDetected && isAtTop && (
          <div className="beat-indicator">
            <div className="beat-ring" />
            <div className="beat-ring" />
            <div className="beat-ring" />
          </div>
        )}
      </div>

      {/* Play button fixed on the right - COMMENTED OUT */}
      {/* {showPlayButton && (
        <div className="play-button-container" onClick={togglePlayPause}>
          <div className="song-name">
            {musicFiles[currentSongIndex].name}
          </div>

          <div className={`play-icon ${isPlaying ? 'playing' : ''}`}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </div>

          <div className="music-progress-container">
            <div
              className="music-progress-bar"
              onClick={handleProgressClick}
            >
              <div
                className="music-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
