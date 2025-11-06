import { useState, useEffect } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
}

export function useAudioPlayer(audioUrl: string, shouldPlay: boolean) {
  const [audio] = useState(() => {
    const audioEl = new Audio();
    audioEl.loop = false;
    audioEl.volume = 1;
    audioEl.preload = 'none';
    return audioEl;
  });

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (shouldPlay) {
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
      }
      audio.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [shouldPlay, audioUrl, audio]);

  useEffect(() => {
    const updateProgress = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audio]);

  useEffect(() => {
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  return {
    audio,
    progress,
    duration,
    currentTime,
    state: {
      isPlaying: shouldPlay,
      progress,
      duration,
      currentTime
    } as AudioPlayerState
  };
}

