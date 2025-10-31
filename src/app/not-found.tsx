'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, Home } from 'lucide-react';
import '@/components/pages/NotFound.css';

export default function NotFound() {
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
    <div className="notFoundContainer">
      <div className="notFoundContent">
        <h1 
          className="notFoundTitle"
          style={{ color }}
        >
          404
        </h1>
        <p className="notFoundMessage">
          Page not found
        </p>
        <div className="notFoundActions">
          <Link
            href="/"
            className="notFoundButton"
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            href="/music"
            className="notFoundButton"
          >
            <Music size={20} />
            Browse Music
          </Link>
        </div>
      </div>
    </div>
  );
}
