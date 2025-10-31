'use client';

import { useState } from 'react';
import { MusicTrack } from '@/lib/music';
import { Edit, Trash2, Play, Pause, Download, FileText } from 'lucide-react';

interface MusicListProps {
  tracks: MusicTrack[];
  onEdit: (track: MusicTrack) => void;
  onDelete: (trackId: string) => void;
  isLoading?: boolean;
}

export default function MusicList({ tracks, onEdit, onDelete, isLoading = false }: MusicListProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrack === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setPlayingTrack(null);
    } else {
      // Stop current track and play new one
      if (audioElement) {
        audioElement.pause();
      }

      const audio = new Audio(track.audioFileUrl);
      audio.play();
      setAudioElement(audio);
      setPlayingTrack(track.id);

      audio.onended = () => {
        setPlayingTrack(null);
        setAudioElement(null);
      };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No music tracks found</p>
        <p className="text-gray-400 text-sm">Upload your first track to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <div key={track.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-800">{track.title}</h3>
                <span className="text-lg font-bold text-green-600">{formatPrice(track.price)}</span>
              </div>

              <p className="text-gray-600 mb-3">{track.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {track.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Created: {formatDate(track.createdAt)}</span>
                <span>By: {track.createdBy}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {/* Play/Pause Button */}
              <button
                onClick={() => handlePlayPause(track)}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title={playingTrack === track.id ? 'Pause' : 'Play'}
              >
                {playingTrack === track.id ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* Download Button */}
              <a
                href={track.audioFileUrl}
                download={track.audioFileName}
                className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                title="Download Audio"
              >
                <Download size={20} />
              </a>

              {/* PDF Button */}
              {track.pdfFileUrl && (
                <a
                  href={track.pdfFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                  title="View PDF"
                >
                  <FileText size={20} />
                </a>
              )}

              {/* Edit Button */}
              <button
                onClick={() => onEdit(track)}
                className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                title="Edit Track"
              >
                <Edit size={20} />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => onDelete(track.id)}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="Delete Track"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
