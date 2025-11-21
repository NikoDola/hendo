'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

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
  
  // Disable background effects on admin routes for better performance
  const isAdminRoute = pathname?.startsWith('/admin');
  
  // Don't render any effects on admin routes
  if (isAdminRoute) {
    return null;
  }
  
  // Only show play button on home route
  const showPlayButton = pathname === '/' || pathname === '/home';

  return (
    <>
      <ParallaxStars />
      <BitBackground showPlayButton={showPlayButton} />
    </>
  );
}

