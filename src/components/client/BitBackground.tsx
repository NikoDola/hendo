"use client";
import { useEffect, useState, useRef } from "react";
import "./BitBackground.css";

export default function BitBackground() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const [beatDetected, setBeatDetected] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(1); // Start with second song (index 1)
  const [isAtTop, setIsAtTop] = useState(true);

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

  // Handle song end and cycle to next song
  useEffect(() => {
    if (!audio) return;

    const handleSongEnd = () => {
      console.log('Song ended, cycling to next song...');
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
        const AudioContextCtor: typeof AudioContext = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext as unknown as typeof AudioContext;
        const context = new AudioContextCtor();
        const source = context.createMediaElementSource(audio);
        const analyserNode = context.createAnalyser();

        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        source.connect(analyserNode);
        analyserNode.connect(context.destination);

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
    };
  }, [audio, audioContext]);

  // Audio analysis
  useEffect(() => {
    if (!analyser || !dataArray || !isPlaying) return;

    const analyzeAudio = () => {
      // Allocate fresh frequency array matching analyser bin count
      const freqArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqArray);

      // Calculate intensity values
      const average = freqArray.reduce((sum, value) => sum + value, 0) / freqArray.length;
      setIntensity(average);

      // Analyze different frequency ranges
      const bassFreqs = Array.from(freqArray.slice(0, 8));
      const midFreqs = Array.from(freqArray.slice(8, 32));
      const trebleFreqs = Array.from(freqArray.slice(32, 64));

      const bassAverage = bassFreqs.reduce((sum, value) => sum + value, 0) / bassFreqs.length;
      const midAverage = midFreqs.reduce((sum, value) => sum + value, 0) / midFreqs.length;
      const trebleAverage = trebleFreqs.reduce((sum, value) => sum + value, 0) / trebleFreqs.length;

      setBassIntensity(bassAverage);
      setMidIntensity(midAverage);
      setTrebleIntensity(trebleAverage);

      // Beat detection
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
    console.log('BitBackground togglePlayPause clicked!', { audio, isPlaying, currentSong: musicFiles[currentSongIndex].name });

    if (audio) {
      try {
        if (isPlaying) {
          console.log('Pausing audio...');
          audio.pause();
          setIsPlaying(false);
          setIntensity(0);
          setBassIntensity(0);
          setMidIntensity(0);
          setTrebleIntensity(0);
          setBeatDetected(false);
        } else {
          console.log('Playing audio...', musicFiles[currentSongIndex].name);
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

      {/* Play button fixed on the right - OUTSIDE bit-background */}
      <div className="play-button-container" onClick={togglePlayPause}>
        {/* Song name above the button */}
        <div className="song-name">
          {musicFiles[currentSongIndex].name}
        </div>

        <div className="play-icon">
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
      </div>
    </>
  );
}
