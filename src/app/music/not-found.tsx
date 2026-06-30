'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import '@/components/pages/MusicNotFound.css';

export default function MusicNotFound() {
  return (
    <div className="musicNotFoundContainer">
      <div className="musicNotFoundContent">
        <h1 className="musicNotFoundTitle">
          Bit not found
        </h1>
        <p className="musicNotFoundMessage">
          The music track you&apos;re looking for doesn&apos;t exist
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
