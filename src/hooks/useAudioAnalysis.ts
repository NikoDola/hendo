import { useState, useEffect, useRef } from 'react';

export interface AudioAnalysisData {
  bassIntensity: number;
  midIntensity: number;
  trebleIntensity: number;
  beatDetected: boolean;
}

export function useAudioAnalysis(audio: HTMLAudioElement, isPlaying: boolean) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const animationRef = useRef<number | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Initialize AudioContext
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

  // Analyze audio
  useEffect(() => {
    if (!analyser || !isPlaying) return;

    // Throttle to ~30fps and reuse one buffer — on ProMotion (120Hz) iPhones an
    // uncapped rAF loop doubles the per-frame array allocations vs a 60Hz device,
    // which is a real trigger for Safari's memory-pressure tab reload.
    const TARGET_FPS = 30;
    const frameInterval = 1000 / TARGET_FPS;
    let lastFrameTime = 0;

    const analyzeAudio = (now: number) => {
      animationRef.current = requestAnimationFrame(analyzeAudio);
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      if (!freqDataRef.current || freqDataRef.current.length !== analyser.frequencyBinCount) {
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      const freqArray = freqDataRef.current;
      analyser.getByteFrequencyData(freqArray);

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;
      for (let i = 0; i < 64; i++) {
        if (i < 8) bassSum += freqArray[i];
        else if (i < 32) midSum += freqArray[i];
        else trebleSum += freqArray[i];
      }
      const bassAverage = bassSum / 8;
      const midAverage = midSum / 24;
      const trebleAverage = trebleSum / 32;

      setBassIntensity(bassAverage);
      setMidIntensity(midAverage);
      setTrebleIntensity(trebleAverage);

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
  }, [analyser, isPlaying, beatDetected]);

  return {
    bassIntensity,
    midIntensity,
    trebleIntensity,
    beatDetected,
    data: {
      bassIntensity,
      midIntensity,
      trebleIntensity,
      beatDetected
    } as AudioAnalysisData
  };
}

