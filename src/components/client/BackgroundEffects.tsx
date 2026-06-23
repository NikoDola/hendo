'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
// ZoomingStars is now pure CSS (no client state/effects), so it can render
// statically without a client-only dynamic import.
import ZoomingStars from "@/components/client/ZoomingStars";

// Lazy load heavy visual components for better performance
const ParallaxStars = dynamic(() => import("@/components/client/ParallaxStars"), {
  ssr: false,
  loading: () => null,
});

const BitBackground = dynamic(() => import("@/components/client/BitBackground"), {
  ssr: false,
  loading: () => null,
});

export default function BackgroundEffects() {
  const pathname = usePathname();

  // Debug kill-switch: open the site with ?nofx=1 to disable ALL background
  // effects (stars + bit background). If the Safari self-reloads stop with the
  // effects off, they're the memory culprit. Persisted so it survives the
  // auto-reloads; clear it with ?nofx=0. Starts false to avoid an SSR mismatch.
  const [fxOff, setFxOff] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('nofx') === '1') localStorage.setItem('nofx', '1');
      if (params.get('nofx') === '0') localStorage.removeItem('nofx');
      setFxOff(localStorage.getItem('nofx') === '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Disable background effects on admin routes for better performance
  const isAdminRoute = pathname?.startsWith('/admin');

  // Don't render any effects on admin routes, or when the kill-switch is on
  if (isAdminRoute || fxOff) {
    return null;
  }
  
  // Only show play button on home route
  const showPlayButton = pathname === '/' || pathname === '/home';

  return (
    <>
      <ParallaxStars />
      <BitBackground showPlayButton={showPlayButton} />
      <ZoomingStars />
    </>
  );
}

