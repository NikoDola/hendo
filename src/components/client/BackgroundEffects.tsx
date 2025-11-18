'use client';

import dynamic from 'next/dynamic';

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
  return (
    <>
      <ParallaxStars />
      <BitBackground />
    </>
  );
}

