'use client';

import Link from 'next/link';
import { Music, Home } from 'lucide-react';
import '@/components/pages/NotFound.css';

export default function NotFound() {
  return (
    <div className="notFoundContainer">
      <div className="notFoundContent">
        <h1 className="notFoundTitle" data-text="404">
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
