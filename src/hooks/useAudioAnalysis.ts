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

