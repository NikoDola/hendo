import { useRef, useEffect } from 'react';
import type { AudioAnalysisData } from '@/hooks/useAudioAnalysis';
import './MusicCardVisualizer.css';

interface MusicCardVisualizerProps {
  analysisData: AudioAnalysisData;
  isPlaying: boolean;
}

export default function MusicCardVisualizer({ analysisData, isPlaying }: MusicCardVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { bassIntensity, midIntensity, trebleIntensity } = analysisData;
    const width = canvas.width;
    const height = canvas.height;

    // Draw frequency bars
    const barWidth = width / 3;
    const maxBarHeight = height * 0.8;

    // Bass
    ctx.fillStyle = `rgba(255, 99, 132, ${bassIntensity / 255})`;
    ctx.fillRect(0, height - (bassIntensity / 255) * maxBarHeight, barWidth, (bassIntensity / 255) * maxBarHeight);

    // Mid
    ctx.fillStyle = `rgba(54, 162, 235, ${midIntensity / 255})`;
    ctx.fillRect(barWidth, height - (midIntensity / 255) * maxBarHeight, barWidth, (midIntensity / 255) * maxBarHeight);

    // Treble
    ctx.fillStyle = `rgba(255, 206, 86, ${trebleIntensity / 255})`;
    ctx.fillRect(barWidth * 2, height - (trebleIntensity / 255) * maxBarHeight, barWidth, (trebleIntensity / 255) * maxBarHeight);
  }, [analysisData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className={`musicCardVisualizerCanvas ${isPlaying ? 'playing' : 'paused'}`}
    />
  );
}

