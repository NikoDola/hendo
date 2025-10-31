'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, Home, Search } from 'lucide-react';
import '@/components/pages/MusicNotFound.css';

export default function MusicNotFound() {
  const [color, setColor] = useState('var(--theme-color)');

  useEffect(() => {
    const colors = [
      'var(--theme-color)',
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#feca57',
      '#ff9ff3',
      '#54a0ff'
    ];

    const interval = setInterval(() => {
      setColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="musicNotFoundContainer">
      <div className="musicNotFoundContent">
        <h1 
          className="musicNotFoundTitle"
          style={{ color }}
        >
          Bit not found
        </h1>
        <p className="musicNotFoundMessage">
          The music track you're looking for doesn't exist
        </p>
        <div className="musicNotFoundActions">
          <Link
            href="/"
            className="musicNotFoundButton"
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            href="/music"
            className="musicNotFoundButton"
          >
            <Search size={20} />
            Browse Music
          </Link>
        </div>
      </div>
    </div>
  );
}
